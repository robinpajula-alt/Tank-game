import { Tank } from './tank.js';
import { assets } from './assets.js';

export class Player extends Tank {
    constructor(game, x, y) {
        super(game, x, y);
        this.readyToShoot = true;
    }

    update(inputKeys, deltaTime) {
        this.isMoving = false;

        if (inputKeys.includes('ArrowUp')) { this.direction = 'up'; this.move(0, -this.speed); this.isMoving = true; }
        else if (inputKeys.includes('ArrowDown')) { this.direction = 'down'; this.move(0, this.speed); this.isMoving = true; }
        else if (inputKeys.includes('ArrowLeft')) { this.direction = 'left'; this.move(-this.speed, 0); this.isMoving = true; }
        else if (inputKeys.includes('ArrowRight')) { this.direction = 'right'; this.move(this.speed, 0); this.isMoving = true; }

        if (inputKeys.includes(' ') && this.readyToShoot) {
            this.shoot(false);
            this.readyToShoot = false;
            setTimeout(() => { this.readyToShoot = true; }, 500);
        }

        this.updateAnimation(deltaTime);
    }
    
    draw(ctx) {
        let img = assets.images.player[this.direction][this.frameX];
        
        if (img && img.complete && img.naturalWidth > 0) { 
            ctx.drawImage(img, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#0f0'; ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = 'darkgreen'; 
            if (this.direction === 'up') ctx.fillRect(this.x + 10, this.y - 10, 6, 15);
            else if (this.direction === 'down') ctx.fillRect(this.x + 10, this.y + this.height - 5, 6, 15);
            else if (this.direction === 'left') ctx.fillRect(this.x - 10, this.y + 10, 15, 6);
            else if (this.direction === 'right') ctx.fillRect(this.x + this.width - 5, this.y + 10, 15, 6);
        }
    }
}