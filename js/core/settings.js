const KEY = "desertstar.settings.v1";

export const Settings = {
  music: 0.8,
  sfx: 0.8,

  load() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || "{}");
      if (typeof data.music === "number") this.music = Math.min(Math.max(data.music, 0), 1);
      if (typeof data.sfx === "number") this.sfx = Math.min(Math.max(data.sfx, 0), 1);
    } catch {

    }
    return this;
  },

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ music: this.music, sfx: this.sfx }));
    } catch {

    }
  },
};
