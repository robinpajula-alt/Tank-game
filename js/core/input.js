const DIRECTION_CODES = {
    ArrowUp: 'up',       KeyW: 'up',
    ArrowDown: 'down',   KeyS: 'down',
    ArrowLeft: 'left',   KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right'
};
const FIRE_CODE = 'Space';
const GAME_CODES = new Set([...Object.keys(DIRECTION_CODES), FIRE_CODE, 'KeyP', 'Escape']);

/** Kogu klaviatuurisisend ühes kohas. Kasutab e.code (sõltumatu klaviatuuripaigutusest). */
export class InputHandler {
    constructor(target = window) {
        this.target = target;
        this.held = [];
        this.pressed = new Set();

        this.onKeyDown = (e) => {
            // Nuppudel (menüü) jätame Space/Enter tavapärase käitumise alles.
            const onButton = typeof HTMLButtonElement !== 'undefined' && e.target instanceof HTMLButtonElement;
            if (GAME_CODES.has(e.code) && !onButton) e.preventDefault();
            if (e.repeat) return;
            if (!this.held.includes(e.code)) this.held.push(e.code);
            this.pressed.add(e.code);
        };
        this.onKeyUp = (e) => {
            const i = this.held.indexOf(e.code);
            if (i > -1) this.held.splice(i, 1);
        };
        this.onBlur = () => {
            this.held.length = 0;
            this.pressed.clear();
        };

        target.addEventListener('keydown', this.onKeyDown);
        target.addEventListener('keyup', this.onKeyUp);
        window.addEventListener('blur', this.onBlur);
    }

    getDirection() {
        for (let i = this.held.length - 1; i >= 0; i--) {
            const dir = DIRECTION_CODES[this.held[i]];
            if (dir) return dir;
        }
        return null;
    }

    isFiring() {
        return this.held.includes(FIRE_CODE);
    }

    consumePress(code) {
        return this.pressed.delete(code);
    }

    destroy() {
        this.target.removeEventListener('keydown', this.onKeyDown);
        this.target.removeEventListener('keyup', this.onKeyUp);
        window.removeEventListener('blur', this.onBlur);
    }
}
