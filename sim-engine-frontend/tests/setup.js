/**
 * Jest Setup File
 *
 * Global test setup and configuration
 */

import '@testing-library/jest-dom';

// Mock fetch globally
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};

// Custom matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();

  // Clean up DOM
  document.body.innerHTML = '';
});

// Performance mock for tests that use performance.now()
if (!global.performance) {
  global.performance = {
    now: jest.fn(() => Date.now())
  };
}

// AbortController mock for timeout tests
if (!global.AbortController) {
  global.AbortController = class AbortController {
    constructor() {
      this.signal = {
        aborted: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
    }
    abort() {
      this.signal.aborted = true;
    }
  };
}

