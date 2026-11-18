// Named, documented default constants for devaura/effects

export const ENGINE_DEFAULTS = Object.freeze({
  Z_INDEX: 9999,
  RESPECT_REDUCED_MOTION: true,
  MAX_PARTICLES: 1000,
  TARGET_FPS: 60,
  FALLBACK_DPR: 1
});

export const SNOW_DEFAULTS = Object.freeze({
  COUNT: 80,
  MIN_SPEED: 0.8,
  MAX_SPEED: 2.2,
  MIN_SIZE: 1.5,
  MAX_SIZE: 4.5,
  COLORS: Object.freeze(['#ffffff', '#f0f4f8']),
  WIND: 0.5,
  OPACITY: 0.85
});

export const PETALS_DEFAULTS = Object.freeze({
  COUNT: 35,
  MIN_SPEED: 1.0,
  MAX_SPEED: 2.5,
  MIN_SIZE: 7.0,
  MAX_SIZE: 14.0,
  COLORS: Object.freeze(['#ffb7c5', '#ff94b8', '#ffccd5']),
  SWAY_AMPLITUDE: 1.2,
  ROTATION_SPEED: 0.02
});

export const PARTICLES_DEFAULTS = Object.freeze({
  COUNT: 60,
  MIN_SPEED: 0.3,
  MAX_SPEED: 1.2,
  MIN_SIZE: 2.0,
  MAX_SIZE: 5.0,
  COLORS: Object.freeze(['#4f46e5', '#06b6d4', '#3b82f6']),
  CONNECT_LINES: true,
  CONNECT_DISTANCE: 120,
  LINE_COLOR: 'rgba(99, 102, 241, 0.15)',
  MOUSE_REPEL: true,
  REPEL_RADIUS: 100,
  REPEL_STRENGTH: 2.0
});

export const CONFETTI_DEFAULTS = Object.freeze({
  COUNT: 120,
  DURATION: 2800,
  SPREAD: 60,
  ORIGIN_X: 0.5,
  ORIGIN_Y: 0.6,
  MIN_SPEED: 4.0,
  MAX_SPEED: 10.0,
  MIN_SIZE: 5.0,
  MAX_SIZE: 10.0,
  GRAVITY: 0.22,
  COLORS: Object.freeze(['#f43f5e', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'])
});
