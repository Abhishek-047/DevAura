// Pre-rendered sprites for realistic snowflakes and petals.
// Why sprites? Drawing a soft gradient or a 6-arm snowflake every frame for every flake is slow.
// We draw each look ONCE on a tiny offscreen canvas, then stamp it with drawImage (very cheap).
// If the environment has no real canvas (e.g. tests), these return null and effects fall back to plain shapes.
import { ENGINE_DEFAULTS, SNOW_DEFAULTS, PETALS_DEFAULTS } from '../defaults.js';

const REQUIRED_METHODS = [
  'createRadialGradient', 'createLinearGradient', 'closePath',
  'lineTo', 'stroke', 'fill', 'beginPath', 'moveTo', 'bezierCurveTo',
  'save', 'restore', 'translate', 'rotate', 'scale', 'arc'
];

function createSpriteContext() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  const size = ENGINE_DEFAULTS.SPRITE_SIZE;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  for (const method of REQUIRED_METHODS) {
    if (typeof ctx[method] !== 'function') return null;
  }
  return { canvas, ctx, size };
}

// Shared by the sprite builder and the plain fallback drawing (uses only basic path methods).
// Unit-space petal: x in [-0.6, 0.6], y in [-0.5, 0.5], with a small notch at the tip (like sakura).
export function tracePetalPath(ctx) {
  ctx.moveTo(0, 0.5);
  ctx.bezierCurveTo(-0.62, 0.32, -0.66, -0.38, -0.14, -0.5);
  ctx.bezierCurveTo(-0.07, -0.4, 0.07, -0.4, 0.14, -0.5);
  ctx.bezierCurveTo(0.66, -0.38, 0.62, 0.32, 0, 0.5);
}

function applyAlphaMask(ctx, size, stops) {
  const half = size / 2;
  const mask = ctx.createRadialGradient(half, half, 0, half, half, half);
  for (const [position, alpha] of stops) {
    mask.addColorStop(position, `rgba(0, 0, 0, ${alpha})`);
  }
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = mask;
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = 'source-over';
}

function drawRoundSprite(ctx, size, color, stops) {
  const half = size / 2;
  ctx.beginPath();
  ctx.arc(half, half, half, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  if (typeof ctx.fillRect === 'function') applyAlphaMask(ctx, size, stops);
}

function drawClassicSprite(ctx, size, color) {
  const half = size / 2;
  const arm = half * SNOW_DEFAULTS.CLASSIC_ARM_LENGTH;
  ctx.save();
  ctx.translate(half, half);
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = size * SNOW_DEFAULTS.CLASSIC_LINE_WIDTH;
  for (let i = 0; i < SNOW_DEFAULTS.CLASSIC_ARMS; i++) {
    ctx.rotate((Math.PI * 2) / SNOW_DEFAULTS.CLASSIC_ARMS);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -arm);
    for (const branch of SNOW_DEFAULTS.CLASSIC_BRANCHES) {
      const y = -arm * branch.at;
      const reach = arm * branch.length;
      ctx.moveTo(0, y);
      ctx.lineTo(-reach, y - reach);
      ctx.moveTo(0, y);
      ctx.lineTo(reach, y - reach);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/** style: 'soft' | 'dot' | 'classic'. Returns a canvas or null. */
export function createSnowSprite(style, color) {
  try {
    const parts = createSpriteContext();
    if (!parts) return null;
    const { canvas, ctx, size } = parts;
    if (style === 'classic') {
      drawClassicSprite(ctx, size, color);
    } else {
      const stops = style === 'soft' ? SNOW_DEFAULTS.SOFT_STOPS : SNOW_DEFAULTS.DOT_STOPS;
      drawRoundSprite(ctx, size, color, stops);
    }
    return canvas;
  } catch (err) {
    return null;
  }
}

export function createPetalSprite(color) {
  try {
    const parts = createSpriteContext();
    if (!parts) return null;
    const { canvas, ctx, size } = parts;
    const P = PETALS_DEFAULTS;
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.scale(size * P.SPRITE_WIDTH, size * P.SPRITE_HEIGHT);
    ctx.beginPath();
    tracePetalPath(ctx);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    // Soft shading: darker at the base, lighter toward the tip
    const shade = ctx.createLinearGradient(0, 0.5, 0, -0.5);
    shade.addColorStop(0, P.BASE_SHADOW);
    shade.addColorStop(0.35, 'rgba(255, 255, 255, 0)');
    shade.addColorStop(1, P.TIP_HIGHLIGHT);
    ctx.fillStyle = shade;
    ctx.fill();
    // Thin center vein
    ctx.beginPath();
    ctx.moveTo(0, 0.42);
    ctx.lineTo(0, -0.28);
    ctx.lineWidth = P.VEIN_WIDTH;
    ctx.strokeStyle = P.VEIN_COLOR;
    ctx.stroke();
    ctx.restore();
    return canvas;
  } catch (err) {
    return null;
  }
}
