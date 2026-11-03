import { Tank } from './tank.js';
import { assets } from '../assets.js';
import {
    TEAM, TANK_SIZE, DIRECTIONS, ENEMY_DIRECTION_CHANGE_MS, ENEMY_REACTION_MS, FEATURES
} from '../config.js';

function resolveSprite(game, type) {
    if (FEATURES.newTankSprites) {
        const biome = game.level && game.level.biome;
        const options = [type.newSprite, type.biomeSprite && biome && `${biome}_${type.biomeSprite}`];
        for (const set of options) {
            if (set && assets.images.tanks[set]) return { spriteSet: set, filter: null };
        }
    }
    return { spriteSet: type.spriteSet, filter: type.filter ?? null };
}

const DIRECTION_WEIGHTS = { down: 50, left: 25, right: 15, up: 10 };

export class EnemyBot extends Tank {
    constructor(game, x, y, type) {
        const sprite = resolveSprite(game, type);
        super(game, x, y, {
            team: type.team ?? TEAM.ENEMY,
            spriteSet: sprite.spriteSet,
            speed: type.speed,
            health: type.health,
            size: type.size ?? TANK_SIZE,
            bulletColor: type.bulletColor ?? '#ff4500',
            bulletSprite: type.bulletSprite ?? 'enemy',
            fallbackColor: type.fallbackColor,
            filter: sprite.filter

        });
        this.shootDelayRange = type.shootDelay;
        this.aggression = type.aggression ?? 0;
        this.ignoresBase = !!type.ignoresBase;
        this.scoreValue = type.score ?? 100;
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

        if (this.isFacingOpponent()) this.shootTimer = Math.min(this.shootTimer, ENEMY_REACTION_MS);

        if (this.tryShoot()) {
            this.shootCooldown = this.rollShootDelay();
            this.shootTimer = this.shootCooldown;
        }
    }

    isFacingOpponent() {

        const center = this.game.level.baseCenter;
        const near = center && Math.hypot(center.x - this.x - this.width / 2, center.y - this.y - this.height / 2) < 160;
        const base = this.team === TEAM.ENEMY && !this.ignoresBase && near && center;
        const targets = base ? [...this.opponents, { x: base.x - 16, y: base.y - 16, width: 32, height: 32 }] : this.opponents;
        return targets.some(p => {
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

    steerTowardTarget() {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const opponents = this.opponents;

        const base = this.team === TEAM.ENEMY && !this.ignoresBase ? this.game.level.baseCenter : null;

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

        this.direction = options.find(d => d !== this.direction);
        return true;
    }

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
