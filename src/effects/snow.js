// Snow visual effect: depth-layered, wind-driven snowfall with soft bokeh, sharp dots and classic crystals.
// Far flakes are small, slow, soft and faint; near flakes are big, fast, sharp and bright (this is what sells "real" snow).
import { SNOW_DEFAULTS, SNOW_FLAKE_STYLES, ENGINE_DEFAULTS } from './defaults.js';
import { createEngine } from './core/engine.js';
import { createSnowSprite } from './core/sprites.js';
import { randomInRange, randomChoice, lerp, clamp, gustAt } from './core/utils.js';
import { validateNumber, validateArray, validateObject, validateString } from '../shared/validate.js';

const D = SNOW_DEFAULTS;
const pick = (value, fallback) => (value !== undefined ? value : fallback);

export function createSnow(options = {}) {
  validateObject(options, 'options');

  let config = {
    count: pick(options.count, D.COUNT),
    minSpeed: pick(options.minSpeed, D.MIN_SPEED),
    maxSpeed: pick(options.maxSpeed, D.MAX_SPEED),
    minSize: pick(options.minSize, D.MIN_SIZE),
    maxSize: pick(options.maxSize, D.MAX_SIZE),
    colors: pick(options.colors, D.COLORS),
    wind: pick(options.wind, D.WIND),
    opacity: pick(options.opacity, D.OPACITY),
    flake: pick(options.flake, D.FLAKE),
    gustStrength: pick(options.gustStrength, D.GUST_STRENGTH),
    gustSpeed: pick(options.gustSpeed, D.GUST_SPEED),
    maxParticles: pick(options.maxParticles, ENGINE_DEFAULTS.MAX_PARTICLES)
  };

  function validateConfig(c) {
    validateNumber(c.count, 'count', { min: 0, integer: true });
    validateNumber(c.minSpeed, 'minSpeed', { min: 0 });
    validateNumber(c.maxSpeed, 'maxSpeed', { min: c.minSpeed });
    validateNumber(c.minSize, 'minSize', { min: 0.1 });
    validateNumber(c.maxSize, 'maxSize', { min: c.minSize });
    validateArray(c.colors, 'colors', { minLength: 1 });
    validateNumber(c.wind, 'wind');
    validateNumber(c.opacity, 'opacity', { min: 0, max: 1 });
    validateString(c.flake, 'flake', { allowed: SNOW_FLAKE_STYLES });
    validateNumber(c.gustStrength, 'gustStrength', { min: 0 });
    validateNumber(c.gustSpeed, 'gustSpeed', { min: 0 });
    validateNumber(c.maxParticles, 'maxParticles', { min: 1, integer: true });
  }

  validateConfig(config);

  const engine = createEngine(options);
  let flakes = [];
  let spriteCache = new Map();
  let time = 0;

  // Each (style, color) sprite is drawn once, on first use.
  function getSprite(style, color) {
    const key = `${style}|${color}`;
    if (!spriteCache.has(key)) spriteCache.set(key, createSnowSprite(style, color));
    return spriteCache.get(key);
  }

  function chooseStyle(depth, drawSize) {
    let style = config.flake;
    if (style === 'mixed') {
      if (depth < D.SOFT_DEPTH_MAX) style = 'soft';
      else if (depth >= D.CLASSIC_DEPTH_MIN && Math.random() < D.CLASSIC_CHANCE) style = 'classic';
      else style = Math.random() < D.MID_SOFT_CHANCE ? 'soft' : 'dot';
    }
    // A tiny crystal just looks like a blob, so small ones become plain dots
    if (style === 'classic' && drawSize < D.CLASSIC_MIN_DRAW_SIZE) style = 'dot';
    return style;
  }

  function initFlakes(width, height) {
    const effectiveCount = Math.min(config.count, config.maxParticles);
    flakes = [];
    spriteCache = new Map();
    for (let i = 0; i < effectiveCount; i++) {
      // Bias toward far flakes so the scene has lots of small ones and a few big close ones
      const depth = Math.pow(Math.random(), D.DEPTH_BIAS);
      const size = lerp(config.minSize, config.maxSize, depth);
      const jitter = 1 + randomInRange(-D.SPEED_JITTER, D.SPEED_JITTER);
      const speed = clamp(lerp(config.minSpeed, config.maxSpeed, depth) * jitter, config.minSpeed, config.maxSpeed);
      const diameter = size * 2;
      const style = chooseStyle(depth, diameter * D.CLASSIC_SCALE);
      const scaleByStyle = style === 'soft' ? D.SOFT_SCALE : style === 'classic' ? D.CLASSIC_SCALE : 1;
      flakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        depth,
        speed,
        size,
        style,
        drawSize: diameter * scaleByStyle,
        alpha: lerp(D.MIN_DEPTH_OPACITY, 1, depth),
        windFactor: lerp(D.MIN_DEPTH_WIND, 1, depth),
        color: randomChoice(config.colors),
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: randomInRange(D.MIN_WOBBLE_SPEED, D.MAX_WOBBLE_SPEED),
        spin: Math.random() * Math.PI * 2,
        spinSpeed: randomInRange(-D.SPIN_SPEED, D.SPIN_SPEED)
      });
    }
    // Draw far flakes first so near flakes overlap them
    flakes.sort((a, b) => a.depth - b.depth);
  }

  const initialSize = engine.getSize();
  initFlakes(initialSize.width || 800, initialSize.height || 600);

  engine.setRenderCallback((ctx, width, height, dt) => {
    const scale = dt * ENGINE_DEFAULTS.TARGET_FPS;
    time += dt;
    const gust = gustAt(time, config.gustSpeed) * config.gustStrength;
    const canStamp = typeof ctx.drawImage === 'function';

    ctx.save();
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];
      const radius = f.drawSize / 2;

      f.wobble += f.wobbleSpeed * scale;
      f.spin += f.spinSpeed * scale;
      f.x += ((config.wind + gust) * f.windFactor + Math.sin(f.wobble) * D.WOBBLE_AMPLITUDE) * scale;
      f.y += f.speed * scale;

      if (f.y > height + radius) {
        f.y = -radius;
        f.x = Math.random() * width;
      }
      if (f.x > width + radius) f.x = -radius;
      else if (f.x < -radius) f.x = width + radius;

      ctx.globalAlpha = config.opacity * f.alpha;

      const sprite = canStamp ? getSprite(f.style, f.color) : null;
      if (sprite) {
        if (f.style === 'classic') {
          ctx.save();
          ctx.translate(f.x, f.y);
          ctx.rotate(f.spin);
          ctx.drawImage(sprite, -radius, -radius, f.drawSize, f.drawSize);
          ctx.restore();
        } else {
          ctx.drawImage(sprite, f.x - radius, f.y - radius, f.drawSize, f.drawSize);
        }
      } else {
        // Fallback when canvas sprites are unavailable: plain circle
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fillStyle = f.color;
        ctx.fill();
      }
    }
    ctx.restore();
  });

  return {
    start() {
      engine.start();
    },
    stop() {
      engine.stop();
    },
    destroy() {
      engine.destroy();
      flakes = [];
      spriteCache = new Map();
    },
    isRunning() {
      return engine.isRunning();
    },
    update(newOptions = {}) {
      validateObject(newOptions, 'newOptions');
      const nextConfig = { ...config, ...newOptions };
      validateConfig(nextConfig);
      config = nextConfig;
      const size = engine.getSize();
      initFlakes(size.width || 800, size.height || 600);
    }
  };
}
