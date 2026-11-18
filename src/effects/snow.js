// Snow visual effect implementation
import { SNOW_DEFAULTS, ENGINE_DEFAULTS } from './defaults.js';
import { createEngine } from './core/engine.js';
import { randomInRange, randomChoice } from './core/utils.js';
import { validateNumber, validateArray, validateObject } from '../shared/validate.js';

export function createSnow(options = {}) {
  validateObject(options, 'options');

  let config = {
    count: options.count !== undefined ? options.count : SNOW_DEFAULTS.COUNT,
    minSpeed: options.minSpeed !== undefined ? options.minSpeed : SNOW_DEFAULTS.MIN_SPEED,
    maxSpeed: options.maxSpeed !== undefined ? options.maxSpeed : SNOW_DEFAULTS.MAX_SPEED,
    minSize: options.minSize !== undefined ? options.minSize : SNOW_DEFAULTS.MIN_SIZE,
    maxSize: options.maxSize !== undefined ? options.maxSize : SNOW_DEFAULTS.MAX_SIZE,
    colors: options.colors !== undefined ? options.colors : SNOW_DEFAULTS.COLORS,
    wind: options.wind !== undefined ? options.wind : SNOW_DEFAULTS.WIND,
    opacity: options.opacity !== undefined ? options.opacity : SNOW_DEFAULTS.OPACITY,
    maxParticles: options.maxParticles !== undefined ? options.maxParticles : ENGINE_DEFAULTS.MAX_PARTICLES
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
    validateNumber(c.maxParticles, 'maxParticles', { min: 1, integer: true });
  }

  validateConfig(config);

  const engine = createEngine(options);
  let flakes = [];

  function initFlakes(width, height) {
    const effectiveCount = Math.min(config.count, config.maxParticles);
    flakes = [];
    for (let i = 0; i < effectiveCount; i++) {
      flakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: randomInRange(config.minSpeed, config.maxSpeed),
        size: randomInRange(config.minSize, config.maxSize),
        color: randomChoice(config.colors),
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: randomInRange(0.01, 0.04)
      });
    }
  }

  const initialSize = engine.getSize();
  initFlakes(initialSize.width || 800, initialSize.height || 600);

  engine.setRenderCallback((ctx, width, height, dt) => {
    const scale = dt * ENGINE_DEFAULTS.TARGET_FPS;
    ctx.save();
    ctx.globalAlpha = config.opacity;

    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];
      f.wobble += f.wobbleSpeed * scale;
      f.x += (config.wind + Math.sin(f.wobble)) * scale;
      f.y += f.speed * scale;

      if (f.y > height + f.size) {
        f.y = -f.size;
        f.x = Math.random() * width;
      }
      if (f.x > width + f.size) {
        f.x = -f.size;
      } else if (f.x < -f.size) {
        f.x = width + f.size;
      }

      ctx.beginPath();
      ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
      ctx.fillStyle = f.color;
      ctx.fill();
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
