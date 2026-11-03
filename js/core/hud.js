/** Mängu ajal nähtav HUD. Kirjutab DOM-i ainult siis, kui väärtus muutus. */
export class HUD {
    constructor() {
        this.ui = document.getElementById('ui');
        this.levelNameEl = document.getElementById('levelName');
        this.livesEl = document.getElementById('lives');
        this.enemiesEl = document.getElementById('enemies');
        this.effectsEl = document.getElementById('effects');
        this.bossBar = document.getElementById('bossBar');
        this.bossFill = document.getElementById('bossFill');
        this.cache = {};
    }

    update({ levelName, lives, enemies, effects, bossRatio }) {
        this.write('levelName', this.levelNameEl, levelName);
        this.write('lives', this.livesEl, lives);
        this.write('enemies', this.enemiesEl, enemies);
        this.write('effects', this.effectsEl, effects);

        if (this.cache.boss !== bossRatio) {
            this.cache.boss = bossRatio;
            this.bossBar.classList.toggle('hidden', bossRatio === null);
            if (bossRatio !== null) this.bossFill.style.width = `${Math.max(0, bossRatio) * 100}%`;
        }
    }

    write(key, element, value) {
        if (this.cache[key] === value) return;
        this.cache[key] = value;
        element.textContent = value;
    }

    showGameUi() {
        this.ui.classList.remove('hidden');
    }

    hideGameUi() {
        this.ui.classList.add('hidden');
        this.effectsEl.textContent = '';
        this.bossBar.classList.add('hidden');
        this.cache = {};
    }
}
