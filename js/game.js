import { STEP_MS, MAX_FRAME_MS, PLAYER_START_LIVES, POWERUP_DROP_CHANCE, MUSIC, MUSIC_FOLDER, MUSIC_VOLUME, levels } from './config.js';
import { MusicPlayer } from './core/music.js';
import { simulateBullets } from './core/combat.js';
import { DemoWorld } from './core/demo.js';
import { GameState } from './core/gamestate.js';
import { intersects } from './core/collision.js';
import { SaveManager } from './core/save.js';
import { Screens } from './core/screens.js';
import { Level } from './world/level.js';
import { Spawner } from './world/spawner.js';
import { Player } from './tanks/player.js';
import { PowerUp, randomPowerUpType } from './powerup.js';
import { playSound } from './assets.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, DEBUG } from './config.js';
import { DebugTools } from './core/debug.js';

export class Game {
    constructor(hud, input) {
        this.hud = hud;
        this.input = input;
        this.screens = new Screens({
            onStart: () => this.startAdventure(),
            onContinue: () => this.continueAdventure(),
            onOpenLevelSelect: () => this.screens.showLevelSelect(levels.map(l => l.name)),
            onPickLevel: index => this.openLevel(index),
            onResume: () => this.setPaused(false),
            onRetry: () => this.beginLevel(this.levelIndex),
            onMenu: () => this.showMainMenu()
        });

        this.debug = DEBUG ? new DebugTools(this) : null;
        this.music = new MusicPlayer(MUSIC, MUSIC_FOLDER, MUSIC_VOLUME);
        this.demo = new DemoWorld();     // menüü ja lugukaartide taustamäng

        this.state = GameState.MENU;
        this.level = null;
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.powerUps = [];
        this.spawner = null;
        this.levelIndex = 0;
        this.lives = PLAYER_START_LIVES;
        this.freezeTimer = 0;
        this.accumulator = 0;

        this.showMainMenu();
    }

    // ===== Mängu käik: menüü -> lugu -> tase -> lugu -> ... =====
    showMainMenu() {
        this.music.play('menu');
        this.state = GameState.MENU;
        this.level = null;
        this.hud.hideGameUi();
        const save = SaveManager.load();
        const canContinue = !!(save && save.inProgress);
        this.screens.showMainMenu({
            canContinue,
            continueLabel: canContinue ? `Jätka (tase ${save.levelIndex + 1})` : 'Jätka',
            completed: !!(save && save.completed)
        });
    }

    startAdventure() {
        const save = SaveManager.load();
        if (save && save.inProgress &&
            !window.confirm('Alustad uue seikluse? Praegune edenemine kirjutatakse üle.')) return;
        SaveManager.write({ levelIndex: 0, inProgress: true, completed: !!(save && save.completed) });
        this.openLevel(0);
    }

    continueAdventure() {
        const save = SaveManager.load();
        this.openLevel(save ? save.levelIndex : 0);
    }

    /** Näita taseme sissejuhatust, siis alusta. */
    openLevel(index) {
        this.levelIndex = index;
        this.state = GameState.STORY;
        this.level = null;
        this.hud.hideGameUi();
        this.screens.showStory(
            { title: `${index + 1}. ${levels[index].name}`, text: levels[index].intro, button: 'Alusta' },
            () => this.beginLevel(index)
        );
    }

    beginLevel(index) {
        const definition = levels[index];
        if (!definition) throw new Error(`Taset ${index} ei leitud config.js-ist`);

        this.levelIndex = index;
        this.music.play(definition.biome);
        this.lives = PLAYER_START_LIVES;
        this.player = new Player(this);
        this.level = new Level(definition, this);
        this.spawner = new Spawner(this, definition);
        this.enemies = [];
        this.bullets = [];
        this.powerUps = [];
        this.freezeTimer = 0;
        this.accumulator = 0;
        this.player.respawn();

        this.state = GameState.PLAYING;
        this.screens.hideAll();
        this.hud.showGameUi();
        this.syncHud();
    }

    onLevelComplete() {
        const finished = this.levelIndex + 1 >= levels.length;
        const previous = SaveManager.load();
        SaveManager.write({
            levelIndex: finished ? 0 : this.levelIndex + 1,
            inProgress: !finished,
            completed: finished || !!(previous && previous.completed)
        });

        const definition = levels[this.levelIndex];
        this.state = GameState.STORY;
        this.hud.hideGameUi();
        if (finished) {
            this.screens.showStory({ title: 'Seiklus lõppes', text: definition.outro, button: 'Peamenüü' },
                () => this.showMainMenu());
        } else {
            this.screens.showStory({ title: 'Tase läbitud', text: definition.outro, button: 'Edasi' },
                () => this.openLevel(this.levelIndex + 1));
        }
    }

    setPaused(paused) {
        if (paused) this.music.pause();
        else this.music.resume();
        this.state = paused ? GameState.PAUSED : GameState.PLAYING;
        this.screens.showPause(paused);
    }

    // ===== Päringud =====
    get tanks() {
        if (!this.player) return [];
        return [this.player, ...this.enemies].filter(t => !t.markedForDeletion);
    }

