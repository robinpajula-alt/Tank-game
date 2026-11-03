export const TILE_SIZE = 32;
export const HALF_TILE = TILE_SIZE / 2;
export const GRID_COLS = 15;
export const GRID_ROWS = 15;
export const CANVAS_WIDTH = GRID_COLS * TILE_SIZE;
export const CANVAS_HEIGHT = GRID_ROWS * TILE_SIZE;
export const TANK_SIZE = TILE_SIZE - 4;

export const STEP_MS = 1000 / 60;
export const MAX_FRAME_MS = 100;

export const PLAYER_SPEED = 120;
export const BULLET_SPEED = 480;
export const BULLET_LONG = 12;
export const BULLET_SHORT = 10;
export const ASSIST_PIXELS = 12;
export const PLAYER_SHOOT_COOLDOWN = 400;

export const PLAYER_START_LIVES = 3;

export const LEVEL_CLEAR_BONUS_LIVES = 1;

export const SCORE_DEATH_PENALTY = 500;
export const SCORE_LEVEL_BONUS = 500;

export const CHECKPOINT_AFTER_LEVEL = 3;
export const MAX_LIVES = 5;
export const RESPAWN_INVULNERABILITY_MS = 2000;
export const ENEMY_SPAWN_INTERVAL_MS = 5000;
export const FIRST_SPAWN_DELAY_MS = 1000;
export const ENEMY_DIRECTION_CHANGE_MS = 2000;
export const ENEMY_REACTION_MS = 600;

export const POWERUP_DROP_CHANCE = 0.12;
export const POWERUP_SPAWN_MS = [15000, 22000];
export const POWERUP_MAX_ON_MAP = 2;
export const POWERUP_LIFETIME_MS = 12000;
export const SPEED_BOOST_FACTOR = 1.6;

export const DEBUG = true;

export const FEATURES = Object.freeze({
  explosions: true,
  screenShake: true,
  fancyShield: true,
  newTankSprites: true,
  weather: true,
  slipperyIce: true,
  finaleCutscene: true,
  rockfall: true,
});

export const ICE_ACCELERATION = 240;

export const TEAM = Object.freeze({ PLAYER: "player", ENEMY: "enemy" });

export const DIRECTIONS = Object.freeze({
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
});

export const TILE = Object.freeze({
  GROUND: 0,
  BRICK: 1,
  STEEL: 2,
  BASE: 3,
  WALL: 4,
  WALL_CRACKED: 5,
  LIQUID: 6,
  ICE: 7,
});

export const STEEL_TINT = "grayscale(0.5) brightness(0.55) contrast(1.15)";

const fourFiles = (prefix) => [0, 1, 2, 3].map((i) => `${prefix}${i}.png`);

export const BIOMES = {

  desert: {
    titleColor: "#ffd24a",
    ground: { file: "tiles/desert/sand.png", color: "#d2b48c" },
    wall: { files: fourFiles("tiles/desert/sand_block"), color: "#ca9300" },
    cracked: { files: fourFiles("tiles/desert/sand_block_cracked"), color: "#b88600" },
  },
  tundra: {
    titleColor: "#bff0ff",
    ground: { file: "tiles/ice/ice.png", color: "#dcecf5" },
    wall: {
      files: [
        "tiles/ice/sprite_ice_wall0.png",
        "tiles/ice/sprite_ice_wall1.png",
        "tiles/ice/sprite_ice_wall2.png",
        "tiles/ice/sprite_ice_wall3.png",
      ],
      color: "#9ec9e0",
    },
    slick: { file: "tiles/ice/slick_ice.png", color: "#7fc4ea" },
  },

  canyon: {
    titleColor: "#ff7a4a",
    ground: { file: "tiles/canyon/canyon_ground.png", color: "#b9653e" },
    wall: { files: fourFiles("tiles/canyon/canyon_block"), color: "#b5512f" },
    cracked: { files: fourFiles("tiles/canyon/canyon_block_cracked"), color: "#a3492b" },
  },
  swamp: {
    titleColor: "#a6e05a",
    ground: { file: "tiles/swamp/swamp_ground.png", color: "#4a4128" },
    wall: { files: fourFiles("tiles/swamp/swamp_block"), color: "#66786b" },
    cracked: { files: fourFiles("tiles/swamp/swamp_block_cracked"), color: "#58695c" },
    liquid: { files: fourFiles("tiles/swamp/sprite_swamp_water"), color: "#2f5e4a", frameMs: 300, stagger: true },
  },
  volcano: {
    titleColor: "#ff5a1a",
    ground: { file: "tiles/volcano/volcano_ground.png", color: "#3a3134" },
    wall: { files: fourFiles("tiles/volcano/volcano_block"), color: "#3b3135" },
    cracked: { files: fourFiles("tiles/volcano/volcano_block_cracked"), color: "#2a2124" },
    liquid: { files: fourFiles("tiles/volcano/lava"), color: "#e04a06", frameMs: 250, stagger: true },
  },

};

