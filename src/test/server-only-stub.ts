/**
 * Stands in for `server-only` under Vitest, which doesn't resolve React's
 * `react-server` condition and would hit that package's throw. The production
 * build does apply it, so the real guard is unaffected.
 */

export {};
