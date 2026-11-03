import { levels, PLAYER_START_LIVES, MAX_LIVES } from "../config.js";

const KEY = "kortetaht.save.v1";

export const SaveManager = {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      const index = Number.isInteger(data.levelIndex) ? data.levelIndex : 0;
      const lives = Number.isInteger(data.lives) ? data.lives : PLAYER_START_LIVES;
      return {
        levelIndex: Math.min(Math.max(index, 0), levels.length - 1),
        lives: Math.min(Math.max(lives, 1), MAX_LIVES),
        upgrades: Array.isArray(data.upgrades) ? data.upgrades.filter((u) => typeof u === "string") : [],
        score: Number.isInteger(data.score) && data.score >= 0 ? data.score : 0,
        inProgress: data.inProgress === true,
        completed: data.completed === true,
      };
    } catch {
      return null;
    }
  },

  write({ levelIndex, lives = PLAYER_START_LIVES, upgrades = [], score = 0, inProgress, completed }) {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({ version: 2, levelIndex, lives, upgrades, score, inProgress, completed }),
      );
    } catch {

    }
  },

  clear() {
    try {
      localStorage.removeItem(KEY);
    } catch {

    }
  },
};
