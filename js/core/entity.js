/** Kõigi mänguobjektide baasklass: asukoht, mõõdud, kustutamise lipp. */
export class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.markedForDeletion = false;
    }

    update(deltaTime) {}
    draw(ctx) {}
}
