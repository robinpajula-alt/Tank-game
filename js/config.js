// ===== Ruudustik ja mõõtmed =====
export const TILE_SIZE = 32;
export const HALF_TILE = TILE_SIZE / 2;
export const GRID_COLS = 15;
export const GRID_ROWS = 15;
export const CANVAS_WIDTH = GRID_COLS * TILE_SIZE; // 480
export const CANVAS_HEIGHT = GRID_ROWS * TILE_SIZE; // 480
export const TANK_SIZE = TILE_SIZE - 4;

// ===== Ajastus (fikseeritud ajasamm: sama kiirus igal monitoril) =====
export const STEP_MS = 1000 / 60;
export const MAX_FRAME_MS = 100;

// ===== Liikumine ja lahing =====
export const PLAYER_SPEED = 120; // pikslit sekundis
export const BULLET_SPEED = 480;
export const BULLET_LONG = 12;
export const BULLET_SHORT = 10;
export const ASSIST_PIXELS = 12; // nurgast mööda libisemise abi (mida suurem, seda andestavam)
export const PLAYER_SHOOT_COOLDOWN = 400;

// ===== Mängureeglid =====
export const PLAYER_START_LIVES = 3;
export const MAX_LIVES = 5;
export const RESPAWN_INVULNERABILITY_MS = 2000;
export const ENEMY_SPAWN_INTERVAL_MS = 5000;
export const FIRST_SPAWN_DELAY_MS = 1000;
export const ENEMY_DIRECTION_CHANGE_MS = 2000;
export const ENEMY_REACTION_MS = 600; // vaenlane tulistab nii kiiresti, kui näeb sind otse ees

// ===== Power-upid =====
export const POWERUP_DROP_CHANCE = 0.2;
export const POWERUP_LIFETIME_MS = 12000;
export const SPEED_BOOST_FACTOR = 1.6;

// Arendaja klahvid (1–5 tase, N järgmine, K tapa kõik, G surematus). Lülita enne avaldamist VÄLJA.
export const DEBUG = true;

export const TEAM = Object.freeze({ PLAYER: "player", ENEMY: "enemy" });

export const DIRECTIONS = Object.freeze({
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
});

// ===== Kaardikoodid =====
// 0 = tühi, 1 = tellis, 2 = teras, 3 = Kõrbetäht (baas),
// 4 = bioomi sein, 5 = bioomi mõranenud sein (nende pilt sõltub bioomist)
export const TILE = Object.freeze({
  GROUND: 0,
  BRICK: 1,
  STEEL: 2,
  BASE: 3,
  WALL: 4,
  WALL_CRACKED: 5,
});

// ===== Bioomid =====
// Uus bioom = uus kirje + pildid assets/images/ kausta. Puuduva pildi asemel kasutatakse värvi.
// optional: true => puuduva pildi kohta ei tule konsooli hoiatust.
export const BIOMES = {
  // Faili tee on kausta assets/images/ suhtes.
  // ground / wall / cracked: { file, color }  -> üks pilt (venitatakse igale alamplokile)
  //                       või { files: [4 pilti], color } -> iga alamplokk saab oma nurgapildi,
  //                          järjekord päripäeva: 0 üleval vasakul, 1 üleval paremal, 2 all paremal, 3 all vasakul.
  // cracked võib ära jätta: siis kasutatakse mõranenud seina asemel tavalist seina.
  // optional: true => puuduvate piltide kohta ei tule konsooli hoiatust (kasutatakse varuvärve).
  desert: {
    ground: { file: "tiles/desert/sand.png", color: "#d2b48c" },
    wall: {
      files: [
        "tiles/desert/sprite_sand0.png",
        "tiles/desert/sprite_sand1.png",
        "tiles/desert/sprite_sand2.png",
        "tiles/desert/sprite_sand3.png",
      ],
      color: "#e0a96d",
    },
  },
  tundra: {
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
  },

  // Tuletatud bioomid: kasutavad teise bioomi pilte, aga värvitooniga (CSS filter süntaks).
  // from: bioom, mille pilte kasutada (peab olema päris bioom, mitte tuletatud).
  // tint: hue-rotate = värvitoon, saturate = küllastus, brightness = heledus.
  // Kui tahad hiljem OMA pildid, asenda kirje tavalise (ground / wall) kirjega nagu desert ja tundra.
  canyon: {
    from: "desert",
    tint: "hue-rotate(-25deg) saturate(1.2) brightness(0.85)",
  },
  swamp: {
    from: "tundra",
    tint: "hue-rotate(-85deg) saturate(0.8) brightness(0.75)",
  },
  volcano: {
    from: "desert",
    tint: "hue-rotate(-30deg) saturate(1.6) brightness(0.45)",
  },
};

