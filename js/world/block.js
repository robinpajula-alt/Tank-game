import { Entity } from "../core/entity.js";
import { assets, drawSprite } from "../assets.js";
import { biomeSpec } from "../config.js";

/**
 * Plokkide baasklass. Iga plokk otsustab ise, mis temaga juhtub, kui kuul pihta saab.
 * Uus plokitüüp = uus alamklass + rida level.js-i registris. Game.js-i ei puutu.
 */
export class Block extends Entity {
  imageKey = null; // võti assets.images.blocks all
  fallbackColor = "#ff00ff";

  getImage() {
    return assets.images.blocks[this.imageKey];
  }

  /** Vaikimisi (teras): ei juhtu midagi, kuul kaob. */
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
  imageKey = "steel";
  fallbackColor = "#aaaaaa";
}

/** Kõrbetäht. Kui kuul tabab, on mäng läbi. */
export class Base extends Block {
  imageKey = "base";
  fallbackColor = "#00bfff";

  onBulletHit(game) {
    this.markedForDeletion = true;
    game.onBaseDestroyed();
  }
}

/** Hävib ühe kuuliga. */
export class DestructibleBlock extends Block {
  onBulletHit() {
    this.markedForDeletion = true;
  }
}

export class Brick extends DestructibleBlock {
  imageKey = "brick";
  fallbackColor = "#8B4513";
}

/**
 * Bioomi sein: pilt ja värv tulevad bioomi andmetest (config.js BIOMES).
 * quadrant (0 üleval vasakul, 1 üleval paremal, 2 all paremal, 3 all vasakul) valib nurgapildi,
 * kui bioomil on seinal 4 pilti (nt jää).
 */
export class Wall extends DestructibleBlock {
  constructor(x, y, width, height, biomeName, cracked = false, quadrant = 0) {
    super(x, y, width, height);
    const images = assets.images.biomes[biomeName];
    const spec = biomeSpec(biomeName);
    const useCracked = cracked && spec.cracked; // puudub -> tavaline sein
    const image = useCracked ? images.cracked : images.wall;
    this.image = Array.isArray(image) ? image[quadrant] : image;
    this.fallbackColor = (useCracked ? spec.cracked : spec.wall).color;
  }

  getImage() {
    return this.image;
  }
}
