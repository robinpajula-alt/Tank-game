document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // --- TILE SIZE JA LEVELI STRUKTUUR ---
    const TILE_SIZE = 40; // Iga plokk ja tank on 40x40 pikslit
    
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
        [0,0,0,0,0,0,1,3,1,0,0,0,0,0,0] // Baas on keskel all (nr 3), ümbritsetud tellistega (nr 1)
    ];

    // --- VARADE HALDUR (Kuhu sa paned oma pildid ja helid) ---
    const assets = {
        images: {
            playerTank: new Image(),
            enemyTank: new Image(),
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
    // SIIT SAAD LISADA OMA FAILID HILJEM:
    // assets.images.playerTank.src = 'assets/images/player.png';
    // assets.sounds.shoot.src = 'assets/sounds/shoot.wav';

    // Abifunktsioon helide mängimiseks (skaleeritav)
    function playSound(sound) {
        if (sound.src) { // Mängib ainult siis, kui oled faili lisanud
            sound.currentTime = 0;
            sound.play();
        }
    }

    // --- KLASSID: PLOKID JA SEINAD ---
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
            else { ctx.fillStyle = '#8B4513'; super.draw(ctx); } // Fallback pruun värv
        }
    }

    class Steel extends Block {
        draw(ctx) {
            if (assets.images.steel.src) ctx.drawImage(assets.images.steel, this.x, this.y, this.width, this.height);
            else { ctx.fillStyle = '#aaa'; super.draw(ctx); } // Fallback hall
        }
    }

    class Base extends Block {
        draw(ctx) {
            if (assets.images.base.src) ctx.drawImage(assets.images.base, this.x, this.y, this.width, this.height);
            else { ctx.fillStyle = '#00f'; super.draw(ctx); } // Fallback sinine baas
        }
    }

    // --- KLASSID: MÄNGU OBJEKTID ---
    class Bullet {
        constructor(x, y, direction, isEnemy) {
            this.x = x; this.y = y; this.width = 6; this.height = 6;
            this.speed = 6; this.direction = direction; this.isEnemy = isEnemy;
            this.markedForDeletion = false;
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
            ctx.fillStyle = this.isEnemy ? 'orange' : 'yellow';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    class Tank {
        constructor(game, x, y) {
            this.game = game;
            this.width = TILE_SIZE - 4; // Natuke väiksem kui ruut, et saaks kergemini vahelt läbi
            this.height = TILE_SIZE - 4;
            this.x = x; this.y = y;
            this.speed = 2;
            this.direction = 'up';
            this.markedForDeletion = false;
        }
        
        // Liikumine, mis ei lase seintest läbi minna
        move(dx, dy) {
            let oldX = this.x; let oldY = this.y;
            this.x += dx; this.y += dy;

            // Kontrollime seinu ja ekraani ääri
            if (this.x < 0) this.x = 0;
            if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
            if (this.y < 0) this.y = 0;
            if (this.y + this.height > canvas.height) this.y = canvas.height - this.height;

            // Kokkupõrge plokkidega
            for (let block of this.game.blocks) {
                if (this.game.checkCollision(this, block)) {
                    this.x = oldX; this.y = oldY; // Kui on sein ees, läheme tagasi eelmisesse asendisse
                    return false; // Tagastame false, kui liikumine ebaõnnestus (AI vajab seda)
                }
            }
            return true; // Liikumine õnnestus
        }

        shoot(isEnemy) {
            let bx = this.x + this.width / 2 - 3;
            let by = this.y + this.height / 2 - 3;
            this.game.bullets.push(new Bullet(bx, by, this.direction, isEnemy));
            playSound(assets.sounds.shoot);
        }
    }

    class Player extends Tank {
        constructor(game, x, y) {
            super(game, x, y);
            this.readyToShoot = true;
        }
        update(inputKeys) {
            if (inputKeys.includes('ArrowUp')) { this.direction = 'up'; this.move(0, -this.speed); }
            else if (inputKeys.includes('ArrowDown')) { this.direction = 'down'; this.move(0, this.speed); }
            else if (inputKeys.includes('ArrowLeft')) { this.direction = 'left'; this.move(-this.speed, 0); }
            else if (inputKeys.includes('ArrowRight')) { this.direction = 'right'; this.move(this.speed, 0); }

            if (inputKeys.includes(' ') && this.readyToShoot) {
                this.shoot(false);
                this.readyToShoot = false;
                setTimeout(() => { this.readyToShoot = true; }, 500);
            }
        }
        draw(ctx) {
            if (assets.images.playerTank.src) ctx.drawImage(assets.images.playerTank, this.x, this.y, this.width, this.height);
            else {
                ctx.fillStyle = '#0f0'; ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.fillStyle = 'darkgreen'; // Toru
                if (this.direction === 'up') ctx.fillRect(this.x + 15, this.y - 10, 6, 15);
                else if (this.direction === 'down') ctx.fillRect(this.x + 15, this.y + this.height - 5, 6, 15);
                else if (this.direction === 'left') ctx.fillRect(this.x - 10, this.y + 15, 15, 6);
                else if (this.direction === 'right') ctx.fillRect(this.x + this.width - 5, this.y + 15, 15, 6);
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
            // Tehisintellekt (AI): Proovib minna alla, aga muudab suunda, kui jääb kinni
            let moved = false;
            if (this.direction === 'up') moved = this.move(0, -this.speed);
            else if (this.direction === 'down') moved = this.move(0, this.speed);
            else if (this.direction === 'left') moved = this.move(-this.speed, 0);
            else if (this.direction === 'right') moved = this.move(this.speed, 0);

            this.moveTimer += deltaTime;
            
            // Kui bot jäi seina taha kinni või on aeg suunda muuta (iga 2 sek tagant suvaliselt)
            if (!moved || this.moveTimer > 2000) {
                this.chooseNewDirection();
                this.moveTimer = 0;
            }

            // Tulistamise loogika
            this.shootTimer += deltaTime;
            if (this.shootTimer > 1500 + Math.random() * 2000) { // Suvaline tulistamisintervall
                this.shoot(true);
                this.shootTimer = 0;
            }
        }
        
        chooseNewDirection() {
            // Eelistame allapoole (baasi poole) liikumist
            const r = Math.random();
            if (r < 0.5) this.direction = 'down'; // 50% ajast proovib minna alla
            else if (r < 0.75) this.direction = 'left';
            else if (r < 0.9) this.direction = 'right';
            else this.direction = 'up';
        }

        draw(ctx) {
            if (assets.images.enemyTank.src) ctx.drawImage(assets.images.enemyTank, this.x, this.y, this.width, this.height);
            else { ctx.fillStyle = 'red'; ctx.fillRect(this.x, this.y, this.width, this.height); } // Fallback
        }
    }

    // --- MÄNGU PEAKLASS ---
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
                {x: (canvas.width / 2) - (TILE_SIZE / 2), y: 0}, // Keskel üleval
                {x: canvas.width - TILE_SIZE, y: 0}
            ];
            this.enemyTimer = 0;
            this.enemyInterval = 6500; // Vaenlased tekivad iga ~6.5 sekundi tagant

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
            this.blocks = [];asfg
            for (let row = 0; row < level1.length; row++) {
                for (let col = 0; col < level1[row].length; col++) {
                    let type = level1[row][col];
                    let x = col * TILE_SIZE;
                    let y = row * TILE_SIZE;f
                    
                    if (type === 1) this.blocks.push(new Brick(x, y, TILE_SIZE, TILE_SIZE));
                    else if (type === 2) this.blocks.push(new Steel(x, y, TILE_SIZE, TILE_SIZE));
                    else if (type === 3) this.blocks.push(new Base(x, y, TILE_SIZE, TILE_SIZE));
                }
            }
            // Mängija tekib baasi kõrvale
            this.player = new Player(this, canvas.width / 2 - TILE_SIZE - 60, canvas.height - TILE_SIZE);
        }

        update(deltaTime) {
            if (this.gameOver) return;

            this.player.update(this.keys);

            // Kuulide loogika ja kokkupõrked
            this.bullets.forEach(bullet => {
                bullet.update();
                
                // 1. Kuulid vs Plokid (Seinad ja Baas)
                for (let block of this.blocks) {
                    if (this.checkCollision(bullet, block)) {
                        bullet.markedForDeletion = true;
                        if (block instanceof Brick) {
                            block.markedForDeletion = true; // Tellis puruneb
                        } else if (block instanceof Base) {
                            block.markedForDeletion = true;
                            this.endGame(false); // Baas hävis! Mäng läbi
                            playSound(assets.sounds.baseDestroyed);
                        }
                    }
                }

                // 2. Kuulid vs Tankid
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

            // Eemaldame katkised plokid ja kuulid
            this.blocks = this.blocks.filter(block => !block.markedForDeletion);
            this.bullets = this.bullets.filter(bullet => !bullet.markedForDeletion);
            this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);

            // Vaenlaste spawnimine (3 spawn pointi üleval)
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
        game = new Game(); // Genereerime täiesti uue mängu
        lastTime = performance.now();
        animate(0);
    });
});