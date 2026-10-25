import { TILE_SIZE } from "../config.js";
import { Bullet } from "../bullet.js";
import { playSound, assets } from "../assets.js";

export class Tank {
  constructor(game, x, y) {
    this.game = game;
    this.width = TILE_SIZE - 4;
    this.height = TILE_SIZE - 4;
    this.x = x;
    this.y = y;
    this.speed = 2;
    this.direction = "up";

    this.isMoving = false;
    this.frameX = 0;
    this.animationTimer = 0;
  }

  move(dx, dy) {
    let oldX = this.x;
    let oldY = this.y;
    this.x += dx;
    this.y += dy;

    if (this.x < 0) this.x = 0;
    if (this.x + this.width > this.game.canvas.width)
      this.x = this.game.canvas.width - this.width;
    if (this.y < 0) this.y = 0;
    if (this.y + this.height > this.game.canvas.height)
      this.y = this.game.canvas.height - this.height;

    for (let block of this.game.blocks) {
      if (this.game.checkCollision(this, block)) {
        this.x = oldX;
        this.y = oldY;
        return false;
      }
    }
    return true;
  }

  shoot(isEnemy) {
    let bx = this.x + this.width / 2;
    let by = this.y + this.height / 2;
    this.game.bullets.push(
      new Bullet(
        bx,
        by,
        this.direction,
        isEnemy,
        this.game.canvas.width,
        this.game.canvas.height,
      ),
    );
    playSound(assets.sounds.shoot);
  }

  updateAnimation(deltaTime) {
    if (this.isMoving) {
      this.animationTimer += deltaTime;
      if (this.animationTimer > 100) {
        this.frameX++;
        if (this.frameX > 3) this.frameX = 1;
        this.animationTimer = 0;
      }
    } else {
      this.frameX = 0;
    }
  }
}
