/**
 * Stands in for the `server-only` package under Vitest, which doesn't resolve
 * React's `react-server` condition and would otherwise hit that package's
 * deliberate throw. Aliased in `vitest.config.mts`. The production build does
 * apply the condition, so the real guard is unaffected.
 */

export {};
