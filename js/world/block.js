import { Entity } from "../core/entity.js";
import { assets, drawSprite } from "../assets.js";
import { biomeSpec } from "../config.js";
import { FIRE_COLORS, SPARK_COLORS } from "../core/effects.js";

export class Block extends Entity {
  imageKey = null;
  fallbackColor = "#ff00ff";
  stopsBullets = true;

  getImage() {
    return assets.images.blocks[this.imageKey];
  }

  onBulletHit(game, bullet) {}

  draw(ctx) {
    if (
      drawSprite(ctx, this.getImage(), this.x, this.y, this.width, this.height)
    )
      return;
    ctx.fillStyle = this.fallbackColor;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

export class Steel extends Block {
  constructor(x, y, width, height, biomeName, quadrant = 0) {
    super(x, y, width, height);
    const images = assets.images.biomes[biomeName].steel;
    this.image = Array.isArray(images) ? images[quadrant] : images;
    const spec = biomeSpec(biomeName);
    this.fallbackColor = spec.steel ? spec.steel.color : "#555555";
  }

  getImage() {
    return this.image;
  }

  onBulletHit(game, bullet) {
    if (game.effects && bullet)
      game.effects.burst(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, SPARK_COLORS, 4, 60, 2);
  }
}

export class Base extends Block {
  imageKey = "base";
  fallbackColor = "#00bfff";

  onBulletHit(game) {
    this.markedForDeletion = true;
    if (game.effects) {
      game.effects.burst(this.x + this.width / 2, this.y + this.height / 2, FIRE_COLORS, 60, 180, 4);
      game.effects.shake(700, 7);
    }
    game.onBaseDestroyed();
  }
}

export class DestructibleBlock extends Block {
  onBulletHit(game) {
    this.markedForDeletion = true;

    if (game && game.effects)
      game.effects.burst(this.x + this.width / 2, this.y + this.height / 2, [this.fallbackColor, "#00000055"], 6, 70, 2);
  }
}

export class Brick extends DestructibleBlock {
  imageKey = "brick";
  fallbackColor = "#8B4513";
}

export class Wall extends DestructibleBlock {
  constructor(x, y, width, height, biomeName, cracked = false, quadrant = 0) {
    super(x, y, width, height);
    const images = assets.images.biomes[biomeName];
    const spec = biomeSpec(biomeName);
    const useCracked = cracked && spec.cracked;
    const image = useCracked ? images.cracked : images.wall;
    this.image = Array.isArray(image) ? image[quadrant] : image;
    this.fallbackColor = (useCracked ? spec.cracked : spec.wall).color;
  }

  getImage() {
    return this.image;
  }
}

export class Liquid extends Block {
  stopsBullets = false;

  constructor(x, y, width, height, biomeName) {
    super(x, y, width, height);
    const images = assets.images.biomes[biomeName].liquid;
    this.frames = Array.isArray(images) ? images : images ? [images] : [];
    const spec = biomeSpec(biomeName).liquid;
    this.fallbackColor = spec ? spec.color : "#2b5d8a";
    this.frameMs = (spec && spec.frameMs) || 250;
    const col = Math.round(x / width);
    const row = Math.round(y / height);
    this.frameOffset = spec && spec.stagger ? col * 3 + row * 2 : 0;
  }

  getImage() {
    if (this.frames.length === 0) return null;
    const tick = Math.floor(performance.now() / this.frameMs) + this.frameOffset;
    return this.frames[tick % this.frames.length];
  }
}
