import { Entity } from './core/entity.js';
import { MAX_LIVES, POWERUP_LIFETIME_MS } from './config.js';
import { playSound } from './assets.js';

const SIZE = 24;

// Power-upid ANDMETENA: uus power-up = uus kirje. apply(game) teeb töö ära.
export const POWERUP_TYPES = {
    speed:   { icon: '⚡', color: '#ffd800', weight: 3,
               apply: game => { game.player.speedBoostTimer = 8000; } },
    shield:  { icon: '🛡', color: '#4fc3ff', weight: 3,
               apply: game => { game.player.invulnerableTimer = Math.max(game.player.invulnerableTimer, 8000); } },
    fortify: { icon: '🧱', color: '#b0b0b0', weight: 2,
               apply: game => { game.level.fortifyBase(12000); } },
    freeze:  { icon: '❄', color: '#bff3ff', weight: 2,
               apply: game => { game.freezeTimer = 6000; } },
    life:    { icon: '❤', color: '#ff4d6d', weight: 1,
               apply: game => { game.lives = Math.min(game.lives + 1, MAX_LIVES); } }
};

export function randomPowerUpType() {
    const entries = Object.entries(POWERUP_TYPES);
    let roll = Math.random() * entries.reduce((sum, [, t]) => sum + t.weight, 0);
    for (const [key, type] of entries) {
        roll -= type.weight;
        if (roll <= 0) return key;
    }
    return entries[0][0];
}

export class PowerUp extends Entity {
    constructor(centerX, centerY, typeKey) {
        super(centerX - SIZE / 2, centerY - SIZE / 2, SIZE, SIZE);
        this.typeKey = typeKey;
        this.type = POWERUP_TYPES[typeKey];
        this.age = 0;
    }

    update(deltaTime) {
        this.age += deltaTime;
        if (this.age >= POWERUP_LIFETIME_MS) this.markedForDeletion = true;
    }

    apply(game) {
        this.type.apply(game);
        playSound('powerup');
        this.markedForDeletion = true;
    }

    draw(ctx) {
        const remaining = POWERUP_LIFETIME_MS - this.age;
        if (remaining < 3000 && Math.floor(remaining / 150) % 2 === 1) return;   // vilgub enne kadumist

        const x = Math.round(this.x);
        const y = Math.round(this.y);
        ctx.fillStyle = '#111';
        ctx.fillRect(x - 2, y - 2, SIZE + 4, SIZE + 4);
        ctx.fillStyle = this.type.color;
        ctx.fillRect(x, y, SIZE, SIZE);
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000';
        ctx.fillText(this.type.icon, x + SIZE / 2, y + SIZE / 2 + 1);
    }
}
