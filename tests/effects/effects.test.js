import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createSnow, createPetals, createParticles, fireConfetti, createEffect } from '../../src/effects/index.js';

describe('devaura/effects tests in simulated DOM', () => {
  let dom;
  let rafCallbacks = [];
  let nextRafId = 1;
  const originalPerformance = global.performance;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      pretendToBeVisual: true,
      url: 'http://localhost'
    });

    global.window = dom.window;
    global.document = dom.window.document;
    if (!global.performance) {
      global.performance = dom.window.performance || originalPerformance;
    }
    global.window.devicePixelRatio = 2;
    global.window.innerWidth = 1024;
    global.window.innerHeight = 768;

    rafCallbacks = [];
    nextRafId = 1;

    global.window.requestAnimationFrame = (cb) => {
      const id = nextRafId++;
      rafCallbacks.push({ id, cb });
      return id;
    };

    global.window.cancelAnimationFrame = (id) => {
      rafCallbacks = rafCallbacks.filter(item => item.id !== id);
    };

    dom.window.HTMLCanvasElement.prototype.getContext = function () {
      return {
        clearRect: () => {},
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        stroke: () => {},
        moveTo: () => {},
        lineTo: () => {},
        bezierCurveTo: () => {},
        save: () => {},
        restore: () => {},
        translate: () => {},
        rotate: () => {},
        scale: () => {},
        setTransform: () => {},
        fillRect: () => {},
        canvas: this
      };
    };

    global.window.matchMedia = (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    });
  });

  afterEach(() => {
    delete global.window;
    delete global.document;
    global.performance = originalPerformance;
  });

  function triggerRaf(time = performance.now()) {
    const current = [...rafCallbacks];
    rafCallbacks = [];
    for (const item of current) {
      item.cb(time);
    }
  }

  it('createSnow starts, updates, stops, and destroys idempotently', () => {
    const snow = createSnow({ count: 50 });
    assert.strictEqual(snow.isRunning(), false);

    snow.start();
    assert.strictEqual(snow.isRunning(), true);
    assert.strictEqual(rafCallbacks.length, 1);

    snow.start();
    assert.strictEqual(snow.isRunning(), true);

    triggerRaf(100);
    assert.strictEqual(rafCallbacks.length, 1);

    snow.update({ wind: 2.0, count: 60 });
    assert.strictEqual(snow.isRunning(), true);

    snow.stop();
    assert.strictEqual(snow.isRunning(), false);
    assert.strictEqual(rafCallbacks.length, 0);

    snow.stop();
    assert.strictEqual(snow.isRunning(), false);

    snow.destroy();
    assert.strictEqual(snow.isRunning(), false);
    snow.destroy();
  });

  it('DOM nodes and listeners are cleaned up after destroy', () => {
    const initialCanvases = document.querySelectorAll('canvas').length;
    const snow = createSnow();
    assert.strictEqual(document.querySelectorAll('canvas').length, initialCanvases + 1);

    snow.destroy();
    assert.strictEqual(document.querySelectorAll('canvas').length, initialCanvases);
  });

  it('respects prefers-reduced-motion when enabled', () => {
    global.window.matchMedia = (query) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addListener: () => {},
      removeListener: () => {}
    });

    const snow = createSnow({ respectReducedMotion: true });
    snow.start();
    assert.strictEqual(rafCallbacks.length, 0);
    snow.destroy();

    const activeSnow = createSnow({ respectReducedMotion: false });
    activeSnow.start();
    assert.strictEqual(rafCallbacks.length, 1);
    activeSnow.destroy();
  });

  it('pauses loop when tab is hidden and resumes when visible', () => {
    const snow = createSnow();
    snow.start();
    assert.strictEqual(rafCallbacks.length, 1);

    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new dom.window.Event('visibilitychange'));
    assert.strictEqual(rafCallbacks.length, 0);

    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new dom.window.Event('visibilitychange'));
    assert.strictEqual(rafCallbacks.length, 1);

    snow.destroy();
  });

  it('validates invalid options and caps max particles', () => {
    assert.throws(() => createSnow({ count: -5 }), RangeError);
    assert.throws(() => createSnow({ minSpeed: 'fast' }), TypeError);
    assert.throws(() => createSnow({ colors: [] }), RangeError);
    assert.throws(() => createSnow({ opacity: 2 }), RangeError);

    const snow = createSnow({ count: 5000, maxParticles: 200 });
    snow.start();
    assert.strictEqual(snow.isRunning(), true);
    snow.destroy();
  });

  it('createPetals and createParticles lifecycle', () => {
    const petals = createPetals({ count: 20 });
    petals.start();
    assert.strictEqual(petals.isRunning(), true);
    petals.stop();
    petals.destroy();

    const particles = createParticles({ count: 30, mouseRepel: true, connectLines: true });
    particles.start();
    assert.strictEqual(particles.isRunning(), true);
    triggerRaf(100);
    particles.destroy();
  });

  it('createEffect factory delegates correctly', () => {
    const snow = createEffect('snow');
    assert.strictEqual(typeof snow.start, 'function');
    snow.destroy();

    assert.throws(() => createEffect('invalid-effect'), RangeError);
  });

  it('fireConfetti returns a Promise that resolves and cleans up', async () => {
    const promise = fireConfetti({ count: 20, duration: 200 });
    assert.strictEqual(typeof promise.then, 'function');

    triggerRaf(performance.now() + 300);
    await promise;
  });
});
