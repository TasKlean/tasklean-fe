/**
 * Global test setup: jest-dom matchers and the MSW lifecycle.
 */

import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "@/test/msw";

// jsdom implements no ResizeObserver, and a component that measures itself
// would throw on mount. It never fires, so a measured size stays absent.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Failing on unhandled requests is what stops a stray fetch from quietly
// reaching a real backend or hanging in CI.
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => {
  server.resetHandlers();
  // Testing Library only auto-registers this when Vitest globals are on, and
  // ours are off, so renders would otherwise stack up across tests.
  cleanup();
});
afterAll(() => server.close());
