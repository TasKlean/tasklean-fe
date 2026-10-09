/**
 * Global test setup: jest-dom matchers and the MSW lifecycle.
 */

import "@testing-library/jest-dom/vitest";

import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "@/test/msw";

// Failing on unhandled requests is what stops a stray fetch from quietly
// reaching a real backend or hanging in CI.
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
