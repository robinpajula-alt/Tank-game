document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // --- TILE SIZE JA LEVELI STRUKTUUR ---
    const TILE_SIZE = 32; // Muutsime 32 pikslile
    
    // Dünaamiline canvase suurus
    canvas.width = 15 * TILE_SIZE;  // 480
    canvas.height = 15 * TILE_SIZE; // 480
    
    // Leveli koodid: 0 = tühi, 1 = telliskivi (lõhutav), 2 = teras (lõhkumatu), 3 = baas, 4 = spawn blokkija (et sinna ei ehitaks)
    const level1 = [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,1,1,0,2,2,0,0,0,2,2,0,1,1,0],
        [0,1,1,0,2,2,0,0,0,2,2,0,1,1,0],
        [0,1,1,0,1,1,0,2,0,1,1,0,1,1,0],
        [0,1,1,0,1,1,0,2,0,1,1,0,1,1,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,1,1,0,2,2,0,1,0,2,2,0,1,1,0],
        [0,1,1,0,2,2,0,1,0,2,2,0,1,1,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [2,2,0,1,1,1,1,0,1,1,1,1,0,2,2],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,1,1,0,1,1,0,0,0,1,1,0,1,1,0],
        [0,1,1,0,1,1,0,1,0,1,1,0,1,1,0],
        [0,1,1,0,1,1,1,1,1,1,1,0,1,1,0],
        [0,0,0,0,0,0,1,3,1,0,0,0,0,0,0] 
    ];

    // --- VARADE HALDUR (Kuhu sa paned oma pildid ja helid) ---
    // --- VARADE HALDUR ---
    const assets = {
        images: {
            player: {
                // Igal suunal on nüüd 4 pilti: [seis, liik1, liik2, liik3]
                up: [new Image(), new Image(), new Image(), new Image()],    
                down: [new Image(), new Image(), new Image(), new Image()],
                left: [new Image(), new Image(), new Image(), new Image()],
                right: [new Image(), new Image(), new Image(), new Image()]
            },
            enemy: {
                up: [new Image(), new Image()],
                down: [new Image(), new Image()],
                left: [new Image(), new Image()],
                right: [new Image(), new Image()]
            },
            brick: new Image(),
            steel: new Image(),
            base: new Image()
        },
        sounds: {
            shoot: new Audio(),
            explosion: new Audio(),
            baseDestroyed: new Audio()
        }
    };

    assets.images.player.up[0].src = 'assets/images/player/up/seis_üles.png';
    assets.images.player.up[1].src = 'assets/images/player/up/liik_üles_3.png'; // 3
    assets.images.player.up[2].src = 'assets/images/player/up/liik_üles_2.png'; // 2
    assets.images.player.up[3].src = 'assets/images/player/up/liik_üles_1.png'; // 1

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
    assets.images.brick.src = 'assets/images/brick.png';

    function playSound(sound) {
        if (sound.src) { 
            sound.currentTime = 0;
            sound.play();
        }
    }

    class Block {
        constructor(x, y, width, height) {
            this.x = x; this.y = y; this.width = width; this.height = height;
            this.markedForDeletion = false;
        }
        draw(ctx) { ctx.fillRect(this.x, this.y, this.width, this.height); }
    }

    class Brick extends Block {
        draw(ctx) {
            if (assets.images.brick.src) ctx.drawImage(assets.images.brick, this.x, this.y, this.width, this.height);
            else { ctx.fillStyle = '#8B4513'; super.draw(ctx); }
        }
    }

    class Steel extends Block {
        draw(ctx) {
            if (assets.images.steel.src) ctx.drawImage(assets.images.steel, this.x, this.y, this.width, this.height);
            else { ctx.fillStyle = '#aaa'; super.draw(ctx); }
        }
    }

    class Base extends Block {
        draw(ctx) {
            if (assets.images.base.src) ctx.drawImage(assets.images.base, this.x, this.y, this.width, this.height);
            else { ctx.fillStyle = '#00f'; super.draw(ctx); }
        }
    }

    class Bullet {
        constructor(x, y, direction, isEnemy) {
            this.direction = direction; 
            this.isEnemy = isEnemy;
            this.speed = 8; // Tegin kuuli veidi kiiremaks
            this.markedForDeletion = false;
            
            // Teeme kuuli piklikuks vastavalt suunale
            this.width = (direction === 'up' || direction === 'down') ? 4 : 12;
            this.height = (direction === 'up' || direction === 'down') ? 12 : 4;
            
            // Tsentreerime kuuli täpselt tanki toru otsa
            this.x = x - this.width / 2; 
            this.y = y - this.height / 2; 
        }
        update() {
            if (this.direction === 'up') this.y -= this.speed;
            else if (this.direction === 'down') this.y += this.speed;
            else if (this.direction === 'left') this.x -= this.speed;
            else if (this.direction === 'right') this.x += this.speed;

            if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                this.markedForDeletion = true;
            }
        }
        draw(ctx) {
            // Sinu kuulid on kollased, vaenlase omad oranžikad punased
            ctx.fillStyle = this.isEnemy ? '#ff4500' : '#ffff00';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    class Tank {
        constructor(game, x, y) {
            this.game = game;
            this.width = TILE_SIZE - 4;
            this.height = TILE_SIZE - 4;
            this.x = x; this.y = y;
            this.speed = 2;
            this.direction = 'up';
            
            this.isMoving = false; 
            this.frameX = 0;       
            this.animationTimer = 0; 
        }
        
        move(dx, dy) {
            let oldX = this.x; let oldY = this.y;
            this.x += dx; this.y += dy;

            if (this.x < 0) this.x = 0;
            if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
            if (this.y < 0) this.y = 0;
            if (this.y + this.height > canvas.height) this.y = canvas.height - this.height;

            for (let block of this.game.blocks) {
                if (this.game.checkCollision(this, block)) {
                    this.x = oldX; this.y = oldY; 
                    return false; 
                }
            }
            return true; 
        }

        shoot(isEnemy) {
            let bx = this.x + this.width / 2;
            let by = this.y + this.height / 2;
            this.game.bullets.push(new Bullet(bx, by, this.direction, isEnemy));
            playSound(assets.sounds.shoot);
        }

        updateAnimation(deltaTime) {
            if (this.isMoving) {
                this.animationTimer += deltaTime;
                if (this.animationTimer > 100) { // 100ms teeb animatsiooni veidi kiiremaks
                    this.frameX++;
                    
                    // Kui pilt on player (4 pilti), keri kaadreid 1, 2, 3
                    if (this instanceof Player) {
                        if (this.frameX > 3) this.frameX = 1;
                    } else {
                        // Vaenlaste puhul (2 pilti) keri kaadreid 0 ja 1
                        if (this.frameX > 1) this.frameX = 0;
                    }
                    this.animationTimer = 0;
                }
            } else {
                this.frameX = 0; // Kui seisab, kasuta alati "seis" pilti
            }
        }
    }

    class Player extends Tank {
        constructor(game, x, y) {
            super(game, x, y);
            this.readyToShoot = true;
        }
        update(inputKeys, deltaTime) {
            this.isMoving = false; // Eeldame alguses, et ei liigu

            if (inputKeys.includes('ArrowUp')) { this.direction = 'up'; this.move(0, -this.speed); this.isMoving = true; }
            else if (inputKeys.includes('ArrowDown')) { this.direction = 'down'; this.move(0, this.speed); this.isMoving = true; }
            else if (inputKeys.includes('ArrowLeft')) { this.direction = 'left'; this.move(-this.speed, 0); this.isMoving = true; }
            else if (inputKeys.includes('ArrowRight')) { this.direction = 'right'; this.move(this.speed, 0); this.isMoving = true; }

            if (inputKeys.includes(' ') && this.readyToShoot) {
                this.shoot(false);
                this.readyToShoot = false;
                setTimeout(() => { this.readyToShoot = true; }, 500);
            }

            this.updateAnimation(deltaTime);
        }
        // Player klassi draw funktsioon:
        draw(ctx) {
            let img = assets.images.player[this.direction][this.frameX];
            
            // img.complete tagab, et pilt on päriselt brauseris laetud
            if (img && img.complete && img.naturalWidth > 0) { 
                ctx.drawImage(img, this.x, this.y, this.width, this.height);
            } else {
                // Fallback, kui pilti pole veel
                ctx.fillStyle = '#0f0'; ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.fillStyle = 'darkgreen'; 
                if (this.direction === 'up') ctx.fillRect(this.x + 10, this.y - 10, 6, 15);
                else if (this.direction === 'down') ctx.fillRect(this.x + 10, this.y + this.height - 5, 6, 15);
                else if (this.direction === 'left') ctx.fillRect(this.x - 10, this.y + 10, 15, 6);
                else if (this.direction === 'right') ctx.fillRect(this.x + this.width - 5, this.y + 10, 15, 6);
            }
        }
    }

    class EnemyBot extends Tank {
        constructor(game, x, y) {
            super(game, x, y);
            this.speed = 1.5;
            this.direction = 'down';
            this.moveTimer = 0;
            this.shootTimer = 0;
        }
        update(deltaTime) {
            let moved = false;
            if (this.direction === 'up') moved = this.move(0, -this.speed);
            else if (this.direction === 'down') moved = this.move(0, this.speed);
            else if (this.direction === 'left') moved = this.move(-this.speed, 0);
            else if (this.direction === 'right') moved = this.move(this.speed, 0);

            // Kui bot liikus, on ta animatsioon aktiivne
            this.isMoving = moved;

            this.moveTimer += deltaTime;
            
            if (!moved || this.moveTimer > 2000) {
                this.chooseNewDirection();
                this.moveTimer = 0;
            }

            this.shootTimer += deltaTime;
            if (this.shootTimer > 1500 + Math.random() * 2000) { 
                this.shoot(true);
                this.shootTimer = 0;
            }

            this.updateAnimation(deltaTime);
        }
        
        chooseNewDirection() {
            const r = Math.random();
            if (r < 0.5) this.direction = 'down'; 
            else if (r < 0.75) this.direction = 'left';
            else if (r < 0.9) this.direction = 'right';
            else this.direction = 'up';
        }

        // EnemyBot klassi draw funktsioon:
        draw(ctx) {
            let img = assets.images.enemy[this.direction][this.frameX];
            if (img && img.complete && img.naturalWidth > 0) { 
                ctx.drawImage(img, this.x, this.y, this.width, this.height);
            } else { 
                // Fallback punane kast
                ctx.fillStyle = 'red'; ctx.fillRect(this.x, this.y, this.width, this.height); 
            } 
        }
    }

    class Game {
        constructor() {
            this.blocks = [];
            this.bullets = [];
            this.enemies = [];
            this.player = null;
            this.keys = [];
            this.score = 0;
            this.lives = 3;
            this.gameOver = false;
            
            this.spawnPoints = [
                {x: 0, y: 0}, 
                {x: (canvas.width / 2) - (TILE_SIZE / 2), y: 0}, 
                {x: canvas.width - TILE_SIZE, y: 0}
            ];
            this.enemyTimer = 0;
            this.enemyInterval = 6500; 

            this.setupInputs();
            this.loadLevel();
        }

        setupInputs() {
            window.addEventListener('keydown', e => { if (this.keys.indexOf(e.key) === -1) this.keys.push(e.key); });
            window.addEventListener('keyup', e => {
                const index = this.keys.indexOf(e.key);
                if (index > -1) this.keys.splice(index, 1);
            });
        }

        loadLevel() {
            this.blocks = [];
            let HALF_TILE = TILE_SIZE / 2; // See on 16 pikslit

            for (let row = 0; row < level1.length; row++) {
                for (let col = 0; col < level1[row].length; col++) {
                    let type = level1[row][col];
                    let x = col * TILE_SIZE;
                    let y = row * TILE_SIZE;
                    
                    if (type === 1) {
                        // Loome ühe suure asemel 4 väikest 16x16 telliskivi
                        this.blocks.push(new Brick(x, y, HALF_TILE, HALF_TILE));
                        this.blocks.push(new Brick(x + HALF_TILE, y, HALF_TILE, HALF_TILE));
                        this.blocks.push(new Brick(x, y + HALF_TILE, HALF_TILE, HALF_TILE));
                        this.blocks.push(new Brick(x + HALF_TILE, y + HALF_TILE, HALF_TILE, HALF_TILE));
                    } 
                    else if (type === 2) {
                        // Loome 4 väikest terasplokki
                        this.blocks.push(new Steel(x, y, HALF_TILE, HALF_TILE));
                        this.blocks.push(new Steel(x + HALF_TILE, y, HALF_TILE, HALF_TILE));
                        this.blocks.push(new Steel(x, y + HALF_TILE, HALF_TILE, HALF_TILE));
                        this.blocks.push(new Steel(x + HALF_TILE, y + HALF_TILE, HALF_TILE, HALF_TILE));
                    } 
                    else if (type === 3) {
                        // Baas jääb terveks 32x32 plokiks
                        this.blocks.push(new Base(x, y, TILE_SIZE, TILE_SIZE));
                    }
                }
            }
            // Mängija spawnib täpselt 4ndas tulbas (baasist vasakul)
            this.player = new Player(this, 4 * TILE_SIZE + 2, canvas.height - TILE_SIZE + 2);
        }

        update(deltaTime) {
            if (this.gameOver) return;

            // Anname playerile ka deltaTime edasi, et animatsioon töötaks
            this.player.update(this.keys, deltaTime);

            this.bullets.forEach(bullet => {
                bullet.update();
                
                for (let block of this.blocks) {
                    if (this.checkCollision(bullet, block)) {
                        bullet.markedForDeletion = true;
                        if (block instanceof Brick) {
                            block.markedForDeletion = true; 
                        } else if (block instanceof Base) {
                            block.markedForDeletion = true;
                            this.endGame(false); 
                            playSound(assets.sounds.baseDestroyed);
                        }
                    }
                }

                if (bullet.isEnemy) {
                    if (this.checkCollision(bullet, this.player)) {
                        bullet.markedForDeletion = true;
                        this.lives--;
                        playSound(assets.sounds.explosion);
                        if (this.lives <= 0) this.endGame(false);
                    }
                } else {
                    this.enemies.forEach(enemy => {
                        if (this.checkCollision(bullet, enemy)) {
                            bullet.markedForDeletion = true;
                            enemy.markedForDeletion = true;
                            this.score += 100;
                            playSound(assets.sounds.explosion);
                        }
                    });
                }
            });

            this.blocks = this.blocks.filter(block => !block.markedForDeletion);
            this.bullets = this.bullets.filter(bullet => !bullet.markedForDeletion);
            this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);

            if (this.enemyTimer > this.enemyInterval) {
                let spawnPt = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
                this.enemies.push(new EnemyBot(this, spawnPt.x, spawnPt.y));
                this.enemyTimer = 0;
            } else {
                this.enemyTimer += deltaTime;
            }

            this.enemies.forEach(enemy => enemy.update(deltaTime));

            document.getElementById('score').innerText = this.score;
            document.getElementById('lives').innerText = this.lives;
        }

        draw(ctx) {
            this.blocks.forEach(block => block.draw(ctx));
            this.player.draw(ctx);
            this.enemies.forEach(enemy => enemy.draw(ctx));
            this.bullets.forEach(bullet => bullet.draw(ctx));
        }

        checkCollision(rect1, rect2) {
            return (rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x &&
                    rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y);
        }

        endGame(win) {
            this.gameOver = true;
            document.getElementById('gameOverScreen').classList.remove('hidden');
            document.getElementById('gameOverText').innerText = win ? "VÕITSID!" : "MÄNG LÄBI";
            document.getElementById('finalScore').innerText = this.score;
        }
    }

    let game = new Game();
    let lastTime = 0;

    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        game.update(deltaTime);
        game.draw(ctx);
        if (!game.gameOver) requestAnimationFrame(animate);
    }
    animate(0);

    document.getElementById('restartBtn').addEventListener('click', () => {
        document.getElementById('gameOverScreen').classList.add('hidden');
        game = new Game(); 
        lastTime = performance.now();
        animate(0);
    });
});