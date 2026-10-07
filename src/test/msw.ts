// Shared MSW server. Handlers are registered per test with server.use(...);
// lifecycle is wired once in vitest.setup.ts, where unhandled requests are
// configured to fail — so a test that accidentally hits the real network is a
// test failure rather than a silent timeout.
import { setupServer } from "msw/node";

export const server = setupServer();
