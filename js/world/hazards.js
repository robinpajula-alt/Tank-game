import { TILE, TILE_SIZE, HALF_TILE } from "../config.js";
import { assets, drawSprite, playSound } from "../assets.js";
import { intersects } from "../core/collision.js";

const WARN_MS = 1300;
const FALL_MS = 350;
const INTERVAL_MS = [5000, 8000];
const FIRST_DELAY_MS = 6000;
const MAX_ROCKS = 10;
const DUST = ["#d88a5a", "#b5512f", "#e8a070", "#7a3a22"];

export class RockfallHazard {
  constructor(game) {
    this.game = game;
    this.timer = FIRST_DELAY_MS;
    this.dropped = 0;
    this.warnings = [];
  }

  update(deltaTime) {
    const { level, player } = this.game;
    this.timer -= deltaTime;
    if (this.timer <= 0 && this.dropped < MAX_ROCKS) {
      this.timer = INTERVAL_MS[0] + Math.random() * (INTERVAL_MS[1] - INTERVAL_MS[0]);
      const spot = this.pickSpot();
      if (spot) this.warnings.push({ ...spot, age: 0 });
    }

    for (const w of this.warnings) {
      w.age += deltaTime;
      if (w.age >= WARN_MS && !w.done) {
        w.done = true;
        this.impact(w, level, player);
      }
    }
    this.warnings = this.warnings.filter((w) => !w.done);
  }

  pickSpot() {
    const { level } = this.game;
    for (let tries = 0; tries < 12; tries++) {
      const spot = level.randomFreeCell(this.warnings.map((w) => level.cellRect(w.cell)));
      if (!spot) return null;
      const cell = { col: Math.floor(spot.x / TILE_SIZE), row: Math.floor(spot.y / TILE_SIZE) };
      const base = level.baseCell;
      const nearBase = base && Math.abs(cell.col - base.col) <= 2 && Math.abs(cell.row - base.row) <= 2;
      const start = level.definition.playerStart;
      const onStart = cell.col === start.col && cell.row === start.row;
      if (!nearBase && !onStart) return { cell, x: spot.x, y: spot.y };
    }
    return null;
  }

  impact(w, level, player) {
    const game = this.game;
    const rect = level.cellRect(w.cell);
    let hitTank = false;
    for (const tank of game.tanks) {
      if (intersects(rect, tank)) {
        hitTank = true;
        tank.takeDamage(1);
      }
    }

    if (!hitTank) level.replaceCell(w.cell, TILE.WALL_CRACKED);
    this.dropped++;
    if (game.effects) {
      game.effects.burst(w.x, w.y, DUST, 22, 120, 3);
      game.effects.shake(160, 2);
    }
    playSound("explosion");
  }

  draw(ctx) {
    const images = assets.images.biomes[this.game.level.biome];
    const rock = images && (images.cracked || images.wall);
    for (const w of this.warnings) {
      const p = Math.min(1, w.age / WARN_MS);

      const size = Math.round(8 + (TILE_SIZE - 8) * p);
      const blink = Math.floor(w.age / 120) % 2 === 0 ? 0.55 : 0.35;
      ctx.globalAlpha = blink * (0.4 + 0.6 * p);
      ctx.fillStyle = "#1a0a04";
      ctx.fillRect(Math.round(w.x - size / 2), Math.round(w.y - size / 2 + 2), size, size - 4);

      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "#ff4a3a";
      const x0 = w.x - HALF_TILE, y0 = w.y - HALF_TILE, s = TILE_SIZE, k = 6;
      for (const [cx, cy, dx, dy] of [[x0, y0, 1, 1], [x0 + s, y0, -1, 1], [x0, y0 + s, 1, -1], [x0 + s, y0 + s, -1, -1]]) {
        ctx.fillRect(Math.round(dx > 0 ? cx : cx - k), Math.round(dy > 0 ? cy : cy - 2), k, 2);
        ctx.fillRect(Math.round(dx > 0 ? cx : cx - 2), Math.round(dy > 0 ? cy : cy - k), 2, k);
      }
      ctx.globalAlpha = 1;

      const fall = (w.age - (WARN_MS - FALL_MS)) / FALL_MS;
      if (fall > 0) {
        const y = w.y - HALF_TILE - (1 - fall) * 90;
        const img = Array.isArray(rock) ? rock[0] : rock;
        for (const [dx, dy] of [[0, 0], [HALF_TILE, 0], [0, HALF_TILE], [HALF_TILE, HALF_TILE]]) {
          const q = Array.isArray(rock) ? rock[[0, 1, 3, 2][(dx ? 1 : 0) + (dy ? 2 : 0)]] : img;
          if (!drawSprite(ctx, q, w.x - HALF_TILE + dx, y + dy, HALF_TILE, HALF_TILE)) {
            ctx.fillStyle = "#a3492b";
            ctx.fillRect(Math.round(w.x - HALF_TILE + dx), Math.round(y + dy), HALF_TILE, HALF_TILE);
          }
        }
      }
    }
  }
}
