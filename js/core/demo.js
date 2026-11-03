import { levels, TEAM, STEP_MS, MAX_FRAME_MS, TANK_SIZE } from '../config.js';
import { Level } from '../world/level.js';
import { EnemyBot } from '../tanks/enemybot.js';
import { ENEMY_TYPES } from '../tanks/enemytypes.js';
import { intersects } from './collision.js';
import { simulateBullets } from './combat.js';

// Menüü taustamaailm: esimene tase, kus robotid (mängija-meeskond vs vaenlased) võitlevad omavahel.
// Ei mõjuta päris mängu: oma tase, oma tankid, oma kuulid, heli on välja lülitatud.
const ALLY_TYPE = {
    team: TEAM.PLAYER, spriteSet: 'player', speed: 95, health: 1,
    shootDelay: [900, 1700], aggression: 0.6,
    bulletColor: '#ffff00', bulletSprite: 'player', fallbackColor: '#00ff00'
};
const ENEMY_KEYS = ['basic', 'basic', 'fast', 'armored'];
const ALLY_SPAWNS = [{ col: 4, row: 14 }, { col: 10, row: 14 }];
const MAX_ENEMIES = 4;
const MAX_ALLIES = 2;
const SPAWN_EVERY_MS = 1500;
const RESET_EVERY_MS = 60000;      // taasta kaart, et seinad ei kaoks lõplikult

export class DemoWorld {
    constructor() {
        this.silent = true;        // Tank.takeDamage ei mängi heli
        this.reset();
    }

    reset() {
        this.level = new Level(levels[0], this);
        this.bullets = [];
        this.allies = [];
        this.enemies = [];
        this.spawnTimer = SPAWN_EVERY_MS;
        this.age = 0;
        this.accumulator = 0;
        this.needsReset = false;
    }

    // ----- Liides, mida tankid ja plokid kasutavad -----
    get tanks() {
        return [...this.allies, ...this.enemies].filter(t => !t.markedForDeletion);
    }
    onEnemyKilled() {}
    onBaseDestroyed() { this.needsReset = true; }

    // ----- Tsükkel -----
    update(deltaTime) {
        this.accumulator += Math.min(deltaTime, MAX_FRAME_MS);
        while (this.accumulator >= STEP_MS) {
            this.step(STEP_MS);
            this.accumulator -= STEP_MS;
        }
    }

    step(dt) {
        this.allies.forEach(t => t.update(dt));
        this.enemies.forEach(t => t.update(dt));

        this.spawnTimer += dt;
        if (this.spawnTimer >= SPAWN_EVERY_MS) {
            this.spawnTimer = 0;
            this.fill();
        }

        simulateBullets(this, dt);

        this.allies = this.allies.filter(t => !t.markedForDeletion);
        this.enemies = this.enemies.filter(t => !t.markedForDeletion);
        this.bullets = this.bullets.filter(b => !b.markedForDeletion);
        this.level.removeDestroyed();

        this.age += dt;
        if (this.needsReset || this.age > RESET_EVERY_MS) this.reset();
    }

    fill() {
        if (this.enemies.length < MAX_ENEMIES) {
            const cells = this.level.enemySpawnCells;
            const key = ENEMY_KEYS[Math.floor(Math.random() * ENEMY_KEYS.length)];
            this.trySpawn(this.enemies, ENEMY_TYPES[key], cells[Math.floor(Math.random() * cells.length)], 'down');
        }
        if (this.allies.length < MAX_ALLIES) {
            const cell = ALLY_SPAWNS[Math.floor(Math.random() * ALLY_SPAWNS.length)];
            this.trySpawn(this.allies, ALLY_TYPE, cell, 'up');
        }
    }

    trySpawn(list, type, cell, direction) {
        const position = this.level.cellToPosition(cell);
        const rect = { x: position.x, y: position.y, width: TANK_SIZE, height: TANK_SIZE };
        if (this.level.collidesWithBlocks(rect) || this.tanks.some(t => intersects(rect, t))) return;
        const bot = new EnemyBot(this, position.x, position.y, type);
        bot.direction = direction;
        list.push(bot);
    }

    draw(ctx) {
        this.level.drawGround(ctx);
        this.level.drawBlocks(ctx);
        this.allies.forEach(t => t.draw(ctx));
        this.enemies.forEach(t => t.draw(ctx));
        this.bullets.forEach(b => b.draw(ctx));
    }
}
