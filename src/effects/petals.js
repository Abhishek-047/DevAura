// Petals visual effect implementation
import { PETALS_DEFAULTS, ENGINE_DEFAULTS } from './defaults.js';
import { createEngine } from './core/engine.js';
import { randomInRange, randomChoice } from './core/utils.js';
import { validateNumber, validateArray, validateObject } from '../shared/validate.js';

export function createPetals(options = {}) {
  validateObject(options, 'options');

  let config = {
    count: options.count !== undefined ? options.count : PETALS_DEFAULTS.COUNT,
    minSpeed: options.minSpeed !== undefined ? options.minSpeed : PETALS_DEFAULTS.MIN_SPEED,
    maxSpeed: options.maxSpeed !== undefined ? options.maxSpeed : PETALS_DEFAULTS.MAX_SPEED,
    minSize: options.minSize !== undefined ? options.minSize : PETALS_DEFAULTS.MIN_SIZE,
    maxSize: options.maxSize !== undefined ? options.maxSize : PETALS_DEFAULTS.MAX_SIZE,
    colors: options.colors !== undefined ? options.colors : PETALS_DEFAULTS.COLORS,
    swayAmplitude: options.swayAmplitude !== undefined ? options.swayAmplitude : PETALS_DEFAULTS.SWAY_AMPLITUDE,
    rotationSpeed: options.rotationSpeed !== undefined ? options.rotationSpeed : PETALS_DEFAULTS.ROTATION_SPEED,
    maxParticles: options.maxParticles !== undefined ? options.maxParticles : ENGINE_DEFAULTS.MAX_PARTICLES
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
    validateNumber(c.maxParticles, 'maxParticles', { min: 1, integer: true });
  }

  validateConfig(config);

  const engine = createEngine(options);
  let petals = [];

  function initPetals(width, height) {
    const effectiveCount = Math.min(config.count, config.maxParticles);
    petals = [];
    for (let i = 0; i < effectiveCount; i++) {
      petals.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: randomInRange(config.minSpeed, config.maxSpeed),
        size: randomInRange(config.minSize, config.maxSize),
        color: randomChoice(config.colors),
        angle: Math.random() * Math.PI * 2,
        angularVelocity: randomInRange(-config.rotationSpeed, config.rotationSpeed),
        swayPhase: Math.random() * Math.PI * 2,
        swayFrequency: randomInRange(0.015, 0.035)
      });
    }
  }

  const initialSize = engine.getSize();
  initPetals(initialSize.width || 800, initialSize.height || 600);

  function drawPetal(ctx, x, y, size, angle, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    // Procedural petal shape
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(size / 2, -size / 2, size, -size / 4, size, size / 2);
    ctx.bezierCurveTo(size / 2, size, 0, size / 2, 0, 0);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  engine.setRenderCallback((ctx, width, height, dt) => {
    const scale = dt * ENGINE_DEFAULTS.TARGET_FPS;

    for (let i = 0; i < petals.length; i++) {
      const p = petals[i];
      p.swayPhase += p.swayFrequency * scale;
      p.x += Math.sin(p.swayPhase) * config.swayAmplitude * scale;
      p.y += p.speed * scale;
      p.angle += p.angularVelocity * scale;

      if (p.y > height + p.size) {
        p.y = -p.size;
        p.x = Math.random() * width;
      }
      if (p.x > width + p.size) {
        p.x = -p.size;
      } else if (p.x < -p.size) {
        p.x = width + p.size;
      }

      drawPetal(ctx, p.x, p.y, p.size, p.angle, p.color);
    }
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
