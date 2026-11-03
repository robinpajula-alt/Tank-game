import { levels } from "../config.js";
import { GameState } from "./gamestate.js";

export class DebugTools {
  constructor(game) {
    this.game = game;
    this.god = false;
    console.info(
      "[DEBUG] 1–" + levels.length +
        " = tase, N = järgmine tase, G = tapa ekraanil olevad, H = järgmine vaenlane, " +
        "K = tase läbi, B = tapa boss, U = uuenduste laager, I = surematus",
    );
  }

  update() {
    const { game } = this;
    const input = game.input;

    levels.forEach((_, index) => {
      if (input.consumePress(`Digit${index + 1}`)) game.beginLevel(index);
    });
    if (input.consumePress("KeyN"))
      game.beginLevel((game.levelIndex + 1) % levels.length);

    if (input.consumePress("KeyI")) {
      this.god = !this.god;
      if (!this.god && game.player) game.player.invulnerableTimer = 0;
      console.info(`[DEBUG] surematus ${this.god ? "sees" : "väljas"}`);
    }

    const killAllPressed = input.consumePress("KeyG");
    const spawnPressed = input.consumePress("KeyH");
    const clearLevelPressed = input.consumePress("KeyK");
    const bossPressed = input.consumePress("KeyB");
    if (input.consumePress("KeyU")) {
      game.state = GameState.STORY;
      game.hud.hideGameUi();
      game.showCamp(Math.min(game.levelIndex + 1, levels.length - 1));
      return;
    }
    if (game.state !== GameState.PLAYING) return;

    if (killAllPressed) {

      game.enemies.filter((e) => !e.isBoss && !e.markedForDeletion).forEach((enemy) => {
        enemy.health = 0;
        enemy.spawnHitEffects(true);
        enemy.die();
      });
    }
    if (spawnPressed) game.spawner.spawnNext();
    if (clearLevelPressed) {
      game.spawner.clear();
      game.enemies.forEach((enemy) => {
        enemy.markedForDeletion = true;
      });
    }
    if (bossPressed) {
      const boss = game.enemies.find((e) => e.isBoss);
      if (boss) {
        boss.mode = "dazed";
        boss.health = 1;
        boss.takeDamage(1);
      }
    }
    if (this.god && game.player) game.player.invulnerableTimer = 1e9;
  }
}
