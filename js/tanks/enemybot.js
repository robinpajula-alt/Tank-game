import { Tank } from './tank.js';
import {
    TEAM, TANK_SIZE, DIRECTIONS, ENEMY_DIRECTION_CHANGE_MS, ENEMY_REACTION_MS
} from '../config.js';

// Juhuslik suund, kallutus baasi poole (alla).
const DIRECTION_WEIGHTS = { down: 50, left: 25, right: 15, up: 10 };

/**
 * Robot-tank. Vaenlasena ründab mängijat ja baasi; type.team = TEAM.PLAYER korral
 * on see sama loogikaga "liitlane" (kasutab menüü taustamaailm).
 */
export class EnemyBot extends Tank {
    constructor(game, x, y, type) {
        super(game, x, y, {
            team: type.team ?? TEAM.ENEMY,
            spriteSet: type.spriteSet,
            speed: type.speed,
            health: type.health,
            size: type.size ?? TANK_SIZE,
            bulletColor: type.bulletColor ?? '#ff4500',
            bulletSprite: type.bulletSprite ?? 'enemy',
            fallbackColor: type.fallbackColor,
            filter: type.filter ?? null
            // shootSound jääb tahtlikult määramata: robotite lask on hääletu
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

    /** Vastasmeeskonna tankid (vaenlasele: mängija). */
    get opponents() {
        return this.game.tanks.filter(t => t.team !== this.team);
    }

    think(deltaTime) {
        this.isMoving = this.moveForward(deltaTime);
        this.moveTimer += deltaTime;

        if (!this.isMoving || this.moveTimer > ENEMY_DIRECTION_CHANGE_MS) {
            this.chooseNewDirection();
            this.moveTimer = 0;
        }

        // Näeb vastast otse ees: tulistab peagi.
        if (this.isFacingOpponent()) this.shootTimer = Math.min(this.shootTimer, ENEMY_REACTION_MS);

        if (this.tryShoot()) {
            this.shootCooldown = this.rollShootDelay();
            this.shootTimer = this.shootCooldown;
        }
    }

    /** Kas mõni vastane on selle tanki toru ees (samal joonel)? Seinu ei arvesta. */
    isFacingOpponent() {
        return this.opponents.some(p => {
            if (this.direction === 'up' || this.direction === 'down') {
                const aligned = p.x < this.x + this.width && p.x + p.width > this.x;
                return aligned && (this.direction === 'down' ? p.y > this.y : p.y < this.y);
            }
            const aligned = p.y < this.y + this.height && p.y + p.height > this.y;
            return aligned && (this.direction === 'right' ? p.x > this.x : p.x < this.x);
        });
    }

    chooseNewDirection() {
        if (Math.random() < this.aggression && this.steerTowardTarget()) return;
        this.chooseRandomDirection();
    }

    /** Lähim vastane või (vaenlasel) baas, 50/50. Tagastab false, kui sihtmärki pole. */
    steerTowardTarget() {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const opponents = this.opponents;
        const base = this.team === TEAM.ENEMY ? this.game.level.baseCenter : null;

        let target = null;
        if (base && (opponents.length === 0 || Math.random() < 0.5)) {
            target = base;
        } else if (opponents.length > 0) {
            const distance = t => Math.hypot(t.x + t.width / 2 - cx, t.y + t.height / 2 - cy);
            const nearest = opponents.reduce((best, t) => (distance(t) < distance(best) ? t : best));
            target = { x: nearest.x + nearest.width / 2, y: nearest.y + nearest.height / 2 };
        }
        if (!target) return false;

        const dx = target.x - cx;
        const dy = target.y - cy;
        const horizontal = dx > 0 ? 'right' : 'left';
        const vertical = dy > 0 ? 'down' : 'up';
        const options = Math.abs(dx) > Math.abs(dy) ? [horizontal, vertical] : [vertical, horizontal];

        this.direction = options.find(d => d !== this.direction);   // alati teistsugune kui praegune
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
