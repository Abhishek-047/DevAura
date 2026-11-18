// Browser visual effects entry point
import { createSnow } from './snow.js';
import { createPetals } from './petals.js';
import { createParticles } from './particles.js';
import { fireConfetti } from './confetti.js';
import { validateString, validateObject } from '../shared/validate.js';

export { createSnow } from './snow.js';
export { createPetals } from './petals.js';
export { createParticles } from './particles.js';
export { fireConfetti } from './confetti.js';
export * from './defaults.js';

export function createEffect(name, options = {}) {
  validateString(name, 'effect name', { allowed: ['snow', 'petals', 'particles'] });
  validateObject(options, 'options');

  switch (name) {
    case 'snow':
      return createSnow(options);
    case 'petals':
      return createPetals(options);
    case 'particles':
      return createParticles(options);
    default:
      throw new RangeError(`[devaura/effects] Unknown effect name "${name}"`);
  }
}
