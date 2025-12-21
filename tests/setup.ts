/**
 * Test Setup
 * 
 * Configure the test environment with necessary polyfills.
 */

import 'fake-indexeddb/auto';

// Make crypto available in test environment
if (typeof globalThis.crypto === 'undefined') {
  // @ts-ignore
  globalThis.crypto = require('crypto').webcrypto;
}

// Make window available for WBIP provider tests
if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = globalThis;
}

