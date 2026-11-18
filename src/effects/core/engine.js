// Shared internal canvas animation engine for browser visual effects
import { ENGINE_DEFAULTS } from '../defaults.js';
import { validateNumber, validateBoolean } from '../../shared/validate.js';

export function createEngine(options = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('[devaura/effects] Effects engine requires a DOM environment (window and document).');
  }

  const zIndex = options.zIndex !== undefined ? options.zIndex : ENGINE_DEFAULTS.Z_INDEX;
  validateNumber(zIndex, 'zIndex', { integer: true });

  const respectReducedMotion = options.respectReducedMotion !== undefined
    ? options.respectReducedMotion
    : ENGINE_DEFAULTS.RESPECT_REDUCED_MOTION;
  validateBoolean(respectReducedMotion, 'respectReducedMotion');

  let canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = String(zIndex);
  document.body.appendChild(canvas);

  let ctx = canvas.getContext('2d');
  let animationFrameId = null;
  let running = false;
  let destroyed = false;
  let lastTime = 0;
  let width = 0;
  let height = 0;
  let dpr = 1;

  let renderCallback = null;

  function resize() {
    if (!canvas) return;
    dpr = window.devicePixelRatio || ENGINE_DEFAULTS.FALLBACK_DPR;
    width = window.innerWidth || (document.documentElement ? document.documentElement.clientWidth : 0);
    height = window.innerHeight || (document.documentElement ? document.documentElement.clientHeight : 0);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    if (ctx && ctx.scale) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
  }

  resize();

  function onResize() {
    resize();
  }

  function onVisibilityChange() {
    if (document.hidden) {
      if (running) {
        pauseLoop();
      }
    } else {
      if (running) {
        resumeLoop();
      }
    }
  }

  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibilityChange);

  function checkReducedMotion() {
    if (!respectReducedMotion) return false;
    if (typeof window.matchMedia === 'function') {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      return Boolean(mql && mql.matches);
    }
    return false;
  }

  function pauseLoop() {
    if (animationFrameId !== null) {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    lastTime = 0;
  }

  function loop(currentTime) {
    if (!running || destroyed) return;

    if (!lastTime) lastTime = currentTime;
    const dt = Math.min((currentTime - lastTime) / 1000, 0.1); // cap max delta time
    lastTime = currentTime;

    if (ctx) {
      ctx.clearRect(0, 0, width, height);
      if (renderCallback) {
        renderCallback(ctx, width, height, dt);
      }
    }

    animationFrameId = window.requestAnimationFrame(loop);
  }

  function resumeLoop() {
    if (!running || destroyed) return;
    if (checkReducedMotion()) {
      return;
    }
    pauseLoop();
    animationFrameId = window.requestAnimationFrame(loop);
  }

  return {
    getCanvas: () => canvas,
    getContext: () => ctx,
    getSize: () => ({ width, height, dpr }),
    setRenderCallback(cb) {
      renderCallback = cb;
    },
    start() {
      if (destroyed || running) return;
      running = true;
      if (!checkReducedMotion()) {
        resumeLoop();
      }
    },
    stop() {
      if (destroyed || !running) return;
      running = false;
      pauseLoop();
      if (ctx) {
        ctx.clearRect(0, 0, width, height);
      }
    },
    destroy() {
      if (destroyed) return;
      running = false;
      destroyed = true;
      pauseLoop();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      canvas = null;
      ctx = null;
      renderCallback = null;
    },
    isRunning: () => running,
    isDestroyed: () => destroyed
  };
}
