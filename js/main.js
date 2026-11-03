import { Game } from './game.js';
import { HUD } from './core/hud.js';
import { InputHandler } from './core/input.js';
import { loadAssets } from './assets.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, DEBUG } from './config.js';

async function start() {
    const canvas = document.getElementById('gameCanvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    await loadAssets();

    const game = new Game(new HUD(), new InputHandler());
    if (DEBUG) window.game = game;

    let lastTime = null;
    function frame(timeStamp) {
        if (lastTime === null) lastTime = timeStamp;
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;

        game.update(deltaTime);
        game.draw(ctx);
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

start();
