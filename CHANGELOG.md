# Changelog

All notable changes to the `devaura` package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-11-18

### Added
- **`devaura/effects` module**:
  - Zero-dependency canvas visual effects engine (`core/engine.js`).
  - High-performance, delta-time animation loop using `requestAnimationFrame`.
  - Automatic pause on hidden browser tabs (`document.hidden`).
  - Accessibility awareness: built-in support for `prefers-reduced-motion`.
  - Full lifecycle cleanup for canvas elements, event listeners, and animation frames.
  - Public effect creators: `createSnow`, `createPetals`, `createParticles`, and `fireConfetti`.
  - Dynamic factory function: `createEffect(name, options)`.
  - Bundled distribution in ESM, CJS, and minified IIFE (`dist/devaura-effects.iife.min.js`).

- **`devaura/server` module**:
  - Express and raw `http.ServerResponse` envelope helpers: `success`, `created`, `error`, and `notFound`.
  - Configurable logger with log level filtering, ISO timestamps, and TTY/NO_COLOR color formatting.
  - Operational error handler middleware and `AppError` class with dev vs production stack filtering.
  - Bounded in-memory request monitor middleware with latency statistics and ring buffer history.
  - Pre-built stats route handler (`statsHandler()`).

- **Architecture & Tooling**:
  - Hand-crafted TypeScript declaration files (`.d.ts` and `.d.cts`).
  - Dual ESM/CJS conditional package exports.
  - Environment separation verification ensuring zero DOM leaks in server and zero Node built-ins in effects.
