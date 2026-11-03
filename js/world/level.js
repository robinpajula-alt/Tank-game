import {
  TILE_SIZE,
  HALF_TILE,
  TANK_SIZE,
  GRID_COLS,
  GRID_ROWS,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TILE,
  biomeSpec,
} from "../config.js";
import { Brick, Steel, Base, Wall } from "./block.js";
import { assets, drawSprite } from "../assets.js";
import { intersects } from "../core/collision.js";

// Registri-põhine laadimine. split = jaga 4 alamplokiks (16x16), muidu üks 32x32 plokk.
const TILE_TYPES = {
  [TILE.BRICK]: { split: true, create: (x, y, w, h) => new Brick(x, y, w, h) },
  [TILE.STEEL]: {
    split: true,
    create: (x, y, w, h, biome, q) => new Steel(x, y, w, h, biome, q),
  },
  [TILE.BASE]: { split: false, create: (x, y, w, h) => new Base(x, y, w, h) },
  [TILE.WALL]: {
    split: true,
    create: (x, y, w, h, biome, q) => new Wall(x, y, w, h, biome, false, q),
  },
  [TILE.WALL_CRACKED]: {
    split: true,
    create: (x, y, w, h, biome, q) => new Wall(x, y, w, h, biome, true, q),
  },
};

/** Üks laetud tase: plokid, maapind, alguspunktid, baasi tugevdamine. */
export class Level {
  constructor(definition, game) {
    this.definition = definition;
    this.game = game;
    this.biome = definition.biome;
    this.map = definition.map;
    this.blocks = [];

    this.playerStart = this.cellToPosition(definition.playerStart);
    this.enemySpawnCells = definition.enemySpawns;

    this.baseCell = this.findBaseCell();
    this.baseCenter = this.baseCell
      ? {
          x: this.baseCell.col * TILE_SIZE + HALF_TILE,
          y: this.baseCell.row * TILE_SIZE + HALF_TILE,
        }
      : null;
    this.guardCells = this.findGuardCells();
    this.fortifyTimer = 0;
    this.fortifiedCells = new Set();

    this.groundCanvas = this.renderGround();
    this.buildBlocks();
  }

  /** Keskendab suuruse `size` objekti lahtri keskele (ja hoiab ta kaardi sees). */
  cellToPosition({ col, row }, size = TANK_SIZE) {
    const offset = (TILE_SIZE - size) / 2;
    return {
      x: Math.min(Math.max(col * TILE_SIZE + offset, 0), CANVAS_WIDTH - size),
      y: Math.min(Math.max(row * TILE_SIZE + offset, 0), CANVAS_HEIGHT - size),
    };
  }

  cellRect({ col, row }) {
    return {
      x: col * TILE_SIZE,
      y: row * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
    };
  }

  // ----- Ehitamine -----
  createCellBlocks(col, row, type) {
    const entry = TILE_TYPES[type];
    if (!entry) return [];
    const x = col * TILE_SIZE;
    const y = row * TILE_SIZE;
    if (!entry.split)
      return [entry.create(x, y, TILE_SIZE, TILE_SIZE, this.biome)];
    // [dx, dy, nurk] – nurgad päripäeva: 0 üleval vasakul, 1 üleval paremal, 2 all paremal, 3 all vasakul
    return [
      [0, 0, 0],
      [HALF_TILE, 0, 1],
      [HALF_TILE, HALF_TILE, 2],
      [0, HALF_TILE, 3],
    ].map(([dx, dy, quadrant]) =>
      entry.create(x + dx, y + dy, HALF_TILE, HALF_TILE, this.biome, quadrant),
    );
  }

  buildBlocks() {
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        this.blocks.push(
          ...this.createCellBlocks(col, row, this.map[row][col]),
        );
      }
    }
  }

  /** Maapind joonistatakse ÜKS kord offscreen canvasele. */
  renderGround() {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const g = canvas.getContext("2d");
    g.imageSmoothingEnabled = false;

    const img = assets.images.biomes[this.biome].ground;
    const color = biomeSpec(this.biome).ground.color;
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;
        if (!drawSprite(g, img, x, y, TILE_SIZE, TILE_SIZE)) {
          g.fillStyle = color;
          g.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        }
      }
    }
    return canvas;
  }

  // ----- Baasi tugevdamine (power-up) -----
  findBaseCell() {
    let base = null;
    this.map.forEach((rowData, row) =>
      rowData.forEach((type, col) => {
        if (type === TILE.BASE) base = { col, row };
      }),
    );
    return base;
  }

  findGuardCells() {
    const base = this.baseCell;
    if (!base) return [];

    const cells = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const col = base.col + dc;
        const row = base.row + dr;
        if (
          (dr === 0 && dc === 0) ||
          col < 0 ||
          row < 0 ||
          col >= GRID_COLS ||
          row >= GRID_ROWS
        )
          continue;
        cells.push({ col, row });
      }
    }
    return cells;
  }

  isCellOccupied(cell) {
    const rect = this.cellRect(cell);
    return this.game.tanks.some((tank) => intersects(rect, tank));
  }

  /** Asendab lahtri plokid uue tüübiga (0 = tühjaks). */
  replaceCell(cell, type) {
    const rect = this.cellRect(cell);
    this.blocks = this.blocks.filter((block) => {
      const cx = block.x + block.width / 2;
      const cy = block.y + block.height / 2;
      return !(
        cx >= rect.x &&
        cx < rect.x + rect.width &&
        cy >= rect.y &&
        cy < rect.y + rect.height
      );
    });
    this.blocks.push(...this.createCellBlocks(cell.col, cell.row, type));
  }

  fortifyBase(durationMs) {
    this.fortifyTimer = durationMs;
    for (const cell of this.guardCells) {
      if (this.fortifiedCells.has(cell) || this.isCellOccupied(cell)) continue; // tanki sisse ei ehita
      this.replaceCell(cell, TILE.STEEL);
      this.fortifiedCells.add(cell);
    }
  }

  update(deltaTime) {
    if (this.fortifyTimer > 0) {
      this.fortifyTimer -= deltaTime;
      return;
    }
    // Aeg läbi: taasta algne sein (kui lahtris seisab tank, proovi uuesti hiljem).
    for (const cell of [...this.fortifiedCells]) {
      if (this.isCellOccupied(cell)) continue;
      this.replaceCell(cell, this.map[cell.row][cell.col]);
      this.fortifiedCells.delete(cell);
    }
  }

  // ----- Päringud (etapis 4 saab sisemuse ruudustikuks, väljastpoolt ei muutu midagi) -----
  blocksOverlapping(rect) {
    return this.blocks.filter((block) => intersects(rect, block));
  }

  collidesWithBlocks(rect) {
    return this.blocks.some((block) => intersects(rect, block));
  }

  removeDestroyed() {
    this.blocks = this.blocks.filter((block) => !block.markedForDeletion);
  }

  drawGround(ctx) {
    ctx.drawImage(this.groundCanvas, 0, 0);
  }

  drawBlocks(ctx) {
    this.blocks.forEach((block) => block.draw(ctx));
  }
}
