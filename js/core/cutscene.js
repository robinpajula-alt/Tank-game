import { CANVAS_WIDTH as W, CANVAS_HEIGHT as H } from "../config.js";
import { drawSprite, playSound } from "../assets.js";
import { FIRE_COLORS } from "./effects.js";
import { Base } from "../world/block.js";

const T = {
  bossEnd: 1600,
  zoomEnd: 3000,
  riseEnd: 5600,
  flashEnd: 6400,
  end: 10000,
  skipAfter: 2000,
};
const ZOOM = 2.2;
const RISE_PX = 70;
const GOLD = ["#fff4c2", "#ffd24a", "#ffe27a", "#ffffff"];

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const ease = (t) => t * t * (3 - 2 * t);
const phase = (age, from, to) => clamp01((age - from) / (to - from));

export class FinaleCutscene {
  constructor(game, bossCenter) {
    this.game = game;
    this.bossCenter = bossCenter;
    this.base = game.level.blocks.find((b) => b instanceof Base) || null;
    this.age = 0;
    this.done = false;
    this.boomTimer = 0;
    this.booms = 0;
    this.gatherTimer = 0;
    this.motes = [];
    this.flashed = false;
  }

  get baseCenter() {
    if (!this.base) return { x: W / 2, y: H / 2 };
    return { x: this.base.x + this.base.width / 2, y: this.base.y + this.base.height / 2 };
  }

  update(deltaTime, skipPressed) {
    this.age += deltaTime;
    const fx = this.game.effects;

    if (this.age < T.bossEnd) {
      this.boomTimer -= deltaTime;
      if (this.boomTimer <= 0) {
        this.boomTimer = 110;
        const { x, y } = this.bossCenter;
        fx.burst(x + (Math.random() - 0.5) * 48, y + (Math.random() - 0.5) * 48, FIRE_COLORS, 18, 140, 3);
        fx.shake(220, 5);
        if (this.booms++ % 3 === 0) playSound("explosion");
      }
    }

    if (this.age > T.zoomEnd && this.age < T.riseEnd) {
      this.gatherTimer -= deltaTime;
      if (this.gatherTimer <= 0) {
        this.gatherTimer = 35;
        const a = Math.random() * Math.PI * 2;
        const r = 60 + Math.random() * 50;
        const c = this.baseCenter;
        this.motes.push({ x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r, speed: 20 + Math.random() * 20,
                          color: GOLD[Math.floor(Math.random() * GOLD.length)] });
      }
      if (this.age > T.riseEnd - 900) fx.shake(60, 1.5);
    }
    const c = this.stoneCenter();
    for (const m of this.motes) {
      const dx = c.x - m.x;
      const dy = c.y - m.y;
      const d = Math.hypot(dx, dy) || 1;
      m.speed += 140 * (deltaTime / 1000);
      const step = Math.min(d, m.speed * (deltaTime / 1000));
      m.x += (dx / d) * step;
      m.y += (dy / d) * step;
      m.dead = d < 3;
    }
    this.motes = this.motes.filter((m) => !m.dead);

    if (!this.flashed && this.age >= T.riseEnd) {
      this.flashed = true;
      this.motes = [];
      fx.burst(c.x, c.y, GOLD, 40, 130, 2);
      fx.shake(300, 3);
      playSound("powerup");
    }

    fx.update(deltaTime);
    if (this.age >= T.end || (skipPressed && this.age >= T.skipAfter)) this.done = true;
  }

  stoneCenter() {
    const c = this.baseCenter;
    const o = this.stoneOffset();
    return { x: c.x + o.x, y: c.y + o.y };
  }

  stoneOffset() {
    const rise = ease(phase(this.age, T.zoomEnd + 600, T.riseEnd));
    const shakeAmp = this.age < T.riseEnd ? 2 * phase(this.age, T.zoomEnd, T.riseEnd) : 0;
    const bob = this.age > T.riseEnd ? Math.sin(this.age / 300) * 1.5 : 0;
    return {
      x: Math.round((Math.random() * 2 - 1) * shakeAmp),
      y: Math.round(-rise * RISE_PX + bob + (Math.random() * 2 - 1) * shakeAmp),
    };
  }

