import { Tank } from './tank.js';
import {
    TEAM, TANK_SIZE, DIRECTIONS, ENEMY_DIRECTION_CHANGE_MS, ENEMY_REACTION_MS
} from '../config.js';

// Juhuslik suund, kallutus baasi poole (alla).
const DIRECTION_WEIGHTS = { down: 50, left: 25, right: 15, up: 10 };

export class EnemyBot extends Tank {
    constructor(game, x, y, type) {
        super(game, x, y, {
            team: TEAM.ENEMY,
            spriteSet: type.spriteSet,
            speed: type.speed,
            health: type.health,
            size: type.size ?? TANK_SIZE,
            bulletColor: type.bulletColor ?? '#ff4500',
            fallbackColor: type.fallbackColor,
            filter: type.filter ?? null
            // shootSound jääb tahtlikult määramata: vaenlase lask on hääletu
        });
        this.shootDelayRange = type.shootDelay;
        this.aggression = type.aggression ?? 0;
        this.direction = 'down';
        this.moveTimer = 0;
        this.isBoss = false;

        this.shootCooldown = this.rollShootDelay();
        this.shootTimer = this.shootCooldown;
    }

    rollShootDelay() {
        const [min, max] = this.shootDelayRange;
        return min + Math.random() * (max - min);
    }

    think(deltaTime) {
        this.isMoving = this.moveForward(deltaTime);
        this.moveTimer += deltaTime;

        if (!this.isMoving || this.moveTimer > ENEMY_DIRECTION_CHANGE_MS) {
            this.chooseNewDirection();
            this.moveTimer = 0;
        }

        // Näeb mängijat otse ees: tulistab peagi.
        if (this.isFacingPlayer()) this.shootTimer = Math.min(this.shootTimer, ENEMY_REACTION_MS);

        if (this.tryShoot()) {
            this.shootCooldown = this.rollShootDelay();
            this.shootTimer = this.shootCooldown;
        }
    }

    /** Kas mängija on selle tanki toru ees (samal joonel)? Seinu ei arvesta. */
    isFacingPlayer() {
        const p = this.game.player;
        if (!p || p.markedForDeletion) return false;

        if (this.direction === 'up' || this.direction === 'down') {
            const aligned = p.x < this.x + this.width && p.x + p.width > this.x;
            return aligned && (this.direction === 'down' ? p.y > this.y : p.y < this.y);
        }
        const aligned = p.y < this.y + this.height && p.y + p.height > this.y;
        return aligned && (this.direction === 'right' ? p.x > this.x : p.x < this.x);
    }

    chooseNewDirection() {
        if (Math.random() < this.aggression && this.steerTowardTarget()) return;
        this.chooseRandomDirection();
    }

    /** Sõidab mängija või baasi poole (50/50). Tagastab alati teistsuguse suuna kui praegune. */
    steerTowardTarget() {
        const player = this.game.player;
        const base = this.game.level.baseCenter;
        const target = base && Math.random() < 0.5
            ? base
            : { x: player.x + player.width / 2, y: player.y + player.height / 2 };

        const dx = target.x - (this.x + this.width / 2);
        const dy = target.y - (this.y + this.height / 2);
        const horizontal = dx > 0 ? 'right' : 'left';
        const vertical = dy > 0 ? 'down' : 'up';
        const options = Math.abs(dx) > Math.abs(dy) ? [horizontal, vertical] : [vertical, horizontal];

        this.direction = options.find(d => d !== this.direction);
        return true;
    }

    /** Valib alati teistsuguse suuna kui praegune. */
    chooseRandomDirection() {
        const options = Object.keys(DIRECTIONS).filter(d => d !== this.direction);
        const total = options.reduce((sum, d) => sum + DIRECTION_WEIGHTS[d], 0);
        let roll = Math.random() * total;
        for (const d of options) {
            roll -= DIRECTION_WEIGHTS[d];
            if (roll <= 0) { this.direction = d; return; }
        }
        this.direction = options[options.length - 1];
    }

    die() {
        super.die();
        this.game.onEnemyKilled(this);
    }
}
