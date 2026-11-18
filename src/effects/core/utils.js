// Math and color utility functions for canvas rendering

export function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

export function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// Smooth, irregular wind gust in the range -1..1 (product of two slow sine waves)
export function gustAt(time, speed) {
  return Math.sin(time * speed) * Math.sin(time * speed * 0.37 + 1.3);
}

export function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

export function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return null;
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r, g, b };
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return { r, g, b };
  }
  return null;
}
