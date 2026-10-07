// Registers jest-dom matchers (toBeInTheDocument, etc.) on vitest's `expect`.
// Harmless under the node environment; needed once component tests run in jsdom.
import "@testing-library/jest-dom/vitest";

import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "@/test/msw";

// `onUnhandledRequest: "error"` makes an unmocked request fail the test instead
// of reaching the network, which is what stops a stray fetch from quietly
// passing CI or hanging on a real backend.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
