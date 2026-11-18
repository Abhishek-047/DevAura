// Floating interactive particles visual effect implementation
import { PARTICLES_DEFAULTS, ENGINE_DEFAULTS } from './defaults.js';
import { createEngine } from './core/engine.js';
import { randomInRange, randomChoice } from './core/utils.js';
import { validateNumber, validateArray, validateBoolean, validateString, validateObject } from '../shared/validate.js';

export function createParticles(options = {}) {
  validateObject(options, 'options');

  let config = {
    count: options.count !== undefined ? options.count : PARTICLES_DEFAULTS.COUNT,
    minSpeed: options.minSpeed !== undefined ? options.minSpeed : PARTICLES_DEFAULTS.MIN_SPEED,
    maxSpeed: options.maxSpeed !== undefined ? options.maxSpeed : PARTICLES_DEFAULTS.MAX_SPEED,
    minSize: options.minSize !== undefined ? options.minSize : PARTICLES_DEFAULTS.MIN_SIZE,
    maxSize: options.maxSize !== undefined ? options.maxSize : PARTICLES_DEFAULTS.MAX_SIZE,
    colors: options.colors !== undefined ? options.colors : PARTICLES_DEFAULTS.COLORS,
    connectLines: options.connectLines !== undefined ? options.connectLines : PARTICLES_DEFAULTS.CONNECT_LINES,
    connectDistance: options.connectDistance !== undefined ? options.connectDistance : PARTICLES_DEFAULTS.CONNECT_DISTANCE,
    lineColor: options.lineColor !== undefined ? options.lineColor : PARTICLES_DEFAULTS.LINE_COLOR,
    mouseRepel: options.mouseRepel !== undefined ? options.mouseRepel : PARTICLES_DEFAULTS.MOUSE_REPEL,
    repelRadius: options.repelRadius !== undefined ? options.repelRadius : PARTICLES_DEFAULTS.REPEL_RADIUS,
    repelStrength: options.repelStrength !== undefined ? options.repelStrength : PARTICLES_DEFAULTS.REPEL_STRENGTH,
    maxParticles: options.maxParticles !== undefined ? options.maxParticles : ENGINE_DEFAULTS.MAX_PARTICLES
  };

  function validateConfig(c) {
    validateNumber(c.count, 'count', { min: 0, integer: true });
    validateNumber(c.minSpeed, 'minSpeed', { min: 0 });
    validateNumber(c.maxSpeed, 'maxSpeed', { min: c.minSpeed });
    validateNumber(c.minSize, 'minSize', { min: 0.1 });
    validateNumber(c.maxSize, 'maxSize', { min: c.minSize });
    validateArray(c.colors, 'colors', { minLength: 1 });
    validateBoolean(c.connectLines, 'connectLines');
    validateNumber(c.connectDistance, 'connectDistance', { min: 0 });
    validateString(c.lineColor, 'lineColor');
    validateBoolean(c.mouseRepel, 'mouseRepel');
    validateNumber(c.repelRadius, 'repelRadius', { min: 0 });
    validateNumber(c.repelStrength, 'repelStrength', { min: 0 });
    validateNumber(c.maxParticles, 'maxParticles', { min: 1, integer: true });
  }

  validateConfig(config);

  const engine = createEngine(options);
  let particles = [];
  let mouse = { x: -9999, y: -9999 };

  function onMouseMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }

  function onMouseLeave() {
    mouse.x = -9999;
    mouse.y = -9999;
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseout', onMouseLeave);
  }

  function initParticles(width, height) {
    const effectiveCount = Math.min(config.count, config.maxParticles);
    particles = [];
    for (let i = 0; i < effectiveCount; i++) {
      const speed = randomInRange(config.minSpeed, config.maxSpeed);
      const angle = Math.random() * Math.PI * 2;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: randomInRange(config.minSize, config.maxSize),
        color: randomChoice(config.colors)
      });
    }
  }

  const initialSize = engine.getSize();
  initParticles(initialSize.width || 800, initialSize.height || 600);

  engine.setRenderCallback((ctx, width, height, dt) => {
    const scale = dt * ENGINE_DEFAULTS.TARGET_FPS;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Mouse repel logic
      if (config.mouseRepel && mouse.x > 0 && mouse.y > 0) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < config.repelRadius && dist > 0) {
          const force = (1 - dist / config.repelRadius) * config.repelStrength;
          p.x += (dx / dist) * force * scale;
          p.y += (dy / dist) * force * scale;
        }
      }

      p.x += p.vx * scale;
      p.y += p.vy * scale;

      // Bounce at canvas boundaries
      if (p.x < p.size) {
        p.x = p.size;
        p.vx *= -1;
      } else if (p.x > width - p.size) {
        p.x = width - p.size;
        p.vx *= -1;
      }
      if (p.y < p.size) {
        p.y = p.size;
        p.vy *= -1;
      } else if (p.y > height - p.size) {
        p.y = height - p.size;
        p.vy *= -1;
      }

      // Draw particle dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }

    // Connect lines
    if (config.connectLines && particles.length > 1) {
      const maxDistSq = config.connectDistance * config.connectDistance;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distSq = dx * dx + dy * dy;
          if (distSq < maxDistSq) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = config.lineColor;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
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
      if (typeof window !== 'undefined') {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseout', onMouseLeave);
      }
      engine.destroy();
      particles = [];
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
      initParticles(size.width || 800, size.height || 600);
    }
  };
}
