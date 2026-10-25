import { assets } from "../assets.js";

export class Block {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.markedForDeletion = false;
  }
  draw(ctx) {
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

export class Brick extends Block {
  draw(ctx) {
    let img = assets.images.brick;
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, this.x, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = "#8B4513";
      super.draw(ctx);
    }
  }
}

export class Steel extends Block {
  draw(ctx) {
    let img = assets.images.steel;
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, this.x, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = "#aaa";
      super.draw(ctx);
    }
  }
}

export class Ground {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
  draw(ctx) {
    let img = assets.images.sand;
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, this.x, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = "#d2b48c";
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }
}

export class Base extends Block {
  draw(ctx) {
    let img = assets.images.base;
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, this.x, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = "#00f";
      super.draw(ctx);
    }
  }
}

export class SandWall extends Block {
  draw(ctx) {
    let img = assets.images.sandWall;
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, this.x, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = "#e0a96d"; // Liiva värv juhuks kui pilt laeb
      super.draw(ctx);
    }
  }
}

export class SandWallBroken extends Block {
  draw(ctx) {
    let img = assets.images.sandWallBroken;
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, this.x, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = "#c28b51"; // Katkise liiva värv
      super.draw(ctx);
    }
  }
}
