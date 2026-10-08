/**
 * Test harness for the whole app. `node` is the default environment because
 * most of what we test is pure logic; a component test opts into jsdom per file
 * with `// @vitest-environment jsdom`.
 */

import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Mirrors tsconfig's `@/*`, so test imports match app imports.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Vitest doesn't resolve React's "react-server" condition, so the real
      // package would hit its deliberate throw. Its own empty.js isn't
      // reachable — not in its exports map — hence a local stub.
      "server-only": fileURLToPath(new URL("./src/test/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // No globals: test files import `describe`/`it`/`expect` from vitest.
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    env: {
      // Non-UTC on purpose: on a UTC machine a naive `new Date(apiString)` is
      // correct by accident, so the timestamp tests would pass against the very
      // bug they exist to catch. Ljubljana also observes DST, so the summer and
      // winter cases differ. src/lib/time.test.ts asserts this pin holds.
      TZ: "Europe/Ljubljana",
    },
  },
});
