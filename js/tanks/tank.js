import { Entity } from '../core/entity.js';
import { intersects } from '../core/collision.js';
import { Bullet } from '../bullet.js';
import { assets, drawSprite, playSound } from '../assets.js';
import { TANK_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, DIRECTIONS, ASSIST_PIXELS, SPEED_BOOST_FACTOR, FEATURES } from '../config.js';
import { FIRE_COLORS } from '../core/effects.js';

const SHIELD_COLORS = { ring: '#3fd0ff', spark: '#bff6ff', glow: '#3fd0ff' };

export class Tank extends Entity {
    constructor(game, x, y, options) {
        const {
            team, spriteSet, speed, health = 1, shootCooldown = 500, size = TANK_SIZE,
            bulletColor = '#ffffff', fallbackColor = '#888888', filter = null, shootSound = null, bulletSprite = null
        } = options;
        super(x, y, size, size);

        this.game = game;
        this.team = team;
        this.spriteSet = spriteSet;
        this.speed = speed;
        this.maxHealth = health;
        this.health = health;
        this.shootCooldown = shootCooldown;
        this.bulletColor = bulletColor;
        this.fallbackColor = fallbackColor;
        this.bulletSprite = bulletSprite;
        this.shootSound = shootSound;
        this.filter = filter;

        this.direction = 'up';
        this.isMoving = false;
        this.frameX = 0;
        this.animationTimer = 0;
        this.shootTimer = 0;
        this.invulnerableTimer = 0;
        this.speedBoostTimer = 0;
        this.hitFlashTimer = 0;
    }

    get isInvulnerable() {
        return this.invulnerableTimer > 0;
    }

    get currentSpeed() {
        return this.speed * (this.speedBoostTimer > 0 ? SPEED_BOOST_FACTOR : 1);
    }

    update(deltaTime) {
        this.shootTimer = Math.max(0, this.shootTimer - deltaTime);
        this.invulnerableTimer = Math.max(0, this.invulnerableTimer - deltaTime);
        this.speedBoostTimer = Math.max(0, this.speedBoostTimer - deltaTime);
        this.hitFlashTimer = Math.max(0, this.hitFlashTimer - deltaTime);
        this.think(deltaTime);
        this.updateAnimation(deltaTime);
    }

    think(deltaTime) {}

    moveForward(deltaTime) {
        const v = DIRECTIONS[this.direction];
        const distance = this.currentSpeed * deltaTime / 1000;
        return this.move(v.x * distance, v.y * distance);
    }

    move(dx, dy) {
        const old = { x: this.x, y: this.y, width: this.width, height: this.height };
        const target = this.clampToWorld(old.x + dx, old.y + dy);
        const targetRect = { x: target.x, y: target.y, width: this.width, height: this.height };

        if (!this.isBlockedAt(targetRect, old)) {
            this.x = target.x;
            this.y = target.y;
            return this.x !== old.x || this.y !== old.y;
        }
        return this.slideAround(dx, dy, old);
    }

    slideAround(dx, dy, old) {
        const horizontal = dx !== 0;
        const step = Math.abs(horizontal ? dx : dy);
        const ahead = this.clampToWorld(old.x + dx, old.y + dy);

        for (let n = 1; n <= ASSIST_PIXELS; n++) {
            for (const sign of [-1, 1]) {
                const probe = horizontal
                    ? this.clampToWorld(ahead.x, old.y + sign * n)
                    : this.clampToWorld(old.x + sign * n, ahead.y);
                const probeRect = { x: probe.x, y: probe.y, width: this.width, height: this.height };
                if (this.isBlockedAt(probeRect, old)) continue;

                const nudge = Math.min(step, n) * sign;
                const nudged = horizontal
                    ? this.clampToWorld(old.x, old.y + nudge)
                    : this.clampToWorld(old.x + nudge, old.y);
                const nudgedRect = { x: nudged.x, y: nudged.y, width: this.width, height: this.height };
                if (this.isBlockedAt(nudgedRect, old)) return false;

                this.x = nudged.x;
                this.y = nudged.y;
                return true;
            }
        }
        return false;
    }

    clampToWorld(x, y) {
        return {
            x: Math.min(Math.max(x, 0), CANVAS_WIDTH - this.width),
            y: Math.min(Math.max(y, 0), CANVAS_HEIGHT - this.height)
        };
    }

    isBlockedAt(rect, oldRect) {
        if (this.game.level.collidesWithBlocks(rect)) return true;
        return this.game.tanks.some(other =>
            other !== this && intersects(rect, other) && !intersects(oldRect, other));
    }

    tryShoot() {
        if (this.shootTimer > 0) return false;
        this.shootTimer = this.shootCooldown;
        this.createBullets().forEach(bullet => this.game.bullets.push(bullet));
        if (this.shootSound) playSound(this.shootSound);
        return true;
    }

