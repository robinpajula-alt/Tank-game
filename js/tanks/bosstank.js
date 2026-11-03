import { EnemyBot } from './enemybot.js';
import { Bullet } from '../bullet.js';

/**
 * Mitmefaasiline boss. Faasid tulevad andmetena enemytypes.js-ist (type.phases),
 * valitakse järelejäänud elu järgi. Mida vähem elu, seda kiirem ja ohtlikum.
 * Sõidu- ja sihtimisloogika (aggression) tuleb EnemyBot-ilt.
 */
export class BossTank extends EnemyBot {
    constructor(game, x, y, type) {
        super(game, x, y, type);
        this.isBoss = true;
        this.phases = type.phases;
        this.phaseIndex = -1;
        this.volley = [0];
        this.updatePhase();
    }

    /** Esimene faas, mille minHealth on praegusest elust väiksem. */
    updatePhase() {
        const index = this.phases.findIndex(phase => this.health > phase.minHealth);
        if (index === this.phaseIndex || index === -1) return;
        const phase = this.phases[index];
        this.phaseIndex = index;
        this.speed = phase.speed;
        this.shootDelayRange = phase.shootDelay;
        this.volley = phase.volley;
        this.aggression = phase.aggression;
        this.shootCooldown = this.rollShootDelay();
    }

    think(deltaTime) {
        this.updatePhase();
        super.think(deltaTime);
    }

    createBullets() {
        return this.volley.map(offset => new Bullet(this, offset));
    }
}