  camera() {
    const z = ease(phase(this.age, T.bossEnd, T.zoomEnd));
    const s = 1 + (ZOOM - 1) * z;
    const c = this.baseCenter;
    const half = W / (2 * s);

    const fx = Math.min(Math.max(W / 2 + (c.x - W / 2) * z, half), W - half);
    const fy = Math.min(Math.max(H / 2 + (c.y - 8 - H / 2) * z, half), H - half);
    return { s, fx, fy };
  }

  draw(ctx) {
    const { level, player, effects } = this.game;
    const cam = this.camera();

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    effects.applyShake(ctx);
    ctx.translate(W / 2, H / 2);
    ctx.scale(cam.s, cam.s);
    ctx.translate(-cam.fx, -cam.fy);

    level.drawGround(ctx);
    for (const block of level.blocks) if (block !== this.base) block.draw(ctx);
    if (player) player.draw(ctx);

    this.drawGlow(ctx);
    this.drawRays(ctx);
    this.drawStone(ctx);
    for (const m of this.motes) {
      ctx.fillStyle = m.color;
      ctx.fillRect(Math.round(m.x), Math.round(m.y), 2, 2);
    }
    effects.draw(ctx);
    ctx.restore();

    this.drawOverlay(ctx);
  }

  drawGlow(ctx) {
    const p = phase(this.age, T.zoomEnd, T.riseEnd);
    if (p <= 0) return;
    const c = this.stoneCenter();
    const pulse = 1 + 0.15 * Math.sin(this.age / 120);
    const r = (10 + 28 * p) * pulse * (this.age > T.riseEnd ? 1.3 : 1);
    const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r);
    g.addColorStop(0, `rgba(255, 236, 150, ${0.75 * p})`);
    g.addColorStop(1, "rgba(255, 200, 60, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(c.x - r, c.y - r, r * 2, r * 2);
  }

  drawRays(ctx) {
    const p = phase(this.age, T.riseEnd, T.flashEnd);
    if (p <= 0) return;
    const c = this.stoneCenter();
    const spin = this.age / 1600;
    ctx.save();
    ctx.globalAlpha = 0.28 * p;
    ctx.fillStyle = "#ffe27a";
    for (let i = 0; i < 10; i++) {
      const a = spin + (i / 10) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x + Math.cos(a - 0.09) * 90, c.y + Math.sin(a - 0.09) * 90);
      ctx.lineTo(c.x + Math.cos(a + 0.09) * 90, c.y + Math.sin(a + 0.09) * 90);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  drawStone(ctx) {
    if (!this.base) return;
    const o = this.stoneOffset();
    const b = this.base;
    const glowing = this.age > T.zoomEnd;
    ctx.save();
    if (glowing) ctx.filter = `brightness(${1 + 0.4 * Math.abs(Math.sin(this.age / 200))})`;
    if (!drawSprite(ctx, b.getImage(), b.x + o.x, b.y + o.y, b.width, b.height)) {
      ctx.fillStyle = b.fallbackColor;
      ctx.fillRect(Math.round(b.x + o.x), Math.round(b.y + o.y), b.width, b.height);
    }
    ctx.restore();
  }

  drawOverlay(ctx) {

    const flash = this.age >= T.riseEnd ? 1 - phase(this.age, T.riseEnd, T.flashEnd + 300) : 0;
    if (flash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${flash})`;
      ctx.fillRect(0, 0, W, H);
    }

    const bars = 26 * ease(phase(this.age, 0, 600));
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, bars);
    ctx.fillRect(0, H - bars, W, bars);

    const t = phase(this.age, T.flashEnd, T.flashEnd + 800);
    if (t > 0) {
      ctx.save();
      ctx.globalAlpha = t;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = '14px "Press Start 2P", monospace';
      ctx.fillStyle = "#000";
      ctx.fillText("THE DESERT STAR IS SAVED!", W / 2 + 2, 82 + 2);
      ctx.fillStyle = "#ffd24a";
      ctx.fillText("THE DESERT STAR IS SAVED!", W / 2, 82);
      ctx.restore();
    }
    if (this.age >= T.skipAfter) {
      ctx.save();
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(this.age / 300);
      ctx.textAlign = "right";
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = "#ffffff";
      ctx.fillText("SPACE – SKIP", W - 10, H - 14);
      ctx.restore();
    }
  }
}
