import { Tank } from "./tank.js";
import { assets } from "../assets.js";

export class EnemyBot extends Tank {
  constructor(game, x, y) {
    super(game, x, y);
    this.speed = 1.5;
    this.direction = "down";
    this.moveTimer = 0;
    this.shootTimer = 0;
  }

  update(deltaTime) {
    let moved = false;
    if (this.direction === "up") moved = this.move(0, -this.speed);
    else if (this.direction === "down") moved = this.move(0, this.speed);
    else if (this.direction === "left") moved = this.move(-this.speed, 0);
    else if (this.direction === "right") moved = this.move(this.speed, 0);

    this.isMoving = moved;
    this.moveTimer += deltaTime;

    if (!moved || this.moveTimer > 2000) {
      this.chooseNewDirection();
      this.moveTimer = 0;
    }

    this.shootTimer += deltaTime;
    if (this.shootTimer > 1500 + Math.random() * 2000) {
      this.shoot(true);
      this.shootTimer = 0;
    }

    this.updateAnimation(deltaTime);
  }

  chooseNewDirection() {
    const r = Math.random();
    if (r < 0.5) this.direction = "down";
    else if (r < 0.75) this.direction = "left";
    else if (r < 0.9) this.direction = "right";
    else this.direction = "up";
  }

  draw(ctx) {
    let img = assets.images.enemy[this.direction][this.frameX];
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, this.x, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = "red";
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }
}
