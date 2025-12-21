import { Buffer } from 'buffer';

// Make Buffer available before any other module executes (needed by zeldwallet bundle).
if (!(globalThis as { Buffer?: typeof Buffer }).Buffer) {
  (globalThis as { Buffer: typeof Buffer }).Buffer = Buffer;
}

