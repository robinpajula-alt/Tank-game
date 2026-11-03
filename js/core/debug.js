import { levels } from "../config.js";
import { GameState } from "./gamestate.js";

/**
 * Arendaja tööriistad testimiseks. Aktiivne ainult siis, kui config.js-is DEBUG = true.
 *   1–5  hüppa otse tasemele (jätab loo vahele, ei puutu salvestust)
 *   N    järgmine tase
 *   K    tapa kõik vaenlased (tase loetakse läbituks, salvestus uueneb)
 *   G    surematus sisse/välja
 */
export class DebugTools {
  constructor(game) {
    this.game = game;
    this.god = false;
    console.info(
      "[DEBUG] 1–" +
        levels.length +
        " = tase, N = järgmine tase, K = tapa vaenlased, G = surematus",
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

    if (input.consumePress("KeyG")) {
      this.god = !this.god;
      if (!this.god && game.player) game.player.invulnerableTimer = 0;
      console.info(`[DEBUG] surematus ${this.god ? "sees" : "väljas"}`);
    }

    if (game.state !== GameState.PLAYING) return;

    if (input.consumePress("KeyK")) {
      game.spawner.clear();
      game.enemies.forEach((enemy) => {
        enemy.markedForDeletion = true;
      });
    }
    if (this.god) game.player.invulnerableTimer = 1e9;
  }
}