export function biomeSpec(name) {
  const biome = BIOMES[name];
  if (!biome) throw new Error(`Tundmatu bioom: "${name}" (config.js BIOMES)`);
  return biome.from ? { ...BIOMES[biome.from], ...biome } : biome;
}

export const MUSIC_FOLDER = "assets/music/";
export const MUSIC_VOLUME = 0.35;
export const MUSIC = {
  menu: "menu.wav",
  desert: "desert.wav",
  canyon: "canyon.wav",
  swamp: "swamp.wav",
  tundra: "tundra.wav",
  volcano: "volcano.wav",
};

export const levels = [
  {
    name: "The Desert Gate",
    biome: "desert",
    intro:
      "For a thousand years the Desert Star has kept the desert calm. Tonight the warlord Karak sent his raiders to steal it. You're the last tank left to guard it.",
    outro:
      "You held off the first attack, but the Star is getting weaker. Legend says the Volcano Altar can restore its power, so you head out across the desert with Karak's raiders close behind.",
    playerStart: { col: 4, row: 14 },
    enemySpawns: [
      { col: 0, row: 0 },
      { col: 7, row: 0 },
      { col: 14, row: 0 },
    ],
    enemies: { basic: 12 },
    maxEnemiesOnScreen: 4,
    map: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 5, 4, 0, 0],
      [0, 4, 4, 5, 4, 0, 0, 4, 0, 0, 4, 4, 4, 4, 0],
      [0, 0, 4, 4, 0, 0, 4, 4, 4, 0, 0, 4, 4, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0],
      [4, 4, 0, 0, 0, 4, 0, 0, 0, 0, 4, 4, 0, 0, 4],
      [5, 4, 4, 0, 4, 4, 5, 0, 0, 0, 4, 5, 4, 0, 0],
      [0, 0, 0, 0, 0, 4, 4, 0, 4, 0, 0, 0, 0, 0, 0],
      [0, 0, 4, 0, 0, 0, 0, 0, 4, 4, 0, 0, 4, 4, 0],
      [0, 4, 4, 5, 0, 0, 0, 0, 4, 5, 4, 0, 4, 5, 0],
      [0, 0, 4, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 4, 4, 5, 0, 0, 4, 4, 0, 0, 4, 4],
      [4, 5, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 4, 5],
      [4, 4, 0, 0, 0, 0, 4, 4, 4, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 4, 3, 4, 0, 0, 0, 0, 0, 0],
    ],
  },
  {
    name: "The Red Canyon",
    biome: "canyon",
    hazard: "rockfall",
    intro:
      "The road to the volcano runs through the Red Canyon. Karak's raiders know these narrow passages well, and the cliffs above don't look very stable.",
    outro:
      "You made it through the canyon. Next up is a foggy swamp where Karak has sent his armored tanks.",
    playerStart: { col: 4, row: 14 },
    enemySpawns: [
      { col: 0, row: 0 },
      { col: 7, row: 0 },
      { col: 14, row: 0 },
    ],
    enemies: { basic: 12, fast: 8 },
    maxEnemiesOnScreen: 5,
    map: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 2, 2, 0, 4, 4, 0, 0, 0, 4, 4, 0, 2, 2, 0],
      [0, 2, 0, 0, 4, 5, 0, 2, 0, 5, 4, 0, 0, 2, 0],
      [0, 0, 0, 4, 4, 0, 0, 2, 0, 0, 4, 4, 0, 0, 0],
      [4, 4, 0, 0, 0, 0, 4, 4, 4, 0, 0, 0, 0, 4, 4],
      [0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0],
      [0, 5, 4, 0, 0, 0, 4, 0, 4, 0, 0, 0, 4, 5, 0],
      [0, 4, 4, 0, 2, 0, 4, 0, 4, 0, 2, 0, 4, 4, 0],
      [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0],
      [4, 4, 0, 4, 4, 0, 2, 0, 2, 0, 4, 4, 0, 4, 4],
      [0, 0, 0, 0, 0, 0, 2, 0, 2, 0, 0, 0, 0, 0, 0],
      [0, 4, 5, 0, 4, 4, 0, 0, 0, 4, 4, 0, 5, 4, 0],
      [0, 4, 0, 0, 0, 5, 0, 4, 0, 5, 0, 0, 0, 4, 0],
      [0, 0, 0, 4, 0, 0, 4, 4, 4, 0, 0, 4, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 4, 3, 4, 0, 0, 0, 0, 0, 0],
    ],
  },
  {
    name: "The Misty Marsh",
    biome: "swamp",
    intro:
      "The swamp is quiet, foggy and full of deep water. Somewhere in the mist, Karak's heavy tanks are waiting.",
    outro:
      "You climb out of the swamp and spot a nomad camp in the distance. Maybe they can help.",
    playerStart: { col: 4, row: 14 },
    enemySpawns: [
      { col: 0, row: 0 },
      { col: 7, row: 0 },
      { col: 14, row: 0 },
    ],
    enemies: { basic: 10, fast: 6, armored: 8 },
    maxEnemiesOnScreen: 5,
    map: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 4, 5, 0, 0, 6, 6, 0, 6, 6, 0, 0, 5, 4, 0],
      [0, 4, 0, 0, 6, 6, 6, 0, 6, 6, 6, 0, 0, 4, 0],
      [0, 0, 0, 6, 6, 6, 0, 0, 0, 6, 6, 6, 0, 0, 0],
      [6, 6, 0, 0, 6, 0, 0, 4, 0, 0, 6, 0, 0, 6, 6],
      [6, 6, 6, 0, 0, 0, 5, 4, 5, 0, 0, 0, 6, 6, 6],
      [0, 6, 0, 0, 4, 0, 0, 0, 0, 0, 4, 0, 0, 6, 0],
      [0, 0, 0, 4, 5, 0, 6, 6, 6, 0, 5, 4, 0, 0, 0],
      [0, 2, 0, 0, 0, 6, 6, 6, 6, 6, 0, 0, 0, 2, 0],
      [0, 0, 0, 6, 0, 0, 6, 6, 6, 0, 0, 6, 0, 0, 0],
      [4, 5, 0, 6, 6, 0, 0, 0, 0, 0, 6, 6, 0, 5, 4],
      [0, 0, 0, 0, 6, 0, 4, 0, 4, 0, 6, 0, 0, 0, 0],
      [0, 6, 6, 0, 0, 0, 5, 0, 5, 0, 0, 0, 6, 6, 0],
      [0, 6, 6, 0, 4, 0, 4, 4, 4, 0, 4, 0, 6, 6, 0],
      [0, 0, 0, 0, 0, 0, 4, 3, 4, 0, 0, 0, 0, 0, 0],
    ],
  },
  {
    name: "The Frozen Plain",
    biome: "tundra",
    intro:
      "Past the camp the land freezes over. It's a long, cold drive to the volcano, and the raiders are already waiting on the ice.",
    outro:
      "You can see the volcano now. Karak is waiting in his fortress at the bottom of it.",
    playerStart: { col: 4, row: 14 },
    enemySpawns: [
      { col: 0, row: 0 },
      { col: 7, row: 0 },
      { col: 14, row: 0 },
    ],
    enemies: { basic: 8, fast: 8, armored: 12 },
    maxEnemiesOnScreen: 6,
    map: [
      [0, 0, 0, 0, 0, 0, 7, 7, 7, 0, 0, 0, 0, 0, 0],
      [0, 2, 2, 0, 0, 4, 4, 7, 4, 4, 0, 0, 2, 2, 0],
      [7, 7, 7, 7, 4, 5, 7, 7, 7, 5, 4, 7, 7, 7, 7],
      [4, 4, 7, 2, 7, 7, 7, 4, 7, 7, 7, 2, 7, 4, 4],
      [7, 5, 7, 2, 7, 4, 7, 7, 7, 4, 7, 2, 7, 5, 7],
      [7, 7, 7, 7, 7, 4, 5, 7, 5, 4, 7, 7, 7, 7, 7],
      [7, 4, 4, 7, 7, 7, 7, 2, 7, 7, 7, 7, 4, 4, 7],
      [7, 7, 5, 7, 2, 7, 7, 7, 7, 7, 2, 7, 5, 7, 7],
      [4, 7, 7, 7, 2, 7, 4, 7, 4, 7, 2, 7, 7, 7, 4],
      [4, 5, 7, 7, 7, 7, 4, 7, 4, 7, 7, 7, 7, 5, 4],
      [7, 7, 7, 4, 4, 7, 7, 7, 7, 7, 4, 4, 7, 7, 7],
      [7, 2, 7, 7, 7, 7, 5, 4, 5, 7, 7, 7, 7, 2, 7],
      [0, 2, 7, 4, 7, 7, 7, 7, 7, 7, 4, 7, 7, 2, 0],
      [0, 0, 0, 5, 0, 0, 4, 4, 4, 0, 5, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 4, 3, 4, 0, 0, 0, 0, 0, 0],
    ],
  },
  {
    name: "Karak's Fortress",
    biome: "volcano",
    bossLast: true,
    bossSpawn: { col: 7, row: 7 },
    intro:
      "This is Karak's fortress. His guards will try to stop you first, and then Karak will come out himself. Nothing seems to get through his red force field.",
    outro:
      "Karak is defeated and his raiders run off into the ash. The Desert Star shines at full power on the Volcano Altar again, and the desert is safe. Thanks for playing!",
    playerStart: { col: 4, row: 14 },
    enemySpawns: [
      { col: 0, row: 0 },
      { col: 7, row: 0 },
      { col: 14, row: 0 },
    ],
    enemies: { boss: 1, basic: 8, fast: 6 },
    maxEnemiesOnScreen: 5,
    map: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0],
      [0, 0, 2, 6, 6, 0, 0, 0, 0, 0, 6, 6, 2, 0, 0],
      [0, 0, 0, 6, 6, 0, 0, 0, 0, 0, 6, 6, 0, 0, 0],
      [6, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 6],
      [6, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 6],
      [0, 0, 0, 0, 4, 4, 0, 0, 0, 4, 4, 0, 0, 0, 0],
      [0, 0, 0, 0, 5, 4, 0, 0, 0, 4, 5, 0, 0, 0, 0],
      [2, 2, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 2, 2],
      [6, 6, 0, 0, 0, 0, 6, 6, 6, 0, 0, 0, 0, 6, 6],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0],
      [0, 0, 5, 0, 0, 0, 2, 2, 2, 0, 0, 0, 5, 0, 0],
      [0, 0, 0, 0, 0, 0, 4, 3, 4, 0, 0, 0, 0, 0, 0],
    ],
  },
];
