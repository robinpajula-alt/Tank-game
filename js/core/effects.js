import { FEATURES, CANVAS_WIDTH, CANVAS_HEIGHT } from "../config.js";

export const FIRE_COLORS = ["#fff4c2", "#ffd24a", "#ff8a14", "#e04a06", "#5a2a1a"];
export const SPARK_COLORS = ["#ffffff", "#d8e6ff", "#9fb3c8"];

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const WEATHER = {
  desert: {
    every: 45, max: 70,
    spawn: () => ({ x: -6, y: rand(0, CANVAS_HEIGHT), vx: rand(140, 230), vy: rand(-8, 18),
                    w: pick([3, 4, 6]), h: 1, color: pick(["#f6dfa0", "#e8c77a", "#fff0c4"]), alpha: 0.55, life: 4000 }),
  },
  canyon: {
    every: 180, max: 30,
    spawn: () => ({ x: rand(0, CANVAS_WIDTH), y: rand(0, CANVAS_HEIGHT), vx: rand(10, 30), vy: rand(-6, 6),
                    w: 2, h: 2, color: pick(["#e09a6a", "#c46a3a"]), alpha: 0.45, life: rand(2500, 4000) }),
  },
  swamp: {
    every: 260, max: 18,
    spawn: () => ({ x: rand(0, CANVAS_WIDTH), y: rand(0, CANVAS_HEIGHT), vx: rand(-12, 12), vy: rand(-12, 12),
                    w: 2, h: 2, color: pick(["#d8ff6a", "#f2ff9a"]), alpha: 0.9, life: rand(2500, 4500),
                    wander: true, blink: true }),
  },
  tundra: {
    every: 60, max: 80,
    spawn: () => ({ x: rand(-20, CANVAS_WIDTH), y: -4, vx: rand(8, 26), vy: rand(30, 60),
                    w: pick([1, 2, 2]), h: pick([1, 2, 2]), color: "#ffffff", alpha: 0.85, life: 12000, sway: true }),
  },
  volcano: {
    every: 90, max: 50,
    spawn: () => ({ x: rand(0, CANVAS_WIDTH), y: CANVAS_HEIGHT + 2, vx: rand(-10, 10), vy: rand(-70, -35),
                    w: 2, h: 2, color: pick(["#ff8a14", "#ffd24a", "#ff5a0a", "#6a5a5e"]), alpha: 0.8, life: rand(3000, 6000),
                    sway: true }),
  },
};

export class Effects {
  constructor() {
    this.clear();
  }

  clear() {
    this.particles = [];
    this.weather = [];
    this.weatherSpec = null;
    this.weatherTimer = 0;
    this.shakeTimer = 0;
    this.shakePower = 0;
  }

  setWeather(biome) {
    this.weather = [];
    this.weatherSpec = FEATURES.weather ? WEATHER[biome] || null : null;
    this.weatherTimer = 0;
  }

  updateWeather(deltaTime) {
    const spec = this.weatherSpec;
    if (!spec) return;
    this.weatherTimer += deltaTime;
    while (this.weatherTimer >= spec.every) {
      this.weatherTimer -= spec.every;
      if (this.weather.length < spec.max) {
        const p = spec.spawn();
        p.maxLife = p.life;
        p.age = 0;
        this.weather.push(p);
      }
    }
    const dt = deltaTime / 1000;
    for (const p of this.weather) {
      p.age += deltaTime;
      p.life -= deltaTime;
      if (p.wander) { p.vx += rand(-40, 40) * dt; p.vy += rand(-40, 40) * dt; }
      const sway = p.sway ? Math.sin(p.age / 400) * 12 : 0;
      p.x += (p.vx + sway) * dt;
      p.y += p.vy * dt;
    }
    this.weather = this.weather.filter((p) =>
      p.life > 0 && p.x > -10 && p.x < CANVAS_WIDTH + 10 && p.y > -10 && p.y < CANVAS_HEIGHT + 10);
  }

  burst(x, y, colors, count = 12, speed = 90, size = 3) {
    if (!FEATURES.explosions) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const v = speed * (0.35 + Math.random() * 0.65);
      const life = 250 + Math.random() * 350;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        life, maxLife: life,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() < 0.3 ? size + 1 : size,
      });
    }
  }

  shake(ms, power) {
    if (!FEATURES.screenShake) return;
    this.shakeTimer = Math.max(this.shakeTimer, ms);
    this.shakePower = Math.max(this.shakePower, power);
  }

  update(deltaTime) {
    const dt = deltaTime / 1000;
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.9;
      p.vy *= 0.9;
      p.life -= deltaTime;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    this.updateWeather(deltaTime);

    if (this.shakeTimer > 0) {
      this.shakeTimer -= deltaTime;
      if (this.shakeTimer <= 0) this.shakePower = 0;
    }
  }

  applyShake(ctx) {
    if (this.shakeTimer <= 0) return;
    const p = this.shakePower * Math.min(1, this.shakeTimer / 150);
    ctx.translate(Math.round((Math.random() * 2 - 1) * p), Math.round((Math.random() * 2 - 1) * p));
  }

  draw(ctx) {
    for (const p of this.weather) {
      const fade = Math.min(1, p.life / 500, p.age / 300);
      const blink = p.blink ? 0.4 + 0.6 * Math.abs(Math.sin(p.age / 220)) : 1;
      ctx.globalAlpha = p.alpha * fade * blink;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.w, p.h);
    }
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x - p.size / 2), Math.round(p.y - p.size / 2), p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
}
