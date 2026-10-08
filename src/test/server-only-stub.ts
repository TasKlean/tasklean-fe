// Stands in for the `server-only` package under Vitest.
//
// That package deliberately throws unless resolved under React's "react-server"
// condition, which Vitest doesn't apply — so importing any server module in a
// test would fail. Aliased in vitest.config.mts. The real guard is unaffected:
// the production build does apply that condition, so importing a server-only
// module into a client bundle is still a build error.
export {};
