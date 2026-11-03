import { EnemyBot } from './enemybot.js';
import { Bullet } from '../bullet.js';
import { FEATURES, DIRECTIONS } from '../config.js';
import { SPARK_COLORS, FIRE_COLORS } from '../core/effects.js';
import { DestructibleBlock, Liquid } from '../world/block.js';
import { intersects } from '../core/collision.js';
import { playSound } from '../assets.js';

const BOSS_SHIELD = { ring: '#ff4a3a', spark: '#ffe0a0', glow: '#ff2a1a' };
const STARS = ['#ffe27a', '#ffffff', '#ffd24a'];

export class BossTank extends EnemyBot {
    constructor(game, x, y, type) {
        super(game, x, y, type);
        this.isBoss = true;
        this.phases = type.phases;
        this.phaseIndex = -1;
        this.mode = 'hunt';
        this.modeTimer = 0;
        this.steerTimer = 0;
        this.venting = false;
        this.updatePhase();
        this.modeTimer = this.phase.huntMs;
    }

    get phase() { return this.phases[this.phaseIndex]; }

    updatePhase() {
        const index = this.phases.findIndex(phase => this.health > phase.minHealth);
        if (index === this.phaseIndex || index === -1) return;

        if (this.phaseIndex >= 0 && this.game.spawnEscorts) this.game.spawnEscorts(this.phases[index].escorts || 0);
        this.phaseIndex = index;
        this.shootDelayRange = this.phase.shootDelay;
        this.shootCooldown = this.rollShootDelay();
    }

    setMode(mode, ms) {
        this.mode = mode;
        this.modeTimer = ms;
        this.venting = mode === 'dazed';
    }

    get player() { return this.game.player; }

    directionToPlayer() {
        const p = this.player;
        const dx = p.x + p.width / 2 - (this.x + this.width / 2);
        const dy = p.y + p.height / 2 - (this.y + this.height / 2);
        if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
        return dy > 0 ? 'down' : 'up';
    }

    think(deltaTime) {
        this.updatePhase();
        this.modeTimer -= deltaTime;
        const ph = this.phase;

        if (this.mode === 'hunt') {
            this.speed = ph.huntSpeed;
            this.steerTimer -= deltaTime;

            if (this.steerTimer <= 0) {
                this.steerTimer = 700;
                this.direction = this.directionToPlayer();
            }
            this.isMoving = this.moveForward(deltaTime);
            if (!this.isMoving) { this.chooseRandomDirection(); this.steerTimer = 500; }
            if (this.tryShoot()) {
                this.shootCooldown = this.rollShootDelay();
                this.shootTimer = this.shootCooldown;
            }
            if (this.modeTimer <= 0) {
                this.direction = this.directionToPlayer();
                this.setMode('windup', ph.windupMs);
            }
        } else if (this.mode === 'windup') {
            this.isMoving = false;
            if (this.modeTimer <= 0) {
                this.setMode('charge', 4000);
                playSound('shoot');
            }
        } else if (this.mode === 'charge') {
            this.speed = ph.chargeSpeed;
            const v = DIRECTIONS[this.direction];
            const step = this.speed * deltaTime / 1000;
            const target = { x: this.x + v.x * step, y: this.y + v.y * step, width: this.width, height: this.height };
            this.smashWalls(target);
            const moved = this.move(v.x * step, v.y * step);
            this.isMoving = true;
            if (!moved || this.modeTimer <= 0) this.crash(target);
        } else if (this.mode === 'dazed') {
            this.isMoving = false;
            if (this.game.effects && Math.random() < 0.15) {
                this.game.effects.burst(this.x + this.width / 2, this.y + 6, STARS, 1, 25, 2);
            }
            if (this.modeTimer <= 0) this.setMode('hunt', ph.huntMs);
        }
    }

    smashWalls(rect) {
        const level = this.game.level;
        for (const block of level.blocksOverlapping(rect)) {
            if (block instanceof DestructibleBlock) {
                block.markedForDeletion = true;
                if (this.game.effects) this.game.effects.burst(block.x + 8, block.y + 8, [block.fallbackColor], 4, 80, 2);
            }
        }
        level.removeDestroyed();
    }

    crash(rect) {
        const p = this.player;
        if (p && intersects({ ...rect, x: rect.x - 2, y: rect.y - 2, width: rect.width + 4, height: rect.height + 4 }, p)) {
            p.takeDamage(1);
        }
        const fx = this.game.effects;
        if (fx) {
            fx.burst(this.x + this.width / 2, this.y + this.height / 2, FIRE_COLORS, 16, 120, 3);
            fx.shake(350, 5);
        }
        playSound('explosion');
        if (this.phase.shockwave) this.shockwave();
        this.setMode('dazed', this.phase.dazedMs);
    }

    isBlockedAt(rect, oldRect) {
        const level = this.game.level;
        const onLiquid = level.blocks.some(b => b instanceof Liquid && intersects(oldRect, b));
        const crossLiquid = this.mode === 'charge' || onLiquid;
        const hitsBlock = level.blocks.some(b => intersects(rect, b) && !(crossLiquid && b instanceof Liquid));
        if (hitsBlock) return true;
        return this.game.tanks.some(other =>
            other !== this && intersects(rect, other) && !intersects(oldRect, other));
    }

    shockwave() {
        for (const direction of ['up', 'down', 'left', 'right']) {
            const owner = { x: this.x, y: this.y, width: this.width, height: this.height, direction,
                            team: this.team, bulletColor: this.bulletColor, bulletSprite: this.bulletSprite };
            this.game.bullets.push(new Bullet(owner));
        }
    }

    takeDamage(amount) {
        if (this.mode !== 'dazed') {
            if (this.game.effects) {
                this.game.effects.burst(this.x + this.width / 2, this.y + this.height / 2, SPARK_COLORS, 5, 90, 2);
            }
            return false;
        }
        return super.takeDamage(amount);
    }

    createBullets() {
        return this.phase.volley.map(offset => new Bullet(this, offset));
    }

    draw(ctx) {
        if (this.mode === 'windup') this.drawChargeLine(ctx);
        const saved = this.filter;
        if (this.mode === 'windup' && Math.floor(this.modeTimer / 100) % 2 === 0) this.filter = 'brightness(2)';
        if (this.mode === 'dazed') this.filter = 'saturate(0.4) brightness(0.8)';
        super.draw(ctx);
        this.filter = saved;
        if (this.mode !== 'dazed') {
            if (FEATURES.fancyShield) this.drawForceField(ctx, this.modeTimer + this.x * 7, BOSS_SHIELD);
            else this.drawRing(ctx, BOSS_SHIELD.ring);
        }
    }

    drawChargeLine(ctx) {
        const v = DIRECTIONS[this.direction];
        const level = this.game.level;
        const blink = Math.floor(this.modeTimer / 120) % 2 === 0 ? 0.45 : 0.25;
        ctx.save();
        ctx.globalAlpha = blink;
        ctx.fillStyle = '#ff2a1a';
        let x = this.x, y = this.y;
        for (let i = 0; i < 30; i++) {
            x += v.x * 16; y += v.y * 16;
            const r = { x, y, width: this.width, height: this.height };
            if (x < 0 || y < 0 || x + this.width > 480 || y + this.height > 480) break;
            if (level.blocksOverlapping(r).some(b => !(b instanceof DestructibleBlock))) break;
            if (i % 2 === 0) ctx.fillRect(Math.round(x + this.width / 2 - 6), Math.round(y + this.height / 2 - 6), 12, 12);
        }
        ctx.restore();
    }
}
