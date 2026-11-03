import { levels } from "../config.js";

const KEY = "kortetaht.save.v1";

/**
 * Salvestus JSON-ina localStorage'is. Kogu mängu olek on kolm välja:
 *   levelIndex – järgmine mängitav tase
 *   inProgress – kas on pooleli seiklus (lubab "Jätka")
 *   completed  – kas mäng on kunagi läbitud (avab "Vali tase")
 */
export const SaveManager = {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      const index = Number.isInteger(data.levelIndex) ? data.levelIndex : 0;
      return {
        levelIndex: Math.min(Math.max(index, 0), levels.length - 1),
        inProgress: data.inProgress === true,
        completed: data.completed === true,
      };
    } catch {
      return null; // rikutud või keelatud salvestus: käitu nagu salvestust poleks
    }
  },

  write({ levelIndex, inProgress, completed }) {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({ version: 1, levelIndex, inProgress, completed }),
      );
    } catch {
      /* ignoreeri (privaatrežiim, täis salvestus) */
    }
  },

  clear() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignoreeri */
    }
  },
};
