import { intersects } from './collision.js';

/**
 * Kuulide liikumine ja kokkupõrked. Jagatud Game'i ja menüü taustamaailma (DemoWorld) vahel.
 * world peab pakkuma: bullets, level, tanks.
 */
export function simulateBullets(world, deltaTime) {
    world.bullets.forEach(bullet => bullet.update(deltaTime));
    resolveBulletClashes(world.bullets);

    for (const bullet of world.bullets) {
        if (bullet.markedForDeletion) continue;

        // Plokid: kuul kaob igal juhul, plokk otsustab ise, mis temaga juhtub (polümorfism).
        const hitBlocks = world.level.blocksOverlapping(bullet);
        if (hitBlocks.length > 0) {
            hitBlocks.forEach(block => block.onBulletHit(world, bullet));
            bullet.markedForDeletion = true;
            continue;
        }

        // Tankid: ainult vastasmeeskond ja ainult esimene tabatu.
        for (const tank of world.tanks) {
            if (tank.team !== bullet.team && intersects(bullet, tank)) {
                tank.takeDamage(bullet.damage);
                bullet.markedForDeletion = true;
                break;
            }
        }
    }
}

/** Vastasmeeskondade kuulid kustutavad teineteist. Kasutab läbitud teed, et kiired kuulid ei lendaks läbi. */
function resolveBulletClashes(bullets) {
    for (let i = 0; i < bullets.length; i++) {
        const a = bullets[i];
        if (a.markedForDeletion) continue;
        for (let j = i + 1; j < bullets.length; j++) {
            const b = bullets[j];
            if (b.markedForDeletion || a.team === b.team) continue;
            if (intersects(a.sweptRect, b.sweptRect)) {
                a.markedForDeletion = true;
                b.markedForDeletion = true;
                break;
            }
        }
    }
}
