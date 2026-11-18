// Pure, environment-neutral input validation helpers

export function validateObject(value, name) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`[devaura] ${name} must be a plain object, received ${typeof value}`);
  }
}

export function validateNumber(value, name, { min = -Infinity, max = Infinity, integer = false } = {}) {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    throw new TypeError(`[devaura] ${name} must be a finite number, received ${value}`);
  }
  if (integer && !Number.isInteger(value)) {
    throw new TypeError(`[devaura] ${name} must be an integer, received ${value}`);
  }
  if (value < min || value > max) {
    throw new RangeError(`[devaura] ${name} must be between ${min} and ${max}, received ${value}`);
  }
}

export function validateBoolean(value, name) {
  if (typeof value !== 'boolean') {
    throw new TypeError(`[devaura] ${name} must be a boolean, received ${typeof value}`);
  }
}

export function validateString(value, name, { allowed = null, allowEmpty = false } = {}) {
  if (typeof value !== 'string') {
    throw new TypeError(`[devaura] ${name} must be a string, received ${typeof value}`);
  }
  if (!allowEmpty && value.trim().length === 0) {
    throw new RangeError(`[devaura] ${name} cannot be empty`);
  }
  if (allowed && !allowed.includes(value)) {
    throw new RangeError(`[devaura] ${name} must be one of [${allowed.join(', ')}], received "${value}"`);
  }
}

export function validateFunction(value, name) {
  if (typeof value !== 'function') {
    throw new TypeError(`[devaura] ${name} must be a function, received ${typeof value}`);
  }
}

export function validateArray(value, name, { minLength = 0 } = {}) {
  if (!Array.isArray(value)) {
    throw new TypeError(`[devaura] ${name} must be an array, received ${typeof value}`);
  }
  if (value.length < minLength) {
    throw new RangeError(`[devaura] ${name} must contain at least ${minLength} items`);
  }
}
