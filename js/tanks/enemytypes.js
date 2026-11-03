import { EnemyBot } from './enemybot.js';
import { BossTank } from './bosstank.js';
import { TILE_SIZE } from '../config.js';

export const ENEMY_TYPES = {

    basic: {
        score: 100,
        spriteSet: 'enemy1', biomeSprite: 'basic', speed: 100, health: 1,
        shootDelay: [1300, 2800], aggression: 0.25, fallbackColor: 'red'
    },
    fast: {
        score: 150,
        spriteSet: 'enemy1', biomeSprite: 'fast', speed: 165, health: 1,
        shootDelay: [1300, 2400], aggression: 0.35, fallbackColor: 'orange',
        filter: 'hue-rotate(180deg)'
    },
    armored: {
        score: 250,
        spriteSet: 'enemy1', biomeSprite: 'armored', speed: 80, health: 2,
        shootDelay: [1100, 2200], aggression: 0.4, fallbackColor: 'darkred',
        filter: 'saturate(0.2) brightness(0.8)'
    },
    boss: {
        score: 5000,
        behavior: 'boss',
        ignoresBase: true,
        spriteSet: 'enemy1', newSprite: 'boss', speed: 60, health: 24,
        size: TILE_SIZE * 2 - 8,
        shootDelay: [2200, 3200], aggression: 0.5, fallbackColor: '#600',
        bulletColor: '#ff00aa', bulletSprite: 'boss',
        filter: 'sepia(1) saturate(4) hue-rotate(-30deg) brightness(0.75)',

        phases: [
            { minHealth: 16, huntSpeed: 55, huntMs: 4200, windupMs: 1000, chargeSpeed: 230, dazedMs: 3200, shootDelay: [2200, 3200], volley: [0], shockwave: false, escorts: 0 },
            { minHealth: 8, huntSpeed: 70, huntMs: 3600, windupMs: 850,  chargeSpeed: 270, dazedMs: 2800, shootDelay: [1800, 2600], volley: [-9, 9], shockwave: true, escorts: 2 },
            { minHealth: 0, huntSpeed: 85, huntMs: 3000, windupMs: 700,  chargeSpeed: 310, dazedMs: 2400, shootDelay: [1500, 2200], volley: [-16, 0, 16], shockwave: true, escorts: 3 }
        ]
    }
};

export function createEnemy(typeKey, game, x, y) {
    const type = ENEMY_TYPES[typeKey];
    if (!type) throw new Error(`Tundmatu vaenlase tüüp: "${typeKey}" (enemytypes.js)`);
    return type.behavior === 'boss' ? new BossTank(game, x, y, type) : new EnemyBot(game, x, y, type);
}
