import { SCORE_DEATH_PENALTY, SCORE_LEVEL_BONUS, BIOMES, STEP_MS, MAX_FRAME_MS, PLAYER_START_LIVES, MAX_LIVES, LEVEL_CLEAR_BONUS_LIVES, CHECKPOINT_AFTER_LEVEL, POWERUP_DROP_CHANCE, POWERUP_SPAWN_MS, POWERUP_MAX_ON_MAP, MUSIC, MUSIC_FOLDER, MUSIC_VOLUME, levels } from './config.js';
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
import { CANVAS_WIDTH, CANVAS_HEIGHT, DEBUG, FEATURES, TANK_SIZE } from './config.js';
import { DebugTools } from './core/debug.js';
import { Effects } from './core/effects.js';
import { FinaleCutscene } from './core/cutscene.js';
import { RockfallHazard } from './world/hazards.js';
import { UPGRADES, rollUpgradeChoices } from './upgrades.js';
import { createEnemy } from './tanks/enemytypes.js';
import { Settings } from './core/settings.js';
import { setSfxVolume } from './assets.js';

export class Game {
    constructor(hud, input) {
        this.hud = hud;
        this.input = input;
        this.screens = new Screens({
            onStart: () => this.startAdventure(),
            onContinue: () => this.continueAdventure(),
            onOpenLevelSelect: () => this.screens.showLevelSelect(levels.map(l => l.name)),
            onPickLevel: index => { this.resetRun(index); this.openLevel(index); },
            onResume: () => this.setPaused(false),
            onRetry: () => this.retryFromCheckpoint(),
            onMenu: () => this.showMainMenu(),
            onOpenSettings: from => this.openSettings(from)
        });

        this.debug = DEBUG ? new DebugTools(this) : null;
        this.music = new MusicPlayer(MUSIC, MUSIC_FOLDER, MUSIC_VOLUME);
        Settings.load();
        this.music.setVolume(Settings.music);
        setSfxVolume(Settings.sfx);
        this.demo = new DemoWorld();
        this.effects = new Effects();

        this.state = GameState.MENU;
        this.level = null;
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.powerUps = [];
        this.spawner = null;
        this.levelIndex = 0;
        this.lives = PLAYER_START_LIVES;
        this.upgrades = [];
        this.checkpoint = { levelIndex: 0, lives: PLAYER_START_LIVES, upgrades: [], score: 0 };
        this.score = 0;
        this.freezeTimer = 0;
        this.accumulator = 0;

        this.showMainMenu();
    }

    showMainMenu() {
        this.music.play('menu');
        this.state = GameState.MENU;
        this.level = null;
        this.hud.hideGameUi();
        const save = SaveManager.load();
        const canContinue = !!(save && save.inProgress);
        this.screens.showMainMenu({
            canContinue,
            continueLabel: canContinue ? `Continue (level ${save.levelIndex + 1})` : 'Continue',
            completed: !!(save && save.completed)
        });
    }

    startAdventure() {
        const save = SaveManager.load();
        if (save && save.inProgress &&
            !window.confirm('Start a new journey? Your saved progress will be lost.')) return;
        this.resetRun(0);
        this.saveCheckpoint(!!(save && save.completed));
        this.openLevel(0);
    }

    continueAdventure() {
        const save = SaveManager.load();
        if (!save) { this.startAdventure(); return; }
        this.checkpoint = { levelIndex: save.levelIndex, lives: save.lives, upgrades: save.upgrades, score: save.score };
        this.retryFromCheckpoint(true);
    }

    resetRun(levelIndex) {
        this.lives = PLAYER_START_LIVES;
        this.upgrades = [];
        this.score = 0;
        this.checkpoint = { levelIndex, lives: this.lives, upgrades: [], score: 0 };
    }

    saveCheckpoint(completed) {
        const previous = SaveManager.load();
        SaveManager.write({
            levelIndex: this.checkpoint.levelIndex,
            lives: this.checkpoint.lives,
            upgrades: this.checkpoint.upgrades,
            score: this.checkpoint.score,
            inProgress: true,
            completed: completed ?? !!(previous && previous.completed),
        });
    }

    retryFromCheckpoint(showIntro = false) {
        this.levelIndex = this.checkpoint.levelIndex;
        this.lives = this.checkpoint.lives;
        this.upgrades = [...this.checkpoint.upgrades];
        this.score = this.checkpoint.score || 0;
        if (showIntro) this.openLevel(this.levelIndex);
        else this.beginLevel(this.levelIndex);
    }