/** Bioomi andmed, kus `from` on lahendatud (pildi- ja värviandmed tulevad algbioomilt). */
export function biomeSpec(name) {
  const biome = BIOMES[name];
  if (!biome) throw new Error(`Tundmatu bioom: "${name}" (config.js BIOMES)`);
  return biome.from ? { ...BIOMES[biome.from], ...biome } : biome;
}

// ===== Muusika =====
// KIRJUTA SIIA OMA FAILINIMED. Failid asuvad kaustas MUSIC_FOLDER.
// Võtmed: "menu" ning iga bioomi nimi. null = selles kohas muusikat pole.
// Muusika vahetub, kui bioom muutub (sama bioomi järjestikustel tasemetel jätkub sama lugu).
export const MUSIC_FOLDER = "assets/music/";
export const MUSIC_VOLUME = 0.35; // 0..1
export const MUSIC = {
  menu: "menu.wav",
  desert: "desert.wav",
  canyon: "canyon.wav",
  swamp: "swamp.wav",
  tundra: "tundra.wav",
  volcano: "volcano.wav",
};

// ===== Tasemed =====
// enemies: { tüüp: arv } (tüübid enemytypes.js-ist). Boss tuleb alati esimesena.
export const levels = [
  {
    name: "Kõrbe värav",
    biome: "desert",
    intro:
      "Sajandeid on Kõrbetäht hoidnud liivamere rahus. Nüüd on röövlipealik Karak saatnud oma soomustatud bandiidid seda omastama. Sina oled viimane tankikaitsja. Ära lase ühelgi vaenlasel kivini jõuda!",
    outro:
      "Esimene rünnak on tõrjutud, aga Täht on nõrgenenud. Legend räägib Vulkaani Altarist, kus kivi saaks jõudu taastada. Karaki bandiidid jälitavad sind igal sammul.",
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
      [0, 4, 4, 0, 4, 4, 0, 5, 0, 4, 4, 0, 4, 4, 0],
      [0, 4, 5, 0, 4, 4, 0, 4, 0, 4, 4, 0, 5, 4, 0],
      [0, 4, 4, 0, 4, 4, 0, 4, 0, 4, 4, 0, 4, 4, 0],
      [0, 5, 4, 0, 4, 5, 0, 4, 0, 5, 4, 0, 4, 5, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 4, 4, 0, 4, 4, 0, 5, 0, 4, 4, 0, 4, 4, 0],
      [0, 5, 4, 0, 4, 4, 0, 4, 0, 4, 4, 0, 4, 5, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [4, 4, 0, 4, 5, 4, 4, 0, 4, 4, 5, 4, 0, 4, 4],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 4, 5, 0, 4, 4, 0, 0, 0, 4, 4, 0, 5, 4, 0],
      [0, 4, 4, 0, 4, 5, 0, 5, 0, 5, 4, 0, 4, 4, 0],
      [0, 5, 4, 0, 4, 4, 4, 4, 4, 4, 4, 0, 4, 5, 0],
      [0, 0, 0, 0, 0, 0, 4, 3, 4, 0, 0, 0, 0, 0, 0],
    ],
  },
  {
    name: "Punane kanjon",
    biome: "canyon",
    intro:
      "Kanjoni kitsad käigud sobivad varitsusteks ja röövlid on õppinud kiiremini sõitma. Langenud vaenlased jätavad mõnikord maha abivahendeid. Korja need üles!",
    outro:
      "Kanjon jääb selja taha. Ees on udune soo, kuhu Karak on saatnud oma soomustatud brigaadi.",
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
    name: "Udune soo",
    biome: "swamp",
    intro:
      "Soos ei näe kaugele ja soomustatud tankid ei vea kergelt alla. Nendel on kaks elu, mõrane sein ei pea samuti kaua vastu.",
    outro:
      "Soo on selja taga. Ees laiub külmunud lagendik, kus tuul kannab liiva asemel lund.",
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
      [0, 4, 0, 5, 0, 4, 4, 0, 4, 4, 0, 5, 0, 4, 0],
      [0, 4, 0, 0, 0, 0, 5, 0, 5, 0, 0, 0, 0, 4, 0],
      [0, 5, 4, 0, 4, 0, 0, 0, 0, 0, 4, 0, 4, 5, 0],
      [0, 0, 0, 0, 4, 5, 0, 2, 0, 5, 4, 0, 0, 0, 0],
      [4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4],
      [0, 0, 0, 5, 4, 0, 4, 0, 4, 0, 4, 5, 0, 0, 0],
      [0, 2, 0, 0, 0, 0, 4, 0, 4, 0, 0, 0, 0, 2, 0],
      [0, 0, 0, 4, 5, 0, 0, 0, 0, 0, 5, 4, 0, 0, 0],
      [0, 4, 4, 0, 0, 0, 2, 0, 2, 0, 0, 0, 4, 4, 0],
      [0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0],
      [0, 5, 0, 4, 4, 0, 5, 0, 5, 0, 4, 4, 0, 5, 0],
      [0, 4, 0, 0, 0, 0, 4, 0, 4, 0, 0, 0, 0, 4, 0],
      [0, 0, 0, 4, 0, 0, 4, 4, 4, 0, 0, 4, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 4, 3, 4, 0, 0, 0, 0, 0, 0],
    ],
  },
  {
    name: "Külmunud lagendik",
    biome: "tundra",
    intro:
      "Külmas muutuvad bandiidid ägedamaks ja neid on rohkem. Terasmüürid annavad kaitset, aga ka vaenlasele peavarju. Mõtle, kuhu sa sõidad.",
    outro:
      "Silmapiiril hõõgub vulkaan. Seal, mustade kivide taga, ootab Karak oma raudses kindluses.",
    playerStart: { col: 4, row: 14 },
    enemySpawns: [
      { col: 0, row: 0 },
      { col: 7, row: 0 },
      { col: 14, row: 0 },
    ],
    enemies: { basic: 8, fast: 8, armored: 12 },
    maxEnemiesOnScreen: 6,
    map: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 2, 2, 0, 0, 4, 4, 0, 4, 4, 0, 0, 2, 2, 0],
      [0, 0, 0, 0, 4, 5, 0, 0, 0, 5, 4, 0, 0, 0, 0],
      [4, 4, 0, 2, 0, 0, 0, 4, 0, 0, 0, 2, 0, 4, 4],
      [0, 5, 0, 2, 0, 4, 0, 0, 0, 4, 0, 2, 0, 5, 0],
      [0, 0, 0, 0, 0, 4, 5, 0, 5, 4, 0, 0, 0, 0, 0],
      [0, 4, 4, 0, 0, 0, 0, 2, 0, 0, 0, 0, 4, 4, 0],
      [0, 0, 5, 0, 2, 0, 0, 0, 0, 0, 2, 0, 5, 0, 0],
      [4, 0, 0, 0, 2, 0, 4, 0, 4, 0, 2, 0, 0, 0, 4],
      [4, 5, 0, 0, 0, 0, 4, 0, 4, 0, 0, 0, 0, 5, 4],
      [0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0],
      [0, 2, 0, 0, 0, 0, 5, 4, 5, 0, 0, 0, 0, 2, 0],
      [0, 2, 0, 4, 0, 0, 0, 0, 0, 0, 4, 0, 0, 2, 0],
      [0, 0, 0, 5, 0, 0, 4, 4, 4, 0, 5, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 4, 3, 4, 0, 0, 0, 0, 0, 0],
    ],
  },
  {
    name: "Karaki kindlus",
    biome: "volcano",
    intro:
      "Vulkaani jalamil seisab Karaki raudne kindlus. Pealik ise sõidab lahingusse. Tema soomus peab vastu palju lööke ja mida vähem tal on jõudu, seda raevukamalt ta tulistab. Kaitse kivi, kuni Karak on langenud!",
    outro:
      "Karak langes ja tema bandiidid hajusid tuhasse. Kõrbetäht sädeleb Vulkaani Altaril taas täies jõus ja kõrb on jälle turvaline. Tänu sinule. – LÕPP –",
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
      [0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0],
      [0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 4, 4, 0, 0, 0, 4, 4, 0, 0, 0, 0],
      [0, 0, 0, 0, 4, 5, 0, 0, 0, 5, 4, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0],
      [0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0],
      [0, 0, 0, 5, 0, 0, 4, 4, 4, 0, 0, 5, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 4, 3, 4, 0, 0, 0, 0, 0, 0],
    ],
  },
];
