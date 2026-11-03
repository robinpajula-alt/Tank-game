const TITLE_HOLD_MS = 1700;

export class HUD {
    constructor() {
        this.ui = document.getElementById('ui');
        this.livesEl = document.getElementById('lives');
        this.enemyPanel = document.getElementById('enemyPanel');
        this.titleEl = document.getElementById('levelTitle');
        this.bannerEl = document.getElementById('banner');
        this.effectsEl = document.getElementById('effects');
        this.scoreEl = document.getElementById('score');
        this.bossBar = document.getElementById('bossBar');
        this.bossFill = document.getElementById('bossFill');
        this.cache = {};
        this.titleTimer = null;
        this.bannerTimer = null;
    }

    update({ lives, score = 0, upcoming = [], effects, bossRatio, bossVulnerable = false }) {
        this.write('score', this.scoreEl, `SCORE ${String(score).padStart(6, '0')}`);
        if (this.cache.lives !== lives) {
            this.cache.lives = lives;
            this.livesEl.replaceChildren(...Array.from({ length: Math.max(0, lives) }, () => this.icon('heart')));
        }
        const queueKey = upcoming.join(',');
        if (this.cache.queue !== queueKey) {
            this.cache.queue = queueKey;
            this.enemyPanel.replaceChildren(...upcoming.map(type => this.icon(type === 'boss' ? 'boss' : 'enemy')));
        }
        this.write('effects', this.effectsEl, effects);

        if (this.cache.boss !== bossRatio) {
            this.cache.boss = bossRatio;
            this.bossBar.classList.toggle('hidden', bossRatio === null);
            if (bossRatio !== null) this.bossFill.style.width = `${Math.max(0, bossRatio) * 100}%`;
        }
        if (this.cache.bossVulnerable !== bossVulnerable) {
            this.cache.bossVulnerable = bossVulnerable;
            this.bossBar.classList.toggle('vulnerable', bossVulnerable);
        }
    }

    icon(kind) {
        const el = document.createElement('span');
        el.className = `hud-icon ${kind}`;
        return el;
    }

    write(key, element, value) {
        if (this.cache[key] === value) return;
        this.cache[key] = value;
        element.textContent = value;
    }

    showLevelTitle(text, color) {
        clearTimeout(this.titleTimer);
        const el = this.titleEl;
        el.textContent = text;
        el.style.setProperty('--title-color', color);
        el.classList.remove('hidden', 'docked');
        el.classList.remove('intro');
        void el.offsetWidth;
        el.classList.add('intro');
        this.titleTimer = setTimeout(() => el.classList.add('docked'), TITLE_HOLD_MS);
    }

    showBanner(text, color, ms = 2200) {
        clearTimeout(this.bannerTimer);
        const el = this.bannerEl;
        el.textContent = text;
        el.style.setProperty('--title-color', color);
        el.classList.remove('hidden', 'show');
        void el.offsetWidth;
        el.classList.add('show');
        this.bannerTimer = setTimeout(() => el.classList.add('hidden'), ms);
    }

    showGameUi() {
        this.ui.classList.remove('hidden');
    }

    hideGameUi() {
        this.ui.classList.add('hidden');
        this.effectsEl.textContent = '';
        this.scoreEl.textContent = '';
        this.bossBar.classList.add('hidden');
        this.titleEl.classList.add('hidden');
        this.bannerEl.classList.add('hidden');
        clearTimeout(this.titleTimer);
        clearTimeout(this.bannerTimer);
        this.cache = {};
    }
}
