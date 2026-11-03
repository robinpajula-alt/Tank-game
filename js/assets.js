import { BIOMES, STEEL_TINT } from "./config.js";

const DIRECTION_NAMES = ["up", "down", "left", "right"];
const FRAMES_PER_DIRECTION = 4;
const TANK_SPRITE_SETS = ["player", "enemy1"];

const BIOME_TANKS = ["desert", "canyon", "swamp", "tundra", "volcano"].flatMap((b) =>
  ["basic", "fast", "armored"].map((t) => `${b}_${t}`),
);
const TANK_SHEETS = ["hero", "boss", ...BIOME_TANKS];

const BLOCK_FILES = {
  brick: "brick.png",
  base: "tiles/base.png",
};
const QUIET_BLOCKS = new Set(["brick"]);

const BULLET_FILES = {
  player: "bullets/player_bullet.png",
  enemy: "bullets/enemy_bullet.png",
  boss: "bullets/boss_bullet.png",
};

const POWERUP_FILES = {
  speed: "powerups/speed.png",
  shield: "powerups/shield.png",
  freeze: "powerups/freeze.png",
  life: "powerups/life.png",
};

const SOUND_FILES = {
  shoot: "assets/sounds/shoot.wav",
  explosion: "assets/sounds/explosion.wav",
  baseDestroyed: "assets/sounds/baseDestroyed.wav",
  powerup: "assets/sounds/powerup.wav",
};

const pendingImages = [];

function loadImage(src, quiet = false) {
  const img = new Image();
  pendingImages.push(
    new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = () => {
        if (!quiet) console.warn(`Pilti ei leitud: ${src}`);
        resolve();
      };
    }),
  );
  img.src = src;
  return img;
}

function loadSound(src) {
  const audio = new Audio(src);
  audio.preload = "auto";
  audio.volume = 0.5;
  return audio;
}

function loadTankSprites(setName) {
  const sprites = {};
  for (const dir of DIRECTION_NAMES) {
    sprites[dir] = [];
    for (let i = 0; i < FRAMES_PER_DIRECTION; i++) {
      sprites[dir].push(
        loadImage(`assets/images/${setName}/${dir}/${setName}_${dir}_${i}.png`),
      );
    }
  }
  return sprites;
}

export const assets = {
  images: { tanks: {}, blocks: {}, biomes: {}, bullets: {}, powerups: {} },
  sounds: {},
};

for (const setName of TANK_SPRITE_SETS)
  assets.images.tanks[setName] = loadTankSprites(setName);
const tankSheets = {};
for (const setName of TANK_SHEETS)
  tankSheets[setName] = loadImage(`assets/images/tanks/${setName}.png`);
for (const [key, file] of Object.entries(BLOCK_FILES))
  assets.images.blocks[key] = loadImage(`assets/images/${file}`, QUIET_BLOCKS.has(key));
for (const [key, file] of Object.entries(BULLET_FILES))
  assets.images.bullets[key] = loadImage(`assets/images/${file}`, true);
for (const [key, file] of Object.entries(POWERUP_FILES))
  assets.images.powerups[key] = loadImage(`assets/images/${file}`, true);

function loadSpec(spec, quiet) {
  if (spec.files)
    return spec.files.map((file) => loadImage(`assets/images/${file}`, quiet));
  return loadImage(`assets/images/${spec.file}`, quiet);
}

for (const [name, biome] of Object.entries(BIOMES)) {
  if (biome.from) continue;
  const quiet = !!biome.optional;
  assets.images.biomes[name] = {
    ground: loadSpec(biome.ground, quiet),
    wall: loadSpec(biome.wall, quiet),
    cracked: biome.cracked ? loadSpec(biome.cracked, quiet) : null,
    steel: biome.steel ? loadSpec(biome.steel, quiet) : null,
    liquid: biome.liquid ? loadSpec(biome.liquid, quiet) : null,
    slick: biome.slick ? loadSpec(biome.slick, quiet) : null,
  };
}
for (const [key, src] of Object.entries(SOUND_FILES))
  assets.sounds[key] = loadSound(src);

function tintImage(img, filter) {
  if (!filter || !img || !(img.complete && img.naturalWidth > 0))
    return Promise.resolve(img);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.filter = filter;
  ctx.drawImage(img, 0, 0);
  return new Promise((resolve) => {
    const tinted = new Image();
    tinted.onload = () => resolve(tinted);
    tinted.onerror = () => resolve(img);
    tinted.src = canvas.toDataURL();
  });
}

function tintSpec(value, filter) {
  if (!value) return Promise.resolve(null);
  return Array.isArray(value)
    ? Promise.all(value.map((img) => tintImage(img, filter)))
    : tintImage(value, filter);
}

async function buildDerivedBiomes() {
  for (const [name, biome] of Object.entries(BIOMES)) {
    if (!biome.from) continue;
    const source = assets.images.biomes[biome.from];
    if (!source || BIOMES[biome.from].from)
      throw new Error(
        `Bioom "${name}": "from" peab osutama päris bioomile, mitte "${biome.from}"`,
      );
    assets.images.biomes[name] = {
      ground: await tintSpec(source.ground, biome.tint),
      wall: await tintSpec(source.wall, biome.tint),
      cracked: await tintSpec(source.cracked, biome.tint),
      liquid: await tintSpec(source.liquid, biome.tint),
      slick: await tintSpec(source.slick, biome.tint),
    };
  }
}

async function buildSteel() {
  for (const set of Object.values(assets.images.biomes)) {
    if (!set.steel) set.steel = await tintSpec(set.wall, STEEL_TINT);
  }
}

function sliceImage(sheet, sx, sy, w, h) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(sheet, sx, sy, w, h, 0, 0, w, h);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = canvas.toDataURL();
  });
}

async function buildTankSheets() {
  for (const [setName, sheet] of Object.entries(tankSheets)) {
    if (!(sheet.complete && sheet.naturalWidth > 0)) continue;
    const w = sheet.naturalWidth / FRAMES_PER_DIRECTION;
    const h = sheet.naturalHeight / DIRECTION_NAMES.length;
    const sprites = {};
    for (const [row, dir] of DIRECTION_NAMES.entries()) {
      sprites[dir] = await Promise.all(
        [0, 1, 2, 3].map((i) => sliceImage(sheet, i * w, row * h, w, h)),
      );
    }
    assets.images.tanks[setName] = sprites;
  }
}

export async function loadAssets() {
  await Promise.all(pendingImages);
  await buildDerivedBiomes();
  await buildSteel();
  await buildTankSheets();
}

export function drawSprite(ctx, img, x, y, width, height) {
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, Math.round(x), Math.round(y), width, height);
    return true;
  }
  return false;
}

let sfxVolume = 1;

export function setSfxVolume(value) {
  sfxVolume = value;
}

export function playSound(name) {
  const base = assets.sounds[name];
  if (!base || sfxVolume <= 0) return;
  const sound = base.cloneNode();
  sound.volume = base.volume * sfxVolume;
  sound.play().catch(() => {});
}
