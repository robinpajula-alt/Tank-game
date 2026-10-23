export const assets = {
    images: {
        player: {
            up: [new Image(), new Image(), new Image(), new Image()],    
            down: [new Image(), new Image(), new Image(), new Image()],
            left: [new Image(), new Image(), new Image(), new Image()],
            right: [new Image(), new Image(), new Image(), new Image()]
        },
        enemy: {
            up: [new Image(), new Image(), new Image(), new Image()],
            down: [new Image(), new Image(), new Image(), new Image()],
            left: [new Image(), new Image(), new Image(), new Image()],
            right: [new Image(), new Image(), new Image(), new Image()]
        },
        brick: new Image(),
        steel: new Image(),
        base: new Image(),
        sand: new Image(),
        sandWall: new Image(),
        sandWallBroken: new Image()
    },
    sounds: {
        shoot: new Audio(),
        explosion: new Audio(),
        baseDestroyed: new Audio()
    }
};
// Lisa varade hulka:


// Määra failiteed (pildi pühjal täpsete nimedega)[cite: 12]:
assets.images.sandWall.src = 'assets/images/sand wall.png';
assets.images.sandWallBroken.src = 'assets/images/sand wall broken.png';
// Piltide teed
assets.images.sand.src = 'assets/images/sand.png';
assets.images.steel.src = 'assets/images/steel.png';
assets.images.brick.src = 'assets/images/brick.png';
assets.images.base.src = 'assets/images/base.png';

// Vaenlase pildid
assets.images.enemy.up[0].src = 'assets/images/enemy1/up/sprite_enemy up stand.png';
assets.images.enemy.up[1].src = 'assets/images/enemy1/up/sprite_enemy up0.png';
assets.images.enemy.up[2].src = 'assets/images/enemy1/up/sprite_enemy up1.png';
assets.images.enemy.up[3].src = 'assets/images/enemy1/up/sprite_enemy up2.png';

assets.images.enemy.down[0].src = 'assets/images/enemy1/down/sprite_enemy down stand – koopia.png';
assets.images.enemy.down[1].src = 'assets/images/enemy1/down/sprite_enemy down0.png';
assets.images.enemy.down[2].src = 'assets/images/enemy1/down/sprite_enemy down1.png';
assets.images.enemy.down[3].src = 'assets/images/enemy1/down/sprite_enemy down2.png';

assets.images.enemy.left[0].src = 'assets/images/enemy1/left/sprite_enemy left stand – koopia.png';
assets.images.enemy.left[1].src = 'assets/images/enemy1/left/sprite_enemy left0.png';
assets.images.enemy.left[2].src = 'assets/images/enemy1/left/sprite_enemy left1.png';
assets.images.enemy.left[3].src = 'assets/images/enemy1/left/sprite_enemy left2.png';

assets.images.enemy.right[0].src = 'assets/images/enemy1/right/sprite_enemy right stand.png';
assets.images.enemy.right[1].src = 'assets/images/enemy1/right/sprite_enemy right0.png';
assets.images.enemy.right[2].src = 'assets/images/enemy1/right/sprite_enemy right1.png';
assets.images.enemy.right[3].src = 'assets/images/enemy1/right/sprite_enemy right2.png';

// Mängija pildid
assets.images.player.up[0].src = 'assets/images/player/up/seis_üles.png';
assets.images.player.up[1].src = 'assets/images/player/up/liik_üles_3.png';
assets.images.player.up[2].src = 'assets/images/player/up/liik_üles_2.png';
assets.images.player.up[3].src = 'assets/images/player/up/liik_üles_1.png';

assets.images.player.down[0].src = 'assets/images/player/down/seis_alla.png';
assets.images.player.down[1].src = 'assets/images/player/down/liik_alla_3.png';
assets.images.player.down[2].src = 'assets/images/player/down/liik_alla_2.png';
assets.images.player.down[3].src = 'assets/images/player/down/liik_alla_1.png';

assets.images.player.left[0].src = 'assets/images/player/left/seis_vasak.png';
assets.images.player.left[1].src = 'assets/images/player/left/liik_vasak_3.png';
assets.images.player.left[2].src = 'assets/images/player/left/liik_vasak_2.png';
assets.images.player.left[3].src = 'assets/images/player/left/liik_vasak_1.png';

assets.images.player.right[0].src = 'assets/images/player/right/seis_parem.png';
assets.images.player.right[1].src = 'assets/images/player/right/liik_parem_3.png';
assets.images.player.right[2].src = 'assets/images/player/right/liik_parem_2.png';
assets.images.player.right[3].src = 'assets/images/player/right/liik_parem_1.png';

export function playSound(sound) {
    if (sound.src) {
        sound.currentTime = 0;
        sound.play();
    }
}