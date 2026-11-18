import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createSnow, createParticles } from '../../src/effects/index.js';

describe('Deep edge cases for effects', () => {
  it('handles zero, negative, and NaN inputs strictly', () => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    global.performance = dom.window.performance;
    global.window.devicePixelRatio = 1;
    global.window.requestAnimationFrame = () => 1;
    global.window.cancelAnimationFrame = () => {};

    dom.window.HTMLCanvasElement.prototype.getContext = () => ({
      clearRect: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      scale: () => {},
      setTransform: () => {},
      fillRect: () => {}
    });

    assert.throws(() => createSnow({ count: NaN }), TypeError);
    assert.throws(() => createSnow({ minSpeed: -1 }), RangeError);
    assert.throws(() => createSnow({ minSpeed: 5, maxSpeed: 2 }), RangeError);

    const snow = createSnow({ count: 0 });
    snow.start();
    snow.update({ count: 10 });
    snow.destroy();

    // Destroy then start
    const snow2 = createSnow();
    snow2.destroy();
    snow2.start(); // Should be no-op safely
    assert.strictEqual(snow2.isRunning(), false);

    // Resize during animation
    const particles = createParticles();
    particles.start();
    dom.window.innerWidth = 1920;
    dom.window.innerHeight = 1080;
    dom.window.dispatchEvent(new dom.window.Event('resize'));
    particles.destroy();

    delete global.window;
    delete global.document;
  });
});
