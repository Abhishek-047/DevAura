// Petals visual effect: sakura-style petals that tumble in 3D, tilt with the sway and drift with gusts of wind.
// Uses a pre-rendered, shaded petal sprite (see core/sprites.js) with a plain bezier fallback.
import { PETALS_DEFAULTS, ENGINE_DEFAULTS } from './defaults.js';
import { createEngine } from './core/engine.js';
import { createPetalSprite, tracePetalPath } from './core/sprites.js';
import { randomInRange, randomChoice, lerp, clamp, gustAt } from './core/utils.js';
import { validateNumber, validateArray, validateObject } from '../shared/validate.js';

const D = PETALS_DEFAULTS;
const pick = (value, fallback) => (value !== undefined ? value : fallback);

export function createPetals(options = {}) {
  validateObject(options, 'options');

  let config = {
    count: pick(options.count, D.COUNT),
    minSpeed: pick(options.minSpeed, D.MIN_SPEED),
    maxSpeed: pick(options.maxSpeed, D.MAX_SPEED),
    minSize: pick(options.minSize, D.MIN_SIZE),
    maxSize: pick(options.maxSize, D.MAX_SIZE),
    colors: pick(options.colors, D.COLORS),
    swayAmplitude: pick(options.swayAmplitude, D.SWAY_AMPLITUDE),
    rotationSpeed: pick(options.rotationSpeed, D.ROTATION_SPEED),
    wind: pick(options.wind, D.WIND),
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
    validateNumber(c.swayAmplitude, 'swayAmplitude', { min: 0 });
    validateNumber(c.rotationSpeed, 'rotationSpeed');
    validateNumber(c.wind, 'wind');
    validateNumber(c.gustStrength, 'gustStrength', { min: 0 });
    validateNumber(c.gustSpeed, 'gustSpeed', { min: 0 });
    validateNumber(c.maxParticles, 'maxParticles', { min: 1, integer: true });
  }

  validateConfig(config);

  const engine = createEngine(options);
  let petals = [];
  let spriteCache = new Map();
  let time = 0;

  function getSprite(color) {
    if (!spriteCache.has(color)) spriteCache.set(color, createPetalSprite(color));
    return spriteCache.get(color);
  }

  function initPetals(width, height) {
    const effectiveCount = Math.min(config.count, config.maxParticles);
    petals = [];
    spriteCache = new Map();
    for (let i = 0; i < effectiveCount; i++) {
      const depth = Math.pow(Math.random(), D.DEPTH_BIAS);
      const size = lerp(config.minSize, config.maxSize, depth);
      const jitter = 1 + randomInRange(-D.SPEED_JITTER, D.SPEED_JITTER);
      petals.push({
        x: Math.random() * width,
        y: Math.random() * height,
        depth,
        speed: clamp(lerp(config.minSpeed, config.maxSpeed, depth) * jitter, config.minSpeed, config.maxSpeed),
        size,
        drawSize: size * D.DRAW_SCALE,
        alpha: lerp(D.MIN_DEPTH_OPACITY, 1, depth),
        windFactor: lerp(D.MIN_DEPTH_WIND, 1, depth),
        color: randomChoice(config.colors),
        angle: Math.random() * Math.PI * 2,
        angularVelocity: randomInRange(-config.rotationSpeed, config.rotationSpeed),
        swayPhase: Math.random() * Math.PI * 2,
        swayFrequency: randomInRange(D.MIN_SWAY_FREQUENCY, D.MAX_SWAY_FREQUENCY),
        flipPhase: Math.random() * Math.PI * 2,
        flipSpeed: randomInRange(D.MIN_FLIP_SPEED, D.MAX_FLIP_SPEED)
      });
    }
    petals.sort((a, b) => a.depth - b.depth);
  }

  const initialSize = engine.getSize();
  initPetals(initialSize.width || 800, initialSize.height || 600);

  engine.setRenderCallback((ctx, width, height, dt) => {
    const scale = dt * ENGINE_DEFAULTS.TARGET_FPS;
    time += dt;
    const gust = gustAt(time, config.gustSpeed) * config.gustStrength;
    const canStamp = typeof ctx.drawImage === 'function';

    ctx.save();
    for (let i = 0; i < petals.length; i++) {
      const p = petals[i];
      const radius = p.drawSize;

      p.swayPhase += p.swayFrequency * scale;
      p.flipPhase += p.flipSpeed * scale;
      p.angle += p.angularVelocity * scale;
      const sway = Math.sin(p.swayPhase);
      p.x += ((config.wind + gust) * p.windFactor + sway * config.swayAmplitude) * scale;
      p.y += p.speed * scale;

      if (p.y > height + radius) {
        p.y = -radius;
        p.x = Math.random() * width;
      }
      if (p.x > width + radius) p.x = -radius;
      else if (p.x < -radius) p.x = width + radius;

      // flip: 1 = facing us, 0 = edge-on. Petals never fully vanish (MIN_FLIP_SCALE).
      const flip = Math.abs(Math.cos(p.flipPhase));
      const flipScale = Math.max(flip, D.MIN_FLIP_SCALE);
      // Faces turned away from the light look slightly darker
      ctx.globalAlpha = p.alpha * (D.MIN_SHADE + (1 - D.MIN_SHADE) * flip);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle + sway * D.TILT_AMOUNT);
      ctx.scale(1, flipScale);

      const sprite = canStamp ? getSprite(p.color) : null;
      if (sprite) {
        ctx.drawImage(sprite, -p.drawSize / 2, -p.drawSize / 2, p.drawSize, p.drawSize);
      } else {
        ctx.scale(p.drawSize * D.SPRITE_WIDTH, p.drawSize * D.SPRITE_HEIGHT);
        ctx.beginPath();
        tracePetalPath(ctx);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
      ctx.restore();
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
      petals = [];
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
      initPetals(size.width || 800, size.height || 600);
    }
  };
}
