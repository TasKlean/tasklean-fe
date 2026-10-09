/**
 * Global test setup: jest-dom matchers and the MSW lifecycle.
 */

import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "@/test/msw";

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
