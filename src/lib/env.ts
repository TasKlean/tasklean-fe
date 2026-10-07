// Validates the environment the app needs before anything reads it, so a
// missing or empty variable crashes at startup with a clear message rather than
// surfacing later as a confusing fetch or session failure. Hand-rolled on
// purpose (no schema library) while the set is this small.

const REQUIRED = ["API_BASE_URL", "SESSION_SECRET", "NEXT_PUBLIC_GOOGLE_CLIENT_ID"] as const;

type RequiredKey = (typeof REQUIRED)[number];

export type Env = Record<RequiredKey, string>;

// Reads and validates from a source (defaults to process.env so it can be
// exercised in tests). Treats whitespace-only as missing, since a blank line in
// .env.local is a mistake, not a value. Reports every missing key at once.
export function readEnv(source: Record<string, string | undefined> = process.env): Env {
  const missing: string[] = [];
  const env = {} as Env;

  for (const key of REQUIRED) {
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

let cached: Env | undefined;

// Memoised accessor for app code. First call validates and throws on a bad
// config; later calls return the same frozen object.
export function getEnv(): Env {
  cached ??= Object.freeze(readEnv());
  return cached;
}
