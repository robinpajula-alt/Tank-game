import { Entity } from './core/entity.js';
import { assets, drawSprite } from './assets.js';
import { DIRECTIONS, BULLET_SPEED, BULLET_LONG, BULLET_SHORT, CANVAS_WIDTH, CANVAS_HEIGHT } from './config.js';

// Kuuli pilt on joonistatud SUUNAGA ÜLES (10x12 px). Mäng pöörab selle ise.
const ROTATION = { up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 };

export class Bullet extends Entity {
    /** lateral: nihe küljele (ristisuunas), et tulistada mitut kuuli korraga (boss). */
    constructor(owner, lateral = 0) {
        const vertical = owner.direction === 'up' || owner.direction === 'down';
        const width = vertical ? BULLET_SHORT : BULLET_LONG;
        const height = vertical ? BULLET_LONG : BULLET_SHORT;
        const cx = owner.x + owner.width / 2 + (vertical ? lateral : 0);
        const cy = owner.y + owner.height / 2 + (vertical ? 0 : lateral);
        super(cx - width / 2, cy - height / 2, width, height);

        this.owner = owner;
        this.team = owner.team;
        this.direction = owner.direction;
        this.color = owner.bulletColor;
        this.sprite = owner.bulletSprite;          // võti assets.images.bullets all (või null)
        this.speed = BULLET_SPEED;
        this.damage = 1;
        this.prevX = this.x;
        this.prevY = this.y;
    }

    update(deltaTime) {
        this.prevX = this.x;
        this.prevY = this.y;
        const v = DIRECTIONS[this.direction];
        const distance = this.speed * deltaTime / 1000;
        this.x += v.x * distance;
        this.y += v.y * distance;

        if (this.x + this.width < 0 || this.x > CANVAS_WIDTH ||
            this.y + this.height < 0 || this.y > CANVAS_HEIGHT) {
            this.markedForDeletion = true;
        }
    }

    /** Ristkülik, mille kuul selle sammu jooksul läbis. Kuulide kokkupõrkeks. */
    get sweptRect() {
        const x = Math.min(this.x, this.prevX);
        const y = Math.min(this.y, this.prevY);
        return {
            x, y,
            width: this.width + Math.abs(this.x - this.prevX),
            height: this.height + Math.abs(this.y - this.prevY)
        };
    }

    draw(ctx) {
        const img = this.sprite && assets.images.bullets[this.sprite];

        ctx.save();
        ctx.translate(Math.round(this.x + this.width / 2), Math.round(this.y + this.height / 2));
        ctx.rotate(ROTATION[this.direction]);
        const drawn = drawSprite(ctx, img, -BULLET_SHORT / 2, -BULLET_LONG / 2, BULLET_SHORT, BULLET_LONG);
        ctx.restore();

        if (!drawn) {                               // pilti pole: tavaline värviline ristkülik
            ctx.fillStyle = this.color;
            ctx.fillRect(Math.round(this.x), Math.round(this.y), this.width, this.height);
        }
    }
}
