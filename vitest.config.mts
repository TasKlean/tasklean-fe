import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Test harness for the whole app. Node is the default environment because most
// of what we test (API client, env, time) is pure; a component test opts into
// jsdom per file with `// @vitest-environment jsdom`.
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirror the `@/*` -> `src/*` alias from tsconfig so imports match the app.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // No globals: test files import `describe`/`it`/`expect` from vitest.
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