    createBullets() {
        return [new Bullet(this)];
    }

    takeDamage(amount) {
        if (this.isInvulnerable) return false;
        this.health -= amount;
        this.hitFlashTimer = 120;
        if (!this.game.silent) playSound('explosion');
        this.spawnHitEffects(this.health <= 0);
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
        return true;
    }

    die() {
        this.markedForDeletion = true;
    }

    spawnHitEffects(died) {
        const fx = this.game.effects;
        if (!fx) return;
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        if (!died) {
            fx.burst(cx, cy, ['#ffffff', '#ffd24a'], 6, 70, 2);
            if (this.isBoss) fx.shake(90, 2);
            return;
        }
        const big = this.width > 40;
        fx.burst(cx, cy, FIRE_COLORS, big ? 48 : 20, big ? 160 : 110, big ? 4 : 3);
        if (big) fx.shake(600, 6);
        else if (this === this.game.player) fx.shake(260, 4);
    }

    updateAnimation(deltaTime) {
        if (!this.isMoving) {
            this.frameX = 0;
            return;
        }
        this.animationTimer += deltaTime;
        if (this.animationTimer > 100) {
            this.frameX++;
            if (this.frameX > 3) this.frameX = 1;
            this.animationTimer = 0;
        }
    }

    draw(ctx) {
        const frames = assets.images.tanks[this.spriteSet];
        const img = frames && frames[this.direction][this.frameX];
        const filter = this.hitFlashTimer > 0 ? 'brightness(3)' : this.filter;

        if (filter) { ctx.save(); ctx.filter = filter; }
        if (!drawSprite(ctx, img, this.x, this.y, this.width, this.height)) this.drawFallback(ctx);
        if (filter) ctx.restore();

        if (this.isInvulnerable) this.drawShield(ctx);
    }

    drawShield(ctx) {
        if (this.invulnerableTimer < 1000 && Math.floor(this.invulnerableTimer / 100) % 2 === 1) return;
        if (FEATURES.fancyShield) { this.drawForceField(ctx); return; }
        this.drawRing(ctx, '#4fc3ff');
    }

    drawRing(ctx, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2 + 3, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawForceField(ctx, timeMs = this.invulnerableTimer, colors = SHIELD_COLORS) {
        const P = 2;
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const r = this.width / 2 + 5;
        const spin = timeMs / 260;
        const pulse = 0.55 + 0.25 * Math.sin(timeMs / 120);
        const STEPS = 36;
        ctx.save();
        for (let i = 0; i < STEPS; i++) {
            const a = (i / STEPS) * Math.PI * 2;

            const rr = r - 1.5 * Math.abs(Math.cos(3 * a));
            const px = Math.round((cx + Math.cos(a) * rr) / P) * P;
            const py = Math.round((cy + Math.sin(a) * rr) / P) * P;
            let spark = 0;
            for (let k = 0; k < 3; k++) {
                const d = Math.abs(Math.atan2(Math.sin(a - spin - k * 2.094), Math.cos(a - spin - k * 2.094)));
                spark = Math.max(spark, 1 - d / 0.45);
            }
            if (spark > 0) {
                ctx.globalAlpha = 0.6 + 0.4 * spark;
                ctx.fillStyle = spark > 0.6 ? '#ffffff' : colors.spark;
            } else {
                ctx.globalAlpha = pulse;
                ctx.fillStyle = colors.ring;
            }
            ctx.fillRect(px - 1, py - 1, P, P);

            ctx.globalAlpha = pulse * 0.35;
            ctx.fillStyle = colors.glow;
            ctx.fillRect(Math.round((cx + Math.cos(a) * (rr - 3)) / P) * P - 1,
                         Math.round((cy + Math.sin(a) * (rr - 3)) / P) * P - 1, P, P);
        }
        ctx.restore();
    }

    drawFallback(ctx) {
        const x = Math.round(this.x);
        const y = Math.round(this.y);
        const cx = x + this.width / 2;
        const cy = y + this.height / 2;
        ctx.fillStyle = this.hitFlashTimer > 0 ? '#ffffff' : this.fallbackColor;
        ctx.fillRect(x, y, this.width, this.height);
        ctx.fillStyle = 'black';
        if (this.direction === 'up') ctx.fillRect(cx - 3, y - 8, 6, 14);
        else if (this.direction === 'down') ctx.fillRect(cx - 3, y + this.height - 6, 6, 14);
        else if (this.direction === 'left') ctx.fillRect(x - 8, cy - 3, 14, 6);
        else ctx.fillRect(x + this.width - 6, cy - 3, 14, 6);
    }
}