    openLevel(index) {
        this.levelIndex = index;
        this.state = GameState.STORY;
        this.level = null;
        this.hud.hideGameUi();
        this.screens.showStory(
            { title: `${index + 1}. ${levels[index].name}`, text: levels[index].intro, button: 'Start' },
            () => this.beginLevel(index)
        );
    }

    beginLevel(index) {
        const definition = levels[index];
        if (!definition) throw new Error(`Taset ${index} ei leitud config.js-ist`);

        this.levelIndex = index;
        this.music.play(definition.biome);

        this.player = new Player(this);
        this.level = new Level(definition, this);
        this.spawner = new Spawner(this, definition);
        this.enemies = [];
        this.bullets = [];
        this.powerUps = [];
        this.freezeTimer = 0;
        this.accumulator = 0;
        this.cutscene = null;
        this.hazard = definition.hazard === 'rockfall' && FEATURES.rockfall ? new RockfallHazard(this) : null;
        this.effects.clear();
        this.powerUpTimer = this.rollPowerUpDelay();
        this.effects.setWeather(definition.biome);
        this.player.respawn();

        this.state = GameState.PLAYING;
        this.screens.hideAll();
        this.hud.showGameUi();
        this.hud.showLevelTitle(`${index + 1}. ${definition.name}`, BIOMES[definition.biome].titleColor || '#ffd24a');
        this.syncHud();
    }

    openSettings(from) {
        this.screens.showSettings(Settings, (key, value) => {
            Settings[key] = value;
            Settings.save();
            if (key === 'music') this.music.setVolume(value);
            else { setSfxVolume(value); playSound('shoot'); }
        }, () => {
            if (from === 'pause' && this.state === GameState.PAUSED) this.screens.showPause(true);
            else this.showMainMenu();
        });
    }

    spawnEscorts(count) {
        for (let i = 0; i < count; i++) {
            const spot = this.spawner.findFreeSpawn(TANK_SIZE);
            if (spot) this.enemies.push(createEnemy('basic', this, spot.x, spot.y));
        }
        if (count > 0) this.hud.showBanner('GUARDS INCOMING!', '#ffd24a', 1500);
    }

    onBossArrived() {
        this.hud.showBanner('KARAK IS COMING!', '#ff5a1a');
        this.effects.shake(500, 4);
    }

    onLevelComplete() {
        const finished = this.levelIndex + 1 >= levels.length;
        const next = this.levelIndex + 1;
        this.lives = Math.min(this.lives + LEVEL_CLEAR_BONUS_LIVES, MAX_LIVES);
        this.score += SCORE_LEVEL_BONUS;

        const definition = levels[this.levelIndex];
        this.state = GameState.STORY;
        this.hud.hideGameUi();
        if (finished) {
            SaveManager.write({ levelIndex: 0, inProgress: false, completed: true });
            this.screens.showStory({ title: 'The Journey Ends', text: `${definition.outro}\n\nFinal score: ${this.score}`, button: 'Main Menu' },
                () => this.showMainMenu());
        } else if (next === CHECKPOINT_AFTER_LEVEL) {
            this.screens.showStory({ title: 'Level Complete', text: definition.outro, button: 'Onward' },
                () => this.showCamp(next));
        } else {
            this.screens.showStory({ title: 'Level Complete', text: definition.outro, button: 'Onward' },
                () => this.openLevel(next));
        }
    }

    showCamp(nextIndex) {
        const choices = rollUpgradeChoices(this.upgrades).map(key => ({ key, ...UPGRADES[key] }));
        this.screens.showUpgrade(choices, key => {
            this.upgrades.push(key);
            if (key === 'crew') this.lives = Math.min(this.lives + 2, MAX_LIVES);
            this.lives = Math.max(this.lives, PLAYER_START_LIVES);
            this.checkpoint = { levelIndex: nextIndex, lives: this.lives, upgrades: [...this.upgrades], score: this.score };
            this.saveCheckpoint();
            this.openLevel(nextIndex);
        });
    }

    setPaused(paused) {
        if (paused) this.music.pause();
        else this.music.resume();
        this.state = paused ? GameState.PAUSED : GameState.PLAYING;
        this.screens.showPause(paused);
    }

    get tanks() {
        if (!this.player) return [];
        return [this.player, ...this.enemies].filter(t => !t.markedForDeletion);
    }

    get enemiesRemaining() {
        return this.spawner.queue.length + this.enemies.length;
    }

