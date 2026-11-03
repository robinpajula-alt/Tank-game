import { BIOMES } from "./config.js";

const DIRECTION_NAMES = ["up", "down", "left", "right"];
const FRAMES_PER_DIRECTION = 4; // 0 = seisab, 1..3 = liikumine
const TANK_SPRITE_SETS = ["player", "enemy1"]; // uus komplekt = lisa nimi siia + kaust assets/images/<nimi>/

const BLOCK_FILES = {
  brick: "brick.png",
  steel: "steel.png",
  base: "base.png",
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
  images: { tanks: {}, blocks: {}, biomes: {} },
  sounds: {},
};

for (const setName of TANK_SPRITE_SETS)
  assets.images.tanks[setName] = loadTankSprites(setName);
for (const [key, file] of Object.entries(BLOCK_FILES))
  assets.images.blocks[key] = loadImage(`assets/images/${file}`);
/** { file } -> üks pilt, { files: [...] } -> pildimassiiv (nurgapildid). */
function loadSpec(spec, quiet) {
  if (spec.files)
    return spec.files.map((file) => loadImage(`assets/images/${file}`, quiet));
  return loadImage(`assets/images/${spec.file}`, quiet);
}

for (const [name, biome] of Object.entries(BIOMES)) {
  if (biome.from) continue; // tuletatud bioom: tehakse loadAssets()-is
  const quiet = !!biome.optional;
  assets.images.biomes[name] = {
    ground: loadSpec(biome.ground, quiet),
    wall: loadSpec(biome.wall, quiet),
    cracked: biome.cracked ? loadSpec(biome.cracked, quiet) : null,
  };
}
for (const [key, src] of Object.entries(SOUND_FILES))
  assets.sounds[key] = loadSound(src);

/** Teeb pildist toonitud koopia (üks kord laadimisel). Kui pilt pole laetud, tagastab originaali. */
function tintImage(img, filter) {
  if (!filter || !img || !(img.complete && img.naturalWidth > 0))
    return Promise.resolve(img);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.filter = filter; // Safaris puudub: siis jääb pilt toonimata
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
    };
  }
}

export async function loadAssets() {
  await Promise.all(pendingImages);
  await buildDerivedBiomes();
}

/** Ainus koht, kus on img.complete && naturalWidth > 0 kontroll. Tagastab true, kui joonistas. */
export function drawSprite(ctx, img, x, y, width, height) {
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, Math.round(x), Math.round(y), width, height);
    return true;
  }
  return false;
}

export function playSound(name) {
  const base = assets.sounds[name];
  if (!base) return;
  const sound = base.cloneNode();
  sound.volume = base.volume;
  sound.play().catch(() => {});
}
