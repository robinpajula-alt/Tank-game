import { Tank } from './tank.js';
import { TEAM, PLAYER_SPEED, PLAYER_SHOOT_COOLDOWN, RESPAWN_INVULNERABILITY_MS } from '../config.js';

export class Player extends Tank {
    constructor(game) {
        super(game, 0, 0, {
            team: TEAM.PLAYER,
            spriteSet: 'player',
            speed: PLAYER_SPEED,
            health: 1,
            shootCooldown: PLAYER_SHOOT_COOLDOWN,
            bulletColor: '#ffff00',
            fallbackColor: '#00ff00',
            shootSound: 'shoot',
            bulletSprite: 'player'
        });
    }

    /** Pane tank taseme alguspunkti, täis elud ja lühike puutumatus. */
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
    }

    think(deltaTime) {
        const input = this.game.input;
        const direction = input.getDirection();

        this.isMoving = false;
        if (direction) {
            this.direction = direction;
            this.moveForward(deltaTime);
            this.isMoving = true;          // rattad pöörlevad ka vastu seina surudes
        }
        if (input.isFiring()) this.tryShoot();
    }

    die() {
        this.game.onPlayerKilled();
    }
}
