// Named, documented default constants for devaura/effects

export const ENGINE_DEFAULTS = Object.freeze({
  Z_INDEX: 9999,
  RESPECT_REDUCED_MOTION: true,
  MAX_PARTICLES: 1000,
  TARGET_FPS: 60,
  FALLBACK_DPR: 1,
  // Pixel size of the pre-rendered flake/petal sprites (drawn once, reused every frame)
  SPRITE_SIZE: 128
});

// Flake styles a user can pick. "mixed" chooses a style per flake based on its depth.
export const SNOW_FLAKE_STYLES = Object.freeze(['mixed', 'classic', 'soft', 'dot']);

export const SNOW_DEFAULTS = Object.freeze({
  COUNT: 140,
  MIN_SPEED: 0.5,
  MAX_SPEED: 2.4,
  MIN_SIZE: 1.2,
  MAX_SIZE: 5.5,
  COLORS: Object.freeze(['#ffffff', '#eef4ff', '#dbe8ff']),
  WIND: 0.3,
  OPACITY: 0.95,
  FLAKE: 'mixed',
  // Gusts: slow, global, smoothly changing sideways push (near flakes feel it more)
  GUST_STRENGTH: 0.6,
  GUST_SPEED: 0.35,
  // Small side-to-side wobble of every flake
  WOBBLE_AMPLITUDE: 0.35,
  MIN_WOBBLE_SPEED: 0.01,
  MAX_WOBBLE_SPEED: 0.035,
  // Depth: 0 = far (small, slow, soft, faint), 1 = near (big, fast, sharp, bright)
  DEPTH_BIAS: 1.6,
  MIN_DEPTH_OPACITY: 0.35,
  MIN_DEPTH_WIND: 0.4,
  SPEED_JITTER: 0.15,
  // How "mixed" mode picks a style from depth
  SOFT_DEPTH_MAX: 0.4,
  CLASSIC_DEPTH_MIN: 0.65,
  CLASSIC_CHANCE: 0.55,
  MID_SOFT_CHANCE: 0.5,
  // Sprite draw scales (relative to flake diameter)
  SOFT_SCALE: 2.2,
  CLASSIC_SCALE: 1.7,
  CLASSIC_MIN_DRAW_SIZE: 7,
  SPIN_SPEED: 0.012,
  // Pre-rendered sprite look
  SOFT_STOPS: Object.freeze([[0, 1], [0.35, 0.6], [1, 0]]),
  DOT_STOPS: Object.freeze([[0, 1], [0.6, 1], [1, 0]]),
  CLASSIC_LINE_WIDTH: 0.045,
  CLASSIC_ARM_LENGTH: 0.9,
  CLASSIC_BRANCHES: Object.freeze([
    Object.freeze({ at: 0.45, length: 0.22 }),
    Object.freeze({ at: 0.7, length: 0.15 })
  ]),
  CLASSIC_ARMS: 6
});

export const PETALS_DEFAULTS = Object.freeze({
  COUNT: 45,
  MIN_SPEED: 0.6,
  MAX_SPEED: 1.8,
  MIN_SIZE: 5.0,
  MAX_SIZE: 12.0,
  COLORS: Object.freeze(['#ffc2d1', '#ffb3c6', '#ffa6c1', '#ff8fab', '#ffe5ec']),
  SWAY_AMPLITUDE: 1.0,
  ROTATION_SPEED: 0.02,
  WIND: 0.6,
  GUST_STRENGTH: 0.8,
  GUST_SPEED: 0.3,
  // Depth works the same way as snow
  DEPTH_BIAS: 1.3,
  MIN_DEPTH_OPACITY: 0.5,
  MIN_DEPTH_WIND: 0.5,
  SPEED_JITTER: 0.2,
  // 3D tumble: the petal flips around its long axis
  MIN_FLIP_SPEED: 0.02,
  MAX_FLIP_SPEED: 0.07,
  MIN_FLIP_SCALE: 0.15,
  MIN_SHADE: 0.65,
  TILT_AMOUNT: 0.6,
  MIN_SWAY_FREQUENCY: 0.015,
  MAX_SWAY_FREQUENCY: 0.035,
  DRAW_SCALE: 2.0,
  // Petal sprite look (unit-space shading gradient, see core/sprites.js)
  SPRITE_WIDTH: 0.78,
  SPRITE_HEIGHT: 0.95,
  BASE_SHADOW: 'rgba(0, 0, 0, 0.18)',
  TIP_HIGHLIGHT: 'rgba(255, 255, 255, 0.45)',
  VEIN_COLOR: 'rgba(255, 255, 255, 0.35)',
  VEIN_WIDTH: 0.02
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
