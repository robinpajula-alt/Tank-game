import { TILE_SIZE, HALF_TILE, levels, level1 } from './config.js';
import { assets, playSound } from './assets.js';
import { Brick, Steel, Base, Ground, SandWall, SandWallBroken } from './block.js';
import { Player } from './player.js';
import { EnemyBot } from './enemybot.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.grounds = [];
        this.blocks = [];
        this.bullets = [];
        this.enemies = [];
        this.player = null;
        this.keys = [];
        this.score = 0;
        this.lives = 3;
        this.currentLevel = 0;
        this.gameOver = false;
        
        this.spawnPoints = [
            {x: 0, y: 0}, 
            {x: (this.canvas.width / 2) - (TILE_SIZE / 2), y: 0}, 
            {x: this.canvas.width - TILE_SIZE, y: 0}
        ];
        this.enemyTimer = 0;
        this.enemyInterval = 6500; 

        this.setupInputs();
        this.loadLevel(this.currentLevel);
    }

    setupInputs() {
        window.addEventListener('keydown', e => { if (this.keys.indexOf(e.key) === -1) this.keys.push(e.key); });
        window.addEventListener('keyup', e => {
            const index = this.keys.indexOf(e.key);
            if (index > -1) this.keys.splice(index, 1);
        });
    }

    loadLevel(levelIndex) {
        this.blocks = [];
        this.grounds = [];

        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 15; col++) {
                this.grounds.push(new Ground(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE));
            }
        }

        let currentLevelMap = levels[levelIndex] || level1;

        for (let row = 0; row < currentLevelMap.length; row++) {
            for (let col = 0; col < currentLevelMap[row].length; col++) {
                let type = currentLevelMap[row][col];
                let x = col * TILE_SIZE;
                let y = row * TILE_SIZE;
                
                if (type === 1) {
                    this.blocks.push(new Brick(x, y, HALF_TILE, HALF_TILE));
                    this.blocks.push(new Brick(x + HALF_TILE, y, HALF_TILE, HALF_TILE));
                    this.blocks.push(new Brick(x, y + HALF_TILE, HALF_TILE, HALF_TILE));
                    this.blocks.push(new Brick(x + HALF_TILE, y + HALF_TILE, HALF_TILE, HALF_TILE));
                } 
                else if (type === 2) {
                    this.blocks.push(new Steel(x, y, HALF_TILE, HALF_TILE));
                    this.blocks.push(new Steel(x + HALF_TILE, y, HALF_TILE, HALF_TILE));
                    this.blocks.push(new Steel(x, y + HALF_TILE, HALF_TILE, HALF_TILE));
                    this.blocks.push(new Steel(x + HALF_TILE, y + HALF_TILE, HALF_TILE, HALF_TILE));
                } 
                else if (type === 3) {
                    this.blocks.push(new Base(x, y, TILE_SIZE, TILE_SIZE));
                }
                else if (type === 4) {
                    this.blocks.push(new SandWall(x, y, HALF_TILE, HALF_TILE));
                    this.blocks.push(new SandWall(x + HALF_TILE, y, HALF_TILE, HALF_TILE));
                    this.blocks.push(new SandWall(x, y + HALF_TILE, HALF_TILE, HALF_TILE));
                    this.blocks.push(new SandWall(x + HALF_TILE, y + HALF_TILE, HALF_TILE, HALF_TILE));
                } 
                else if (type === 5) {
                    this.blocks.push(new SandWallBroken(x, y, HALF_TILE, HALF_TILE));
                    this.blocks.push(new SandWallBroken(x + HALF_TILE, y, HALF_TILE, HALF_TILE));
                    this.blocks.push(new SandWallBroken(x, y + HALF_TILE, HALF_TILE, HALF_TILE));
                    this.blocks.push(new SandWallBroken(x + HALF_TILE, y + HALF_TILE, HALF_TILE, HALF_TILE));
                }
            }
        }
        
        this.player = new Player(this, 4 * TILE_SIZE + 2, this.canvas.height - TILE_SIZE + 2);
    }

    update(deltaTime) {
        if (this.gameOver) return;

        this.player.update(this.keys, deltaTime);

        this.bullets.forEach(bullet => {
            bullet.update();
            let hitBlock = false;

            for (let block of this.blocks) {
                if (this.checkCollision(bullet, block)) {
                    hitBlock = true;
                    if (block instanceof Brick || block instanceof SandWall || block instanceof SandWallBroken) {
                        block.markedForDeletion = true;
                    } else if (block instanceof Base) {
                        block.markedForDeletion = true;
                        this.endGame(false);
                        playSound(assets.sounds.baseDestroyed);
                    }
                }
            }

            if (hitBlock) bullet.markedForDeletion = true;

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
        this.grounds.forEach(ground => ground.draw(ctx));
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