    get enemiesRemaining() {
        return this.spawner.queue.length + this.enemies.length;
    }

    // ===== Tsükkel =====
    update(deltaTime) {
        if (this.debug) this.debug.update();
        if (this.input.consumePress('KeyM')) this.music.toggleMute();   // M = muusika sisse/välja
        const pausePressed = this.input.consumePress('KeyP') | this.input.consumePress('Escape');
        if (pausePressed && (this.state === GameState.PLAYING || this.state === GameState.PAUSED)) {
            this.setPaused(this.state === GameState.PLAYING);
        }
        if (this.state !== GameState.PLAYING) {
            if (!this.level) this.demo.update(deltaTime);   // menüü / lugu: taustamäng käib
            return;
        }

        // Fikseeritud ajasammud: sama kiirus igal ekraanil, kuulid ei "tunneldä" läbi seina.
        this.accumulator += Math.min(deltaTime, MAX_FRAME_MS);
        while (this.accumulator >= STEP_MS) {
            this.step(STEP_MS);
            this.accumulator -= STEP_MS;
            if (this.state !== GameState.PLAYING) { this.accumulator = 0; break; }
        }
    }

    step(dt) {
        this.player.update(dt);
        if (this.freezeTimer > 0) this.freezeTimer -= dt;
        else this.enemies.forEach(enemy => enemy.update(dt));

        this.spawner.update(dt);
        this.level.update(dt);
        simulateBullets(this, dt);
        this.updatePowerUps(dt);
        this.cleanup();
        this.checkLevelComplete();
        if (this.state === GameState.PLAYING) this.syncHud();
    }

    updatePowerUps(dt) {
        for (const powerUp of this.powerUps) {
            powerUp.update(dt);
            if (!powerUp.markedForDeletion && intersects(this.player, powerUp)) powerUp.apply(this);
        }
    }

    cleanup() {
        this.enemies = this.enemies.filter(e => !e.markedForDeletion);
        this.bullets = this.bullets.filter(b => !b.markedForDeletion);
        this.powerUps = this.powerUps.filter(p => !p.markedForDeletion);
        this.level.removeDestroyed();
    }

    checkLevelComplete() {
        if (this.spawner.isFinished && this.enemies.length === 0) this.onLevelComplete();
    }

    // ===== Sündmused (kutsutakse teistest klassidest) =====
    onEnemyKilled(enemy) {
        if (enemy.isBoss) {
            // Boss langes: ülejäänud bandiidid hajuvad.
            this.spawner.clear();
            this.enemies.forEach(e => { e.markedForDeletion = true; });
            return;
        }
        if (Math.random() < POWERUP_DROP_CHANCE) {
            const cx = enemy.x + enemy.width / 2;
            const cy = enemy.y + enemy.height / 2;
            this.powerUps.push(new PowerUp(
                Math.min(Math.max(cx, 16), CANVAS_WIDTH - 16),
                Math.min(Math.max(cy, 16), CANVAS_HEIGHT - 16),
                randomPowerUpType()
            ));
        }
    }

    onPlayerKilled() {
        this.lives--;
        if (this.lives <= 0) this.gameOver();
        else this.player.respawn();
    }

    onBaseDestroyed() {
        playSound('baseDestroyed');
        this.gameOver();
    }

    gameOver() {
        if (this.state !== GameState.PLAYING) return;
        this.state = GameState.GAME_OVER;
        this.syncHud();
        this.screens.showGameOver();
    }

    // ===== HUD =====
    syncHud() {
        const boss = this.enemies.find(e => e.isBoss);
        this.hud.update({
            levelName: `${this.levelIndex + 1}. ${levels[this.levelIndex].name}`,
            lives: this.lives,
            enemies: this.enemiesRemaining,
            effects: this.effectsText(),
            bossRatio: boss ? boss.health / boss.maxHealth : null
        });
    }

    effectsText() {
        const seconds = ms => Math.ceil(ms / 1000);
        const parts = [];
        if (this.player.speedBoostTimer > 0) parts.push(`Kiirus ${seconds(this.player.speedBoostTimer)}s`);
        if (this.debug && this.debug.god) parts.push('SUREMATU');
        else if (this.player.invulnerableTimer > 0) parts.push(`Kilp ${seconds(this.player.invulnerableTimer)}s`);
        if (this.level.fortifyTimer > 0) parts.push(`Kindlus ${seconds(this.level.fortifyTimer)}s`);
        if (this.freezeTimer > 0) parts.push(`Külm ${seconds(this.freezeTimer)}s`);
        return parts.join(' · ');
    }

    // ===== Joonistamine =====
    draw(ctx) {
        // Menüüs ja lugukaartidel näitame uduse taustana demomängu (CSS klass "blurred").
        ctx.canvas.classList.toggle('blurred', !this.level);
        if (!this.level) {
            this.demo.draw(ctx);
            return;
        }
        this.level.drawGround(ctx);
        this.level.drawBlocks(ctx);
        this.powerUps.forEach(powerUp => powerUp.draw(ctx));
        this.player.draw(ctx);
        this.enemies.forEach(enemy => enemy.draw(ctx));
        this.bullets.forEach(bullet => bullet.draw(ctx));
    }
}
