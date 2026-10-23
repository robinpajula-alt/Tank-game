import { Game } from './game.js';
import { TILE_SIZE } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Määrame resolutsiooni
    canvas.width = 15 * TILE_SIZE;  // 480
    canvas.height = 15 * TILE_SIZE; // 480

    let game = new Game(canvas);
    let lastTime = 0;

    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        game.update(deltaTime);
        game.draw(ctx);
        
        if (!game.gameOver) {
            requestAnimationFrame(animate);
        }
    }
    
    animate(0);

    document.getElementById('restartBtn').addEventListener('click', () => {
        document.getElementById('gameOverScreen').classList.add('hidden');
        game = new Game(canvas); 
        lastTime = performance.now();
        animate(0);
    });
});