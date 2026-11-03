/**
 * Taustamuusika. Failinimed tulevad config.js-ist (MUSIC, MUSIC_FOLDER).
 * Üks lugu korraga, loop. Puuduv fail ei tee viga: muusikat lihtsalt pole (konsooli tuleb hoiatus).
 */
export class MusicPlayer {
  constructor(files, folder, volume) {
    this.files = files;
    this.folder = folder;
    this.volume = volume;
    this.tracks = {};
    this.failed = new Set();
    this.currentKey = null;
    this.muted = false;
    this.paused = false;

    // Brauserid lubavad heli alles pärast esimest klõpsu või klahvivajutust: proovime siis uuesti.
    const unlock = () => this.tryPlay();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
  }

  getTrack(key) {
    const file = this.files[key];
    if (!file || this.failed.has(key)) return null;
    if (!this.tracks[key]) {
      const audio = new Audio(this.folder + file);
      audio.loop = true;
      audio.volume = this.volume;
      audio.preload = "auto";
      audio.addEventListener("error", () => {
        this.failed.add(key);
        console.warn(`Muusikat ei leitud: ${this.folder}${file}`);
      });
      this.tracks[key] = audio;
    }
    return this.tracks[key];
  }

  /** Mängi lugu `key` (nt "menu" või bioomi nimi). Sama lugu ei alustata uuesti. */
  play(key) {
    if (key === this.currentKey) {
      this.tryPlay();
      return;
    }
    this.stopCurrent();
    this.currentKey = key;
    this.paused = false;
    const track = this.getTrack(key);
    if (track) track.currentTime = 0;
    this.tryPlay();
  }

  tryPlay() {
    if (this.muted || this.paused || !this.currentKey) return;
    const track = this.getTrack(this.currentKey);
    if (track && track.paused) track.play().catch(() => {});
  }

  stopCurrent() {
    const track = this.currentKey && this.tracks[this.currentKey];
    if (track) {
      track.pause();
      track.currentTime = 0;
    }
  }

  pause() {
    this.paused = true;
    const track = this.currentKey && this.tracks[this.currentKey];
    if (track) track.pause();
  }

  resume() {
    this.paused = false;
    this.tryPlay();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      const track = this.currentKey && this.tracks[this.currentKey];
      if (track) track.pause();
    } else {
      this.tryPlay();
    }
  }
}
