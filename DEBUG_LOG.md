# Debug Log - DevAura

## Autonomous Test-and-Fix Loop Records

### 1. Attw Tarball Untar Failure in Core Package
- **Symptom**: Running `attw --pack .` threw `Cannot read properties of undefined (reading 'filename')`.
- **Root Cause**: In `@arethetypeswrong/core` `createPackage.js`, `Gunzip` chunk handler was setting `unzipped = chunk` directly, which only stored the last chunk from fflate streaming instead of accumulating all chunks. Because npm pack tarballs split across multiple chunks, `unzipped` had 0 or partial bytes, making `untar()` return an empty array `[]`. Accessing `data[0].filename` failed.
- **Fix**: Patched `@arethetypeswrong/core/dist/createPackage.js` to collect all decompressed chunks into an array and merge them into a single `Uint8Array` before invoking `untar()`.

### 2. Dual-Package Typing Resolution (CJS vs ESM)
- **Symptom**: `attw` reported `Masquerading as ESM` for `node16 (from CJS)` because both require and import pointed to `.d.ts` which Node16 interprets as ESM type declaration.
- **Root Cause**: Node 16 module resolution requires `.d.cts` for CommonJS entries and `.d.ts` for ES module entries.
- **Fix**: Generated `types/effects.d.cts` and `types/server.d.cts` and updated `package.json` exports map:
  ```json
  "types": {
    "import": "./types/effects.d.ts",
    "require": "./types/effects.d.cts"
  }
  ```

### 3. JSDOM Global Performance Mocking in Unit Tests
- **Symptom**: Effects unit tests failed with `ReferenceError: performance is not defined` after the first test passed.
- **Root Cause**: `afterEach` deleted `global.performance`, but Node's native `performance` or subsequent JSDOM window instantiation needed `global.performance` defined.
- **Fix**: Preserved the original global performance object (`const originalPerformance = global.performance;`) and restored it in `afterEach`.

### 4. Sandbox Network Socket Blocking for Integration Tests
- **Symptom**: Express integration tests trying to connect to `127.0.0.1:PORT` threw `connect EPERM 127.0.0.1`.
- **Root Cause**: The runner terminal sandbox blocks arbitrary local loopback TCP socket connections unless unsandboxed.
- **Fix**: Retained a direct socket test for verification outside sandbox, and structured the standard test suite to test real Express request handling directly through Express's internal `app.handle(req, res)` pipeline using Node's `http.IncomingMessage` and `http.ServerResponse`, ensuring 100% reproducible execution in sandboxed environments without flaky port collisions or socket permission issues.

### 5. Pack Smoke Test JSDOM Dependency Isolation
- **Symptom**: `smoke-iife.js` inside temp directory threw `ERR_MODULE_NOT_FOUND: Cannot find package 'jsdom'`.
- **Root Cause**: The temp directory created for testing the packed tarball did not have `jsdom` in its local `node_modules` (as intended to verify a clean consumer environment).
- **Fix**: Used Node's built-in `node:vm` context to evaluate the IIFE minified bundle (`dist/devaura-effects.iife.min.js`) and assert the `DevAura` global object without requiring external packages.
