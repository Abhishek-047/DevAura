// Type definitions for devaura/effects

export interface BaseEffectOptions {
  zIndex?: number;
  respectReducedMotion?: boolean;
  maxParticles?: number;
}

export interface SnowOptions extends BaseEffectOptions {
  count?: number;
  minSpeed?: number;
  maxSpeed?: number;
  minSize?: number;
  maxSize?: number;
  colors?: string[];
  wind?: number;
  opacity?: number;
}

export interface PetalsOptions extends BaseEffectOptions {
  count?: number;
  minSpeed?: number;
  maxSpeed?: number;
  minSize?: number;
  maxSize?: number;
  colors?: string[];
  swayAmplitude?: number;
  rotationSpeed?: number;
}

export interface ParticlesOptions extends BaseEffectOptions {
  count?: number;
  minSpeed?: number;
  maxSpeed?: number;
  minSize?: number;
  maxSize?: number;
  colors?: string[];
  connectLines?: boolean;
  connectDistance?: number;
  lineColor?: string;
  mouseRepel?: boolean;
  repelRadius?: number;
  repelStrength?: number;
}

export interface ConfettiOptions extends BaseEffectOptions {
  count?: number;
  duration?: number;
  spread?: number;
  originX?: number;
  originY?: number;
  minSpeed?: number;
  maxSpeed?: number;
  minSize?: number;
  maxSize?: number;
  gravity?: number;
  colors?: string[];
}

export interface EffectController<T = any> {
  start(): void;
  stop(): void;
  destroy(): void;
  isRunning(): boolean;
  update(options: Partial<T>): void;
}

export function createSnow(options?: SnowOptions): EffectController<SnowOptions>;
export function createPetals(options?: PetalsOptions): EffectController<PetalsOptions>;
export function createParticles(options?: ParticlesOptions): EffectController<ParticlesOptions>;
export function fireConfetti(options?: ConfettiOptions): Promise<void>;

export function createEffect(
  name: 'snow' | 'petals' | 'particles',
  options?: SnowOptions | PetalsOptions | ParticlesOptions
): EffectController;

export const ENGINE_DEFAULTS: {
  readonly Z_INDEX: number;
  readonly RESPECT_REDUCED_MOTION: boolean;
  readonly MAX_PARTICLES: number;
  readonly TARGET_FPS: number;
  readonly FALLBACK_DPR: number;
};

export const SNOW_DEFAULTS: {
  readonly COUNT: number;
  readonly MIN_SPEED: number;
  readonly MAX_SPEED: number;
  readonly MIN_SIZE: number;
  readonly MAX_SIZE: number;
  readonly COLORS: readonly string[];
  readonly WIND: number;
  readonly OPACITY: number;
};

export const PETALS_DEFAULTS: {
  readonly COUNT: number;
  readonly MIN_SPEED: number;
  readonly MAX_SPEED: number;
  readonly MIN_SIZE: number;
  readonly MAX_SIZE: number;
  readonly COLORS: readonly string[];
  readonly SWAY_AMPLITUDE: number;
  readonly ROTATION_SPEED: number;
};

export const PARTICLES_DEFAULTS: {
  readonly COUNT: number;
  readonly MIN_SPEED: number;
  readonly MAX_SPEED: number;
  readonly MIN_SIZE: number;
  readonly MAX_SIZE: number;
  readonly COLORS: readonly string[];
  readonly CONNECT_LINES: boolean;
  readonly CONNECT_DISTANCE: number;
  readonly LINE_COLOR: string;
  readonly MOUSE_REPEL: boolean;
  readonly REPEL_RADIUS: number;
  readonly REPEL_STRENGTH: number;
};

export const CONFETTI_DEFAULTS: {
  readonly COUNT: number;
  readonly DURATION: number;
  readonly SPREAD: number;
  readonly ORIGIN_X: number;
  readonly ORIGIN_Y: number;
  readonly MIN_SPEED: number;
  readonly MAX_SPEED: number;
  readonly MIN_SIZE: number;
  readonly MAX_SIZE: number;
  readonly GRAVITY: number;
  readonly COLORS: readonly string[];
};
