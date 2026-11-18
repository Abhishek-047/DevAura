// One-shot confetti burst visual effect implementation
import { CONFETTI_DEFAULTS, ENGINE_DEFAULTS } from './defaults.js';
import { createEngine } from './core/engine.js';
import { randomInRange, randomChoice, degreesToRadians } from './core/utils.js';
import { validateNumber, validateArray, validateObject } from '../shared/validate.js';

export function fireConfetti(options = {}) {
  validateObject(options, 'options');

  const config = {
    count: options.count !== undefined ? options.count : CONFETTI_DEFAULTS.COUNT,
    duration: options.duration !== undefined ? options.duration : CONFETTI_DEFAULTS.DURATION,
    spread: options.spread !== undefined ? options.spread : CONFETTI_DEFAULTS.SPREAD,
    originX: options.originX !== undefined ? options.originX : CONFETTI_DEFAULTS.ORIGIN_X,
    originY: options.originY !== undefined ? options.originY : CONFETTI_DEFAULTS.ORIGIN_Y,
    minSpeed: options.minSpeed !== undefined ? options.minSpeed : CONFETTI_DEFAULTS.MIN_SPEED,
    maxSpeed: options.maxSpeed !== undefined ? options.maxSpeed : CONFETTI_DEFAULTS.MAX_SPEED,
    minSize: options.minSize !== undefined ? options.minSize : CONFETTI_DEFAULTS.MIN_SIZE,
    maxSize: options.maxSize !== undefined ? options.maxSize : CONFETTI_DEFAULTS.MAX_SIZE,
    gravity: options.gravity !== undefined ? options.gravity : CONFETTI_DEFAULTS.GRAVITY,
    colors: options.colors !== undefined ? options.colors : CONFETTI_DEFAULTS.COLORS,
    maxParticles: options.maxParticles !== undefined ? options.maxParticles : ENGINE_DEFAULTS.MAX_PARTICLES
  };

  validateNumber(config.count, 'count', { min: 1, integer: true });
  validateNumber(config.duration, 'duration', { min: 100 });
  validateNumber(config.spread, 'spread', { min: 1, max: 360 });
  validateNumber(config.originX, 'originX', { min: 0, max: 1 });
  validateNumber(config.originY, 'originY', { min: 0, max: 1 });
  validateNumber(config.minSpeed, 'minSpeed', { min: 0 });
  validateNumber(config.maxSpeed, 'maxSpeed', { min: config.minSpeed });
  validateNumber(config.minSize, 'minSize', { min: 1 });
  validateNumber(config.maxSize, 'maxSize', { min: config.minSize });
  validateNumber(config.gravity, 'gravity', { min: 0 });
  validateArray(config.colors, 'colors', { minLength: 1 });
  validateNumber(config.maxParticles, 'maxParticles', { min: 1, integer: true });

  const engine = createEngine(options);
  const size = engine.getSize();
  const width = size.width || 800;
  const height = size.height || 600;

  const startX = width * config.originX;
  const startY = height * config.originY;
  const effectiveCount = Math.min(config.count, config.maxParticles);

  const pieces = [];
  const baseAngle = -Math.PI / 2; // Upwards
  const halfSpreadRad = degreesToRadians(config.spread / 2);

  for (let i = 0; i < effectiveCount; i++) {
    const angle = baseAngle + randomInRange(-halfSpreadRad, halfSpreadRad);
    const speed = randomInRange(config.minSpeed, config.maxSpeed);
    pieces.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      w: randomInRange(config.minSize, config.maxSize),
      h: randomInRange(config.minSize * 0.4, config.maxSize * 0.7),
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: randomInRange(-0.2, 0.2),
      color: randomChoice(config.colors),
      opacity: 1
    });
  }

  let startTime = null;

  return new Promise((resolve) => {
    engine.setRenderCallback((ctx, w, h, dt, currentTime) => {
      const now = typeof currentTime === "number" && !Number.isNaN(currentTime) ? currentTime : performance.now();
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / config.duration, 1);

      const scale = dt * ENGINE_DEFAULTS.TARGET_FPS;

      for (let i = 0; i < pieces.length; i++) {
        const p = pieces[i];
        p.vy += config.gravity * scale;
        p.x += p.vx * scale;
        p.y += p.vy * scale;
        p.rotation += p.rotationSpeed * scale;
        p.opacity = Math.max(0, 1 - progress);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (progress >= 1) {
        engine.destroy();
        resolve();
      }
    });

    engine.start();
  });
}
