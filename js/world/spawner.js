import { TANK_SIZE, ENEMY_SPAWN_INTERVAL_MS, FIRST_SPAWN_DELAY_MS } from '../config.js';
import { ENEMY_TYPES, createEnemy } from '../tanks/enemytypes.js';
import { intersects } from '../core/collision.js';

/** Ehitab { basic: 3, fast: 2 } -> segatud järjekord, boss(id) alati esimesena. */
function buildQueue(enemyCounts) {
    const bosses = [];
    const others = [];
    for (const [typeKey, count] of Object.entries(enemyCounts)) {
        if (!ENEMY_TYPES[typeKey]) throw new Error(`Tundmatu vaenlase tüüp: "${typeKey}" (enemytypes.js)`);
        const target = ENEMY_TYPES[typeKey].behavior === 'boss' ? bosses : others;
        for (let i = 0; i < count; i++) target.push(typeKey);
    }
    for (let i = others.length - 1; i > 0; i--) {       // Fisher-Yates
        const j = Math.floor(Math.random() * (i + 1));
        [others[i], others[j]] = [others[j], others[i]];
    }
    return [...bosses, ...others];
}

/** Vaenlaste järjekord ja sünnitamine: piirab korraga laual olevate arvu ja sünnib ainult vabasse punkti. */
export class Spawner {
    constructor(game, levelDefinition) {
        this.game = game;
        this.queue = buildQueue(levelDefinition.enemies);
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
        const size = ENEMY_TYPES[typeKey].size ?? TANK_SIZE;
        const spawn = this.findFreeSpawn(size);
        if (!spawn) return;                     // proovi järgmisel sammul uuesti

        this.queue.shift();
        this.game.enemies.push(createEnemy(typeKey, this.game, spawn.x, spawn.y));
        this.timer = 0;
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
