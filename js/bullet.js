export class Bullet {
    constructor(x, y, direction, isEnemy, canvasWidth, canvasHeight) {
        this.direction = direction; 
        this.isEnemy = isEnemy;
        this.speed = 8; 
        this.markedForDeletion = false;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        this.width = (direction === 'up' || direction === 'down') ? 10 : 12;
        this.height = (direction === 'up' || direction === 'down') ? 12 : 10;
        
        this.x = x - this.width / 2; 
        this.y = y - this.height / 2; 
    }
    
    update() {
        if (this.direction === 'up') this.y -= this.speed;
        else if (this.direction === 'down') this.y += this.speed;
        else if (this.direction === 'left') this.x -= this.speed;
        else if (this.direction === 'right') this.x += this.speed;

        if (this.x < 0 || this.x > this.canvasWidth || this.y < 0 || this.y > this.canvasHeight) {
            this.markedForDeletion = true;
        }
    }
    
    draw(ctx) {
        ctx.fillStyle = this.isEnemy ? '#ff4500' : '#ffff00';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
} 