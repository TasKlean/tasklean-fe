# CLAUDE.md

TasKlean frontend — a Next.js + TailwindCSS web app (also installable as a PWA) consuming the
TasKlean REST API.

For product scope, architecture decisions and the running notes on what we're building and why, see
[PROJECT_BIBLE.md](PROJECT_BIBLE.md).

**Backend lives in a sibling repo**: `../tasklean-be`. Pull it into a session with
`/add-dir ../tasklean-be` when you need to read it. Its `PROJECT_BIBLE.md` is authoritative on **API
behaviour**; its `docs/openapi.json` is authoritative on **API shapes**. Never restate backend
internals here — link to them.

## How this file works

**It describes what exists, not what is planned.** Add to it when you add the thing it describes — a
script, a directory, a convention we actually adopted — in the same change. Plans and open questions
go in the bible, not here.

## Status

**Phase 1 in progress — the test harness and env validation exist; the API layer and session do
not.** Next.js 16.3.8 (App Router, Turbopack), React 19.2, TypeScript strict, Tailwind 4, ESLint,
Prettier, Vitest + MSW. `src/app` holds placeholder routes only; `src/lib` holds `env.ts`, `time.ts`
and the `api/` client. There is no session handling yet. The phases and what each one is for are in
[the roadmap](PROJECT_BIBLE.md#roadmap).

**Node 26** (`.nvmrc`, and `engines.node` in `package.json`). Node 26 becomes Active LTS on
2026-10-28; we adopted it a few weeks early so the project sits on one release line for its whole
life rather than migrating a month in. `@types/node` tracks the Node major (`^26`) — Vitest also
requires `>=22`, so the old `^20` pin no longer resolves.

**npm comes from Node's bundled copy, deliberately** — there is no globally installed npm, so the
npm version tracks the Node version. Note that Node's `npm` shim prefers a _globally installed_ npm
over the bundled one when both exist, so if `npm -v` ever disagrees with the version in
`C:\Program Files\nodejs\node_modules\npm\package.json`, something has run `npm install -g npm`.

## Quick reference

```bash
npm run dev            # Dev server on :3000 (the origin the backend's CORS allows by default)
npm run build          # Production build
npm run start          # Serve the production build
npm run lint           # ESLint
npm run typecheck      # next typegen && tsc --noEmit
npm test               # Vitest, single run
npm run test:watch     # Vitest, watch mode
npm run format         # Prettier, write
npm run format:check   # Prettier, check only
```

`typecheck` runs `next typegen` first on purpose: Next 16 generates global route types
(`LayoutProps`, `PageProps`) into `.next/types`, so a bare `tsc --noEmit` fails on a clean checkout.

Prettier does not touch `*.md` (see `.prettierignore`) — it re-pads tables on every edit, which
makes diffs in these docs noisy.

### Tests

Config is `vitest.config.mts` with `vitest.setup.ts`. Tests sit next to the code they cover as
`*.test.ts(x)` under `src/`.

- **The default environment is `node`**, because most of what we test is pure logic (env, the API
  client, the time module). A component test opts into jsdom per file with
  `// @vitest-environment jsdom` on the first line.
- **No globals** — import `describe`/`it`/`expect` from `vitest`. Turning globals on would mean
  adding `vitest/globals` to `tsconfig`'s `types`, which switches that field from "all `@types`
  packages" to "only these", so it has to list everything else too. Explicit imports avoid that.
- The `@/*` → `src/*` alias is mirrored in the Vitest config, so test imports match app imports.
- `vitest.setup.ts` registers jest-dom matchers on `expect` — harmless under `node`, needed once
  component tests run in jsdom.
- **HTTP is mocked at the network boundary with MSW**, not by stubbing our own modules, so the API
  client is exercised against real envelope payloads. The shared server is `src/test/msw.ts`, its
  lifecycle is wired in `vitest.setup.ts`, and handlers are registered per test with `server.use()`.
  Unhandled requests **fail the test** (`onUnhandledRequest: "error"`) so a stray fetch can't quietly
  reach the network.
- **The suite runs in a pinned non-UTC timezone** (`test.env.TZ = "Europe/Ljubljana"` in
  `vitest.config.mts`). On a UTC machine — most CI — a naive `new Date(apiString)` is right by
  accident, so the timestamp tests would pass against the very bug they exist to catch.
  `src/lib/time.test.ts` asserts the pin is in effect; don't change the zone without reading it.

### Generated files

- **`AGENTS.md`** — written and re-added by `next dev`; it points agents at the Next.js docs bundled
  in `node_modules`. **Leave it in place.** `writeAgentFiles` only skips CLAUDE.md while `AGENTS.md`
  exists and hosts its marker block — delete `AGENTS.md` and Next writes that block into CLAUDE.md
  instead.
- **`next-env.d.ts`** and `.next/types` — generated, gitignored, never hand-edited.

### Known install noise

- **5 "high" npm audit findings** all trace to `braces` → `micromatch` → `fast-glob` →
  `@next/eslint-plugin-next`. That is a devDependency chain feeding ESLint's glob matching, it never
  sees untrusted input and never ships to the browser. `npm audit fix --force` would downgrade
  `eslint-config-next` to 14.x on a Next 16 project, so **leave it**.
- **`unrs-resolver`'s postinstall is denied** (`allowScripts` in `package.json`). ESLint runs clean
  without it; the denial is committed so no future install silently approves it.

### Running against a backend

| Target           | `API_BASE_URL`          | Notes                                                                                                                                                                                                             |
| ---------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local backend    | `http://localhost:8080` | Needs `docker-compose up -d` + `./mvnw spring-boot:run` in `../tasklean-be`. Dev profile seeds data and issues **1-year** access tokens, so token refresh never fires locally — **test refresh against staging**. |
| Staging (Render) | _not recorded yet_      | Prod profile: 15-minute access tokens, no seed data, Swagger disabled.                                                                                                                                            |

Swagger UI for poking at the API by hand (local backend only, disabled in staging/prod):
http://localhost:8080/swagger-ui.html

## Consuming the API

These are the rules a client of _this_ backend has to follow. They are consequences of the backend's
design, not preferences — breaking them produces bugs that look like backend bugs. They apply from
the first line of fetching code we write.

- **Every response is an envelope.** Success and failure both return
  `{ success: boolean, message: string | null, data: T | null }`. `src/lib/api/client.ts` unwraps it
  and returns `data`, throwing `ApiError` (status + message) otherwise. **Nothing above that module
  should ever see the envelope.** Note that no field is marked `required` in `openapi.json`, so the
  client narrows rather than trusting the shape. Error responses use it too — the backend renders even a 404 on an unknown
  route and a 429 from the rate limiter as this JSON, never HTML — so parsing can be unconditional.
- **Never branch on the exact 2xx code.** POSTs really return `201` while the spec declares `200`
  (springdoc doesn't read `ResponseEntity.status(...)`). Treat any 2xx as success.
- **`uid` vs `id` is not interchangeable.** `User`, `Group` and `Task` are addressed in URLs by their
  opaque string `uid`. Everything else — category, tag, group member, device, task completion,
  notification — is addressed by its numeric `id`. Response payloads are flat: foreign keys come back
  as numeric ids, _never_ nested objects, so a task's `categoryId` is a `number` while the task
  itself is fetched at `/api/tasks/{uid}`.
- **`assignedToId` / `createdById` / `groupMemberId` are GroupMember ids, not User ids.** A user acts
  inside a group through their membership, so these are a _third_ id namespace. To create or assign a
  task you need your own `GroupMember.id` for that group — resolve it from
  `GET /api/group-members?groupId=` matched against `GET /api/users/me`. Name variables accordingly
  (`memberId`, never `userId`, when it's a membership).
- **All timestamps are UTC with no zone marker.** The API returns `date-time` strings from
  `TIMESTAMP WITHOUT TIME ZONE` columns the backend guarantees are UTC. They parse as _local_ time if
  handled naively. Every conversion goes through `src/lib/time.ts` — `parseApiDate` /
  `parseApiDateOrNull` on the way in, `toApiDate` on the way out. Never `new Date(apiString)`
  directly; never send a local time back. **Writing back takes no `Z` either**: the backend's DTOs
  are `LocalDateTime` with no Jackson config, so it parses with `ISO_LOCAL_DATE_TIME`, which accepts
  no zone marker at all. (`TaskRequest.nextDueDate` is currently the only writable date-time field.)
- **`401` and `403` get different handling.** `401` = no/expired/invalid token → one silent refresh
  attempt, and on failure clear the session and go to `/login`. `403` = authenticated but not allowed
  → show a permission message, **never** log out and never retry. The spec cannot say which endpoints
  need which role, so a `403` is always a runtime discovery.
- **`429` is real and carries `Retry-After`.** The backend rate-limits per user _and_ per IP, plus a
  tighter bucket on `POST /api/groups/join`. Show the retry window; never auto-retry in a loop.
- **List endpoints require a scope parameter.** `?groupId=` for tasks, categories, tags, group members
  and audit logs; `?userId=` for devices and notifications; `?taskId=` for task completions. A missing
  one is a `400`, not an empty list.
- **No pagination, sorting or server-side filtering exists.** List endpoints return everything. Filter
  and sort on the client, keeping the predicates in one place per resource so they can move
  server-side later.
- **Types are hand-written, per feature.** We are not generating a client from `openapi.json`. When
  you build a feature, read that endpoint's schema in `../tasklean-be/docs/openapi.json` and write
  only the types that feature needs. Keep them close to the code that uses them. The spec wins on
  shape; the backend bible wins on behaviour.

## Conventions

Only what we've actually decided. This grows as we make choices.

- **TypeScript strict, no `any`.** `unknown` plus a narrowing guard at boundaries.
- **Server Components by default.** Add `'use client'` only when the component needs state, effects,
  event handlers or browser APIs — and push it as far down the tree as possible.
- **Components never call `fetch` directly.** All HTTP goes through `request()` in
  `src/lib/api/client.ts`, so there's one place that knows about the envelope, auth and error
  mapping. It takes the access token as a _parameter_ and knows nothing about sessions or refresh —
  those wrap it rather than living inside it.
- **Styling is Tailwind utility classes.** No CSS modules, no styled-components, no inline `style`
  except for genuinely dynamic values (a colour stored on a category). Extract a component, not an
  `@apply` class, when a pattern repeats.
- **Every colour, radius and font comes from a token** in `src/app/globals.css`. Tokens are named by
  role (`surface`, `muted-foreground`, `danger`), never by appearance — that is what makes a second
  theme possible without touching a component. Never hard-code a hex or a rem outside that file.
  Dark mode currently follows the OS setting; the cookie-driven toggle lands with the settings
  screen, at which point the dark variant moves to a data-attribute on `<html>`.
- **Mobile-first.** People open this on a phone while standing in a kitchen. Design the narrow layout
  first, then widen. Touch targets at least 44px, keyboard-reachable, labelled for screen readers.
- **Errors surface, never vanish.** Every mutation has a visible success and failure state. Never show
  a bare "Something went wrong" when the envelope carried a usable `message` — the backend writes
  `409` messages for humans.
- **Comments**: a short header on any non-obvious module saying what it's _for_; inline `//` above
  (not trailing) complex logic, explaining _why_. Never restate the code. Plain presentational
  components need none. Update or delete a comment when the code beneath it changes.
- **No secrets in `NEXT_PUBLIC_*`.** That prefix ships to the browser. The API base URL, the session
  secret and every token stay server-side. The Google _client id_ is public by design — the one
  exception.
- **Environment variables are read through `src/lib/env.ts`**, never `process.env` directly.
  `getEnv()` validates the required set on first call and throws naming every missing variable, so a
  bad config fails loudly at startup instead of surfacing later as a confusing fetch or session bug.
- **Line endings are LF**, pinned by `.gitattributes` (`* text=auto eol=lf`) for the repo and every
  working tree. A fresh Windows clone with `core.autocrlf=true` otherwise checks the tree out as CRLF,
  which Prettier (`endOfLine: lf`) then rejects for every file — a repo-wide `format:check` failure
  that looks like a formatting problem and isn't.
- **Commit message prefixes** match the backend: `fix:` → patch, `feat:` → minor,
  `BREAKING CHANGE:` → major. No prefix defaults to patch.

## Environment

`.env.local` is gitignored — never commit real values.

| Variable                       | Scope   | Purpose                                                                                                                  |
| ------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| `API_BASE_URL`                 | server  | Spring API origin (local `http://localhost:8080`, or staging)                                                            |
| `SESSION_SECRET`               | server  | Key for the encrypted httpOnly session cookie, unique per environment                                                    |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | browser | Google Sign-In client id — **must exactly match** the backend's `GOOGLE_CLIENT_ID`, or token-audience verification fails |

All three are required and validated by `src/lib/env.ts`; whitespace-only counts as missing.

The frontend's origin must be listed in the backend's `CORS_ALLOWED_ORIGINS` and under **Authorized
JavaScript origins** on the Google OAuth client. Because the browser never calls Spring directly
(see the session architecture in the bible), CORS should never actually fire — if you see a CORS
error, something is calling the API from the wrong side.
