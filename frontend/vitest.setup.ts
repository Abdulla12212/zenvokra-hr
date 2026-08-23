import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Vitest runs with `globals: false`, so `expect`/`describe`/`it` are imported per file.
// Only cross-cutting setup belongs here.
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
