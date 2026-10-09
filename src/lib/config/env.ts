/**
 * Validates the environment variables the app requires, so a missing one fails
 * loudly rather than surfacing later as a confusing fetch or session bug.
 * Hand-rolled rather than schema-based while the set is this small.
 *
 * Server-only: the set includes SESSION_SECRET, and server variables are simply
 * absent in the browser, so a client import would throw about missing config
 * instead of failing the build. A client component that needs the public Google
 * client id takes it as a prop from a Server Component.
 */

import "server-only";

// Declared before the types rather than after, against the usual file order:
// RequiredKey is derived from this array, and Env from RequiredKey, so the chain
// only reads in one direction.
const REQUIRED = ["API_BASE_URL", "SESSION_SECRET", "NEXT_PUBLIC_GOOGLE_CLIENT_ID"] as const;

type RequiredKey = (typeof REQUIRED)[number];

export type Env = Record<RequiredKey, string>;

// Memoised after the first successful read; getEnv() is called on every request.
let cached: Env | undefined;

/**
 * Reads and validates the required variables.
 *
 * @param source Where to read from; defaults to `process.env` so tests can inject a config.
 * @returns Every required variable, trimmed.
 * @throws Error naming all missing variables at once, so one run reveals the whole gap.
 */
export function readEnv(source: Record<string, string | undefined> = process.env): Env {
  const missing: string[] = [];
  const env = {} as Env;

  for (const key of REQUIRED) {
    // Whitespace-only means a blank line in .env.local — a mistake, not a value.
    const value = source[key]?.trim();
    if (!value) {
      missing.push(key);
      continue;
    }
    env[key] = value;
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        `Copy .env.example to .env.local and fill them in.`,
    );
  }

  return env;
}

/**
 * Returns the validated environment, memoised after the first call.
 *
 * @throws Error on the first call when the configuration is incomplete.
 */
export function getEnv(): Env {
  cached ??= Object.freeze(readEnv());
  return cached;
}
