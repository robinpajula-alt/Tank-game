import { TANK_SIZE, ENEMY_SPAWN_INTERVAL_MS, FIRST_SPAWN_DELAY_MS } from '../config.js';
import { ENEMY_TYPES, createEnemy } from '../tanks/enemytypes.js';
import { intersects } from '../core/collision.js';

function buildQueue(enemyCounts, bossLast = false) {
    const bosses = [];
    const others = [];
    for (const [typeKey, count] of Object.entries(enemyCounts)) {
        if (!ENEMY_TYPES[typeKey]) throw new Error(`Tundmatu vaenlase tüüp: "${typeKey}" (enemytypes.js)`);
        const target = ENEMY_TYPES[typeKey].behavior === 'boss' ? bosses : others;
        for (let i = 0; i < count; i++) target.push(typeKey);
    }
    for (let i = others.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [others[i], others[j]] = [others[j], others[i]];
    }
    return bossLast ? [...others, ...bosses] : [...bosses, ...others];
}

export class Spawner {
    constructor(game, levelDefinition) {
        this.game = game;
        this.bossLast = !!levelDefinition.bossLast;
        this.bossSpawn = levelDefinition.bossSpawn || null;
        this.queue = buildQueue(levelDefinition.enemies, this.bossLast);
        this.maxOnScreen = levelDefinition.maxEnemiesOnScreen;
        this.timer = ENEMY_SPAWN_INTERVAL_MS - FIRST_SPAWN_DELAY_MS;
    }

    get isFinished() {
        return this.queue.length === 0;
    }

    clear() {
        this.queue.length = 0;
    }

    update(deltaTime) {
        if (this.isFinished) return;
        this.timer += deltaTime;
        if (this.timer < ENEMY_SPAWN_INTERVAL_MS) return;
        if (this.game.enemies.length >= this.maxOnScreen) return;

        const typeKey = this.queue[0];
        if (ENEMY_TYPES[typeKey].behavior === 'boss' && this.bossSpawn) {
            if (this.game.enemies.length > 0) return;
            const spot = this.game.level.cellToPosition(this.bossSpawn, ENEMY_TYPES[typeKey].size ?? TANK_SIZE);
            if (!this.isFree(spot, ENEMY_TYPES[typeKey].size ?? TANK_SIZE)) return;
            this.queue.shift();
            const boss = createEnemy(typeKey, this.game, spot.x, spot.y);
            this.game.enemies.push(boss);
            if (this.game.onBossArrived) this.game.onBossArrived(boss);
            this.timer = 0;
            return;
        }

        if (this.bossLast && ENEMY_TYPES[typeKey].behavior === 'boss' && this.game.enemies.length > 0) return;
        const size = ENEMY_TYPES[typeKey].size ?? TANK_SIZE;
        const spawn = this.findFreeSpawn(size);
        if (!spawn) return;

        this.queue.shift();
        const enemy = createEnemy(typeKey, this.game, spawn.x, spawn.y);
        this.game.enemies.push(enemy);
        if (enemy.isBoss && this.game.onBossArrived) this.game.onBossArrived(enemy);
        this.timer = 0;
    }

    spawnNext() {
        if (this.isFinished) return false;
        const typeKey = this.queue[0];
        const spawn = this.findFreeSpawn(ENEMY_TYPES[typeKey].size ?? TANK_SIZE);
        if (!spawn) return false;
        this.queue.shift();
        const enemy = createEnemy(typeKey, this.game, spawn.x, spawn.y);
        this.game.enemies.push(enemy);
        if (enemy.isBoss && this.game.onBossArrived) this.game.onBossArrived(enemy);
        return true;
    }

    findFreeSpawn(size) {
        const cells = this.game.level.enemySpawnCells;
        const start = Math.floor(Math.random() * cells.length);
        for (let i = 0; i < cells.length; i++) {
            const position = this.game.level.cellToPosition(cells[(start + i) % cells.length], size);
            if (this.isFree(position, size)) return position;
        }
        return null;
    }

    isFree(position, size) {
        const rect = { x: position.x, y: position.y, width: size, height: size };
        return !this.game.level.collidesWithBlocks(rect) &&
               !this.game.tanks.some(tank => intersects(rect, tank));
    }
}
