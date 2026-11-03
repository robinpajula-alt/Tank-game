import { EnemyBot } from './enemybot.js';
import { BossTank } from './bosstank.js';
import { TILE_SIZE } from '../config.js';

// Vaenlase tüübid ANDMETENA. Uus tüüp = uus kirje siia + nimi taseme `enemies` objekti.
// shootDelay: [min, max] ms lasu vahel. filter: värvitoon olemasolevatele spraitidele,
// kuni tüübil on oma spraidid (siis muuda spriteSet ja lisa see assets.js TANK_SPRITE_SETS-i).
export const ENEMY_TYPES = {
    // aggression: tõenäosus, et suunavahetusel sõidab vaenlane mängija või baasi poole.
    basic: {
        spriteSet: 'enemy1', speed: 100, health: 1,
        shootDelay: [1300, 2800], aggression: 0.25, fallbackColor: 'red'
    },
    fast: {
        spriteSet: 'enemy1', speed: 165, health: 1,
        shootDelay: [1300, 2400], aggression: 0.35, fallbackColor: 'orange',
        filter: 'hue-rotate(180deg)'
    },
    armored: {
        spriteSet: 'enemy1', speed: 80, health: 2,
        shootDelay: [1100, 2200], aggression: 0.4, fallbackColor: 'darkred',
        filter: 'saturate(0.2) brightness(0.8)'
    },
    boss: {
        behavior: 'boss',
        spriteSet: 'enemy1', speed: 50, health: 15,
        size: TILE_SIZE * 2 - 8,                 // 56 px
        shootDelay: [1600, 2600], aggression: 0.3, fallbackColor: '#600',
        bulletColor: '#ff00aa',
        filter: 'sepia(1) saturate(4) hue-rotate(-30deg) brightness(0.75)',
        // minHealth: faas kehtib, kuni elu on sellest suurem. volley = kuulide nihked küljele.
        phases: [
            { minHealth: 10, speed: 50, shootDelay: [1600, 2600], volley: [0],          aggression: 0.3 },
            { minHealth: 5,  speed: 70, shootDelay: [1300, 2000], volley: [-9, 9],      aggression: 0.5 },
            { minHealth: 0,  speed: 90, shootDelay: [900, 1500],  volley: [-16, 0, 16], aggression: 0.7 }
        ]
    }
};

export function createEnemy(typeKey, game, x, y) {
    const type = ENEMY_TYPES[typeKey];
    if (!type) throw new Error(`Tundmatu vaenlase tüüp: "${typeKey}" (enemytypes.js)`);
    return type.behavior === 'boss' ? new BossTank(game, x, y, type) : new EnemyBot(game, x, y, type);
}
