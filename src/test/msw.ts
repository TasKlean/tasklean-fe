/**
 * Shared MSW server. Handlers are registered per test with `server.use()`;
 * the lifecycle is wired once in `vitest.setup.ts`.
 */

import { setupServer } from "msw/node";

export const server = setupServer();