    update(deltaTime) {
        if (this.debug) this.debug.update();
        if (this.input.consumePress('KeyM')) this.music.toggleMute();
        const pausePressed = this.input.consumePress('KeyP') | this.input.consumePress('Escape');
        if (pausePressed && (this.state === GameState.PLAYING || this.state === GameState.PAUSED)) {
            this.setPaused(this.state === GameState.PLAYING);
        }
        if (this.state === GameState.CUTSCENE) {

            const skip = this.input.consumePress('Space') | this.input.consumePress('Enter');
            this.cutscene.update(Math.min(deltaTime, MAX_FRAME_MS), !!skip);
            if (this.cutscene.done) {
                this.cutscene = null;
                this.onLevelComplete();
            }
            return;
        }
        if (this.state !== GameState.PLAYING) {
            if (!this.level) this.demo.update(deltaTime);
            return;
        }

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
        if (this.hazard) this.hazard.update(dt);
        simulateBullets(this, dt);
        this.updatePowerUps(dt);
        this.effects.update(dt);
        this.cleanup();

        if (this.state === GameState.PLAYING) this.checkLevelComplete();
        if (this.state === GameState.PLAYING) this.syncHud();
    }

    rollPowerUpDelay() {
        const [min, max] = POWERUP_SPAWN_MS;
        return min + Math.random() * (max - min);
    }

    spawnPowerUp() {
        if (this.powerUps.length >= POWERUP_MAX_ON_MAP) return;
        const spot = this.level.randomFreeCell([this.player, ...this.powerUps]);
        if (!spot) return;
        this.powerUps.push(new PowerUp(spot.x, spot.y, randomPowerUpType()));

        this.effects.burst(spot.x, spot.y, ['#ffffff', '#ffd24a', '#9fe8ff'], 14, 80, 2);
    }

    updatePowerUps(dt) {
        this.powerUpTimer -= dt;
        if (this.powerUpTimer <= 0) {
            this.powerUpTimer = this.rollPowerUpDelay();
            this.spawnPowerUp();
        }
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

    onEnemyKilled(enemy) {
        this.score += enemy.scoreValue || 0;
        if (enemy.isBoss) {

            this.spawner.clear();
            this.enemies.forEach(e => { e.markedForDeletion = true; });
            if (FEATURES.finaleCutscene && this.levelIndex === levels.length - 1) this.startCutscene(enemy);
            return;
        }
        if (Math.random() < POWERUP_DROP_CHANCE) this.spawnPowerUp();
    }

    startCutscene(boss) {
        this.state = GameState.CUTSCENE;
        this.cutscene = new FinaleCutscene(this, { x: boss.x + boss.width / 2, y: boss.y + boss.height / 2 });
        this.bullets = [];
        this.powerUps = [];
        this.hud.hideGameUi();
    }

    onPlayerKilled() {
        this.lives--;
        this.score = Math.max(0, this.score - SCORE_DEATH_PENALTY);
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
        this.screens.showGameOver(this.score);
    }

    syncHud() {
        const boss = this.enemies.find(e => e.isBoss);
        this.hud.update({
            lives: this.lives,
            score: this.score,
            upcoming: this.spawner.queue,
            effects: this.effectsText(),
            bossRatio: boss ? boss.health / boss.maxHealth : null,
            bossVulnerable: !!(boss && boss.venting)
        });
    }

    effectsText() {
        const seconds = ms => Math.ceil(ms / 1000);
        const parts = [];
        if (this.player.speedBoostTimer > 0) parts.push(`Speed ${seconds(this.player.speedBoostTimer)}s`);
        if (this.debug && this.debug.god) parts.push('INVINCIBLE');
        else if (this.player.invulnerableTimer > 0) parts.push(`Shield ${seconds(this.player.invulnerableTimer)}s`);
        if (this.level.fortifyTimer > 0) parts.push(`Fortress ${seconds(this.level.fortifyTimer)}s`);
        if (this.freezeTimer > 0) parts.push(`Frozen ${seconds(this.freezeTimer)}s`);
        const boss = this.enemies.find(e => e.isBoss);
        if (boss && boss.mode === 'dazed') parts.push('Karak is stunned!');
        return parts.join(' · ');
    }

    draw(ctx) {

        ctx.canvas.classList.toggle('blurred', !this.level);
        if (!this.level) {
            this.demo.draw(ctx);
            return;
        }
        if (this.cutscene) {
            this.cutscene.draw(ctx);
            return;
        }
        ctx.save();
        this.effects.applyShake(ctx);
        this.level.drawGround(ctx);
        this.level.drawBlocks(ctx);
        this.powerUps.forEach(powerUp => powerUp.draw(ctx));
        this.player.draw(ctx);
        this.enemies.forEach(enemy => enemy.draw(ctx));
        this.bullets.forEach(bullet => bullet.draw(ctx));
        if (this.hazard) this.hazard.draw(ctx);
        this.effects.draw(ctx);
        ctx.restore();
    }
}
