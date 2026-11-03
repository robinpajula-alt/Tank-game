import { Tank } from './tank.js';
import { Bullet } from '../bullet.js';
import { TEAM, PLAYER_SPEED, PLAYER_SHOOT_COOLDOWN, RESPAWN_INVULNERABILITY_MS, FEATURES, ICE_ACCELERATION, DIRECTIONS } from '../config.js';

export class Player extends Tank {
    constructor(game) {
        super(game, 0, 0, {
            team: TEAM.PLAYER,
            spriteSet: FEATURES.newTankSprites ? 'hero' : 'player',
            speed: PLAYER_SPEED,
            health: 1,
            shootCooldown: PLAYER_SHOOT_COOLDOWN,
            bulletColor: '#ffff00',
            fallbackColor: '#00ff00',
            shootSound: 'shoot',
            bulletSprite: 'player'
        });
        this.velocity = { x: 0, y: 0 };
        this.twin = false;
        this.bulletSpeedFactor = 1;
        this.applyUpgrades(game.upgrades || []);
    }

    applyUpgrades(upgrades) {
        if (upgrades.includes('rapid')) { this.shootCooldown *= 0.65; this.bulletSpeedFactor = 0.85; }
        if (upgrades.includes('twin')) { this.twin = true; this.shootCooldown *= 1.2; }
        if (upgrades.includes('armor')) { this.maxHealth = 2; this.health = 2; this.speed *= 0.88; }
        if (upgrades.includes('treads')) this.speed *= 1.2;
    }

    createBullets() {
        const bullets = this.twin ? [new Bullet(this, -6), new Bullet(this, 6)] : [new Bullet(this)];
        bullets.forEach(b => { b.speed *= this.bulletSpeedFactor; });
        return bullets;
    }

    respawn() {
        const start = this.game.level.playerStart;
        this.x = start.x;
        this.y = start.y;
        this.direction = 'up';
        this.health = this.maxHealth;
        this.isMoving = false;
        this.frameX = 0;
        this.shootTimer = 0;
        this.invulnerableTimer = RESPAWN_INVULNERABILITY_MS;
        this.velocity = { x: 0, y: 0 };
    }

    think(deltaTime) {
        const input = this.game.input;
        const direction = input.getDirection();

        this.isMoving = false;
        if (FEATURES.slipperyIce && this.game.level.isOnIce(this)) {
            this.moveOnIce(deltaTime, direction);
        } else if (direction) {
            this.direction = direction;
            this.moveForward(deltaTime);
            this.isMoving = true;

            const v = DIRECTIONS[direction];
            this.velocity = { x: v.x * this.currentSpeed, y: v.y * this.currentSpeed };
        } else {
            this.velocity = { x: 0, y: 0 };
        }
        if (input.isFiring()) this.tryShoot();
    }

    moveOnIce(deltaTime, direction) {
        const dt = deltaTime / 1000;
        const target = direction ? DIRECTIONS[direction] : { x: 0, y: 0 };
        if (direction) this.direction = direction;
        const maxChange = ICE_ACCELERATION * dt;
        const approach = (current, wanted) =>
            current + Math.max(-maxChange, Math.min(maxChange, wanted - current));
        this.velocity.x = approach(this.velocity.x, target.x * this.currentSpeed);
        this.velocity.y = approach(this.velocity.y, target.y * this.currentSpeed);

        const dx = this.velocity.x * dt;
        const dy = this.velocity.y * dt;
        if (Math.abs(dx) > 0.01 && !this.move(dx, 0)) this.velocity.x = 0;
        if (Math.abs(dy) > 0.01 && !this.move(0, dy)) this.velocity.y = 0;
        this.isMoving = !!direction || Math.hypot(this.velocity.x, this.velocity.y) > 8;
    }

    takeDamage(amount) {
        const hit = super.takeDamage(amount);
        if (hit && this.health > 0) this.invulnerableTimer = Math.max(this.invulnerableTimer, 900);
        return hit;
    }

    die() {
        this.game.onPlayerKilled();
    }
}
