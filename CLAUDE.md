# CLAUDE.md

TasKlean frontend — Next.js + TailwindCSS web app (installable as a PWA) consuming the TasKlean REST
API.

For deep context — why the architecture is what it is, the session design, API behaviour, design
system, gotchas, roadmap and the decision log — see [PROJECT_BIBLE.md](PROJECT_BIBLE.md). This file
is the reference: what exists, where it lives, and the rules.

**Backend is a sibling repo**: `../tasklean-be` (`/add-dir ../tasklean-be` to read it). Its
`PROJECT_BIBLE.md` is authoritative on **API behaviour**, its `docs/openapi.json` on **API shapes**.
Never restate backend internals here — link to them.

**State**: API layer, session, `/login`, `/register` and `/verify-email` exist. Google sign-in and
logout do not. Nothing has ever reached a real backend — all tests are MSW. `/` is a throwaway
design preview, temporarily in `PUBLIC_PATHS`.

## Quick reference

```bash
npm run dev            # Dev server on :3000 (the origin the backend's CORS allows)
npm run build          # Production build
npm run start          # Serve the production build
npm run lint           # ESLint
npm run typecheck      # next typegen && tsc --noEmit
npm test               # Vitest, single run
npm run test:watch     # Vitest, watch mode
npm run format         # Prettier, write
npm run format:check   # Prettier, check only
```

Next.js 16.4.0 (App Router, Turbopack), React 19.3, TypeScript 6 strict, Tailwind 4, ESLint 10,
Prettier, Vitest + MSW, `jose`, `lucide-react`, `zod/mini`. **Node 26** (`.nvmrc` +
`engines.node`); npm comes from Node's bundled copy, so a global npm install would silently shadow
it.

`typecheck` runs `next typegen` first because Next 16 generates `LayoutProps`/`PageProps` into
`.next/types` — a bare `tsc` fails on a clean checkout. Prettier skips `*.md` (`.prettierignore`).

### Running against a backend

| Target           | `API_BASE_URL`          | Notes                                                                                        |
| ---------------- | ----------------------- | -------------------------------------------------------------------------------------------- |
| Local            | `http://localhost:8080` | `docker-compose up -d` + `./mvnw spring-boot:run` in `../tasklean-be`. Dev issues **1-year** access tokens, so refresh never fires locally. |
| Staging (Render) | _not recorded yet_      | Prod profile: 15-minute access tokens, no seed data, Swagger disabled.                       |

Swagger UI (local only): http://localhost:8080/swagger-ui.html

### Generated files

`AGENTS.md` is written by `next dev` and points agents at the bundled Next docs — **leave it**;
deleting it makes Next write its marker block into CLAUDE.md instead. `next-env.d.ts` and
`.next/types` are generated and gitignored.

### Known install noise

- **5 "high" audit findings** — `braces` → `micromatch` → `fast-glob` → `@next/eslint-plugin-next`,
  a devDependency chain. `audit fix --force` would downgrade `eslint-config-next` to 14.x. Leave it.
- **`unrs-resolver` and `msw` postinstalls are denied** (`allowScripts` in `package.json`).
- **`typescript` is pinned `~6.0.3`, not `^`** — typescript-eslint declares `<6.1.0`, and **TS 7
  throws** on a hard `versionMajor >= 7` guard, killing lint. Don't widen the pin.

## Architecture

```
src/
  app/
    (auth)/            shared shell (brand panel + form), robots noindex
      login/           page.tsx, actions.ts
      register/        page.tsx, actions.ts
    about/             the one public, indexable page
    page.tsx           throwaway design preview
    globals.css        design tokens — the only place colours/radii/fonts are defined
  proxy.ts             the auth boundary (Next 16 renamed Middleware → Proxy)
  components/
    common/            primitives, no feature knowledge: text-field, password-field,
                       code-input, password-strength-meter,
                       submit-button, password-strength-meter
    auth/              login-form, register-form
  lib/                 all non-UI logic; nothing sits directly in src/lib
    api/               client.ts (the only module that knows the envelope), errors.ts,
                       server.ts (session-aware), client.types.ts
    auth/
      signin/          one per credential exchange: login, register, verify-email
      tokens/          access-token.ts (expiry), refresh.ts (single-flight rotation)
      session.ts       the encrypted cookie; auth.types.ts the wire shapes
      safe-next.ts     blocks open redirect via Proxy's ?next=
    config/env.ts      validated environment
    time/api-date.ts   API timestamps ↔ Date
    validation/        every form rule, shared by a form and its action
      rules.ts         the field-level Zod pieces (email, name, password, code)
      parse.ts         runs a schema, reshapes issues to one message per field
      forms/           one <form>.schema.ts per form: login, register, verify-email
      password/        policy.ts (the rules) and strength.ts (the advisory meter)
      code-length.ts   CODE_LENGTH, shared with CodeInput
  test/                msw.ts, server-only-stub.ts
```

**Depth follows need, not symmetry** — `signin/` is a directory because four endpoints are coming;
`session.ts` is one file because it stays one. **Server Actions stay with their route**, not in
`components/`. A component used by one feature starts in that feature's directory. **Tests sit beside
the code** they cover.

## Conventions

- **TypeScript strict, no `any`** — `unknown` plus a narrowing guard at boundaries.
- **Server Components by default.** `'use client'` only for state, effects, handlers or browser APIs,
  pushed as far down the tree as possible.
- **Components never call `fetch`.** All HTTP goes through `request()` in `api/client.ts`, which takes
  the access token as a parameter and knows nothing about sessions.
- **A module reading a server variable or holding a secret imports `server-only`** — `config/env.ts`,
  `api/client.ts`, `api/server.ts`, `auth/session.ts`, `auth/signin/*`, `auth/tokens/refresh.ts`.
  `validation/` must **not**, since client components import it.
- **Environment comes from `config/env.ts`**, never `process.env` (`NODE_ENV` is Next's, exempt).
  **No secrets in `NEXT_PUBLIC_*`**; the Google client id is the one public value.
- **Styling is Tailwind utilities.** No CSS modules, no styled-components, no inline `style` except a
  genuinely dynamic value. Extract a component, not an `@apply` class.
- **Every colour, radius and font is a token** in `src/app/globals.css`, named by role (`card`,
  `muted-foreground`, `destructive`) never by appearance. Never hard-code a hex or rem elsewhere.
  **[DESIGN.md](DESIGN.md) is the design authority**; `globals.css` implements it. Token names are
  Tailwind's, not DESIGN.md's Material ones — each value carries a comment naming its origin.
  Typeface **Plus Jakarta Sans** via `next/font`. Dark mode follows the OS.
- **Icons from `lucide-react`** as components, never an icon font. Pick the nearest equivalent to the
  design's Material Symbols. `aria-hidden` when a text label says the same thing.
- **Mobile-first.** Narrow layout first, then widen. Touch targets ≥44px, keyboard-reachable,
  labelled. Check phone, tablet and desktop — tablet is the one that gets skipped.
- **Forms validate in one place, twice.** Rules live in `validation/`; the client component and the
  Server Action call the same function, and the action is the authority (it runs without JS). Inputs
  are **controlled** — React resets an uncontrolled form after its action returns.
- **Every form is a `zod/mini` schema** in `validation/forms/<form>.schema.ts`, named `<form>Schema`
  and exported. A new form composes `rules.ts`, parses through `parseWith`, and exposes `parseX` for
  its action and `validateX` for the component. `zod/mini` not `zod`. Nothing in `password/policy.ts` becomes a
  schema: the strength meter needs per-rule booleans. Reasoning in the bible.
- **An action parses `Object.fromEntries(formData)`**, never `formData.get` by hand — the schema owns
  trimming, so a password reaches the backend exactly as typed while text fields do not.
- **A field shows only its first unmet rule.** Zod reports every failed check; the order in
  `rules.ts` is therefore the order a user is asked to fix things.
- **A field complains on blur, but only once it has content.** Empty fields wait for submit. The
  password is never echoed back through server state; other values are.
- **First names reject internal spaces; last names allow them** — "Van Der Berg" is an ordinary
  surname where a two-word first name rarely is. Both trim surrounding whitespace rather than
  rejecting it.
- **Errors surface, never vanish.** Every mutation has a visible success and failure state. Never a
  bare "Something went wrong" when the envelope carried a `message`.
- **Line endings are LF**, pinned by `.gitattributes`. A CRLF checkout fails `format:check` on every
  file and looks like a formatting problem.
- **Run `/pre-commit` before committing** — gates, conventions, docs, message. It never commits.
- **Commit prefixes**: `fix:` → patch, `feat:` → minor, `BREAKING CHANGE:` → major.

### File layout

**Every file reads in one order**: imports → types → metadata and module config → variables →
content. All module-level constants and state go in the variables block, not between functions.
`metadata`/`viewport` and `proxy.ts`'s `config` count as config and go above the implementation.
One blank line between sections — Prettier collapses more and offers no option.

**Types move out at two.** A module declaring more than one type keeps them in a sibling
`<module>.types.ts`, which is then the single import source — never re-export them from the module.
A type derived from a value in the module stays with it (`env.ts` keeps `RequiredKey`), and
dependency order then wins over section order.

**Every page exports `metadata`, directly after the imports.** Titles are the bare page name — the
root layout owns `template: "%s - TasKlean"`. The homepage sets none (the `default` renders
`TasKlean`). A `metadata` export is **impossible in a client component** and fails silently. Auth
routes are `noindex` via the `(auth)` layout.

### Comments

- **File header** — one to three lines on any non-obvious module: what it is _for_, plus the single
  thing a reader must know. No history, no essays, no restating exports. Plain presentational
  components get none.
- **Functions** — TSDoc on **every function, exported or not**, including pages and layouts. One-line
  imperative summary; `@param`/`@returns`/`@throws` only where not obvious from name and type. Skip a
  tag rather than pad it. A trivial helper gets a one-liner and no tags.
- **Types** — a `//` above a field only when the type cannot carry the meaning (units, which id
  namespace, what `null` means). **Never one per field.**
- **Inline** — `//` above the line, never trailing, explaining the _why_. Only when the code is
  correct but looks wrong, encodes a backend quirk, or rejects an obvious alternative. **One line.
  Two at the absolute most.** Three is a violation, not a judgement call — if the explanation needs
  more, it belongs in the bible and the comment belongs deleted. Default to none.
- **No worked examples.** State what the code does, not a demonstration — that belongs in a test.
- **Tests get no comments at all**, helpers included. The `it(...)` description is the comment. The
  `// @vitest-environment jsdom` pragma is configuration, not a comment.
- **Upkeep** — update or delete a comment in the same change as the code beneath it.

## Session and auth

- **The session is an encrypted cookie**, `tasklean_session`, sealed with `jose` as a **JWE** (not
  signed — a signed payload is readable base64url and ours carries the refresh token). Holds the
  token pair, `userUid`, `activeGroupId`. `auth/session.ts` exports the name and options so
  `proxy.ts` can't drift. **There is no server-side store**; the sealed tokens live in the browser.
- **Proxy is the auth boundary and the only refresh site on the navigation path.** Default deny —
  everything is protected unless in `PUBLIC_PATHS`. `/api` is excluded from the matcher so Route
  Handlers answer `401` instead of redirecting to HTML.
- **Never refresh where the rotated pair cannot be persisted.** Refresh tokens are single-use;
  cookies can only be written in Proxy, a Route Handler or a Server Action — **never in a Server
  Component render**.
- **`serverApi()` is session-aware; `request()` is raw.** `serverApi` throws `SessionExpiredError` on
  `401` and deliberately does not refresh. `403` passes through as `ApiError`.
- **Mutations use Server Actions, not Route Handlers** — Next checks `Origin` against `Host`, so CSRF
  is covered without a token of our own. A Route Handler would need one.
- **Role checks in our code are UX, never authorization.** Spring is the authority: gate the UI
  optimistically *and* handle the `403`. Not built yet.
- **Password policy** lives in `validation/password/policy.ts` and the **frontend is the spec** —
  the backend is being changed to match. 8–64 characters, one each of
  upper/lower/digit/non-alphanumeric, and a guessable password is rejected. Enforced at register,
  never at login.

## Consuming the API

Consequences of the backend's design, not preferences. Breaking them produces bugs that look like
backend bugs. Reasoning in [the bible](PROJECT_BIBLE.md).

- **Every response is an envelope** — `{ success, message, data }`, on failure too, never HTML.
  `api/client.ts` unwraps it and throws `ApiError`; nothing above it sees the envelope. No field is
  marked `required` in `openapi.json`, so narrow rather than trust.
- **Never branch on the exact 2xx code** — POSTs return `201` while the spec says `200`.
- **`uid` vs `id` is not interchangeable.** `User`, `Group`, `Task` are addressed by string `uid`;
  everything else by numeric `id`. Payloads are flat — foreign keys are ids, never nested objects.
- **`assignedToId` / `createdById` / `groupMemberId` are GroupMember ids, a third namespace.** Name
  them `memberId`, never `userId`. Resolve yours from `GET /api/group-members?groupId=`.
- **All timestamps are UTC with no zone marker** and parse as local if handled naively. Everything
  goes through `time/api-date.ts` — `parseApiDate` in, `toApiDate` out. **Writing back takes no `Z`**
  (the backend parses `ISO_LOCAL_DATE_TIME`).
- **`401` ends a session, `403` never does.** `401` → one silent refresh, then clear and `/login`.
  `403` → show a permission message, never log out, never retry.
- **`429` is real and carries `Retry-After`.** Show the window; never auto-retry.
- **List endpoints need a scope parameter** — `?groupId=`, `?userId=`, `?taskId=`. Missing one is a
  `400`, not an empty list.
- **No pagination, sorting or server-side filtering exists.** Filter and sort on the client, keeping
  the predicates in one place per resource.
- **Types are hand-written per feature** from `openapi.json` — we do not generate a client.

## Tests

`vitest.config.mts` + `vitest.setup.ts`. Tests sit beside their code as `*.test.ts(x)`.

- **Default environment is `node`**; a component test opts in with `// @vitest-environment jsdom` on
  line one.
- **No globals** — import `describe`/`it`/`expect` from `vitest`. Turning them on would force
  `tsconfig`'s `types` to list every `@types` package explicitly.
- **`cleanup()` runs after each test** in `vitest.setup.ts`. Testing Library only registers it
  automatically when globals are on, so without it every `render` stacks into one document.
- **HTTP is mocked at the network boundary with MSW**, never by stubbing our own modules. Shared
  server in `src/test/msw.ts`; handlers per test via `server.use()`. Unhandled requests **fail the
  test** (`onUnhandledFrame: "error"`).
- **`server-only` is aliased to a stub** — the package throws unless resolved under React's
  `react-server` condition, which Vitest doesn't apply. The production guard is unaffected.
- **The suite runs in a pinned non-UTC timezone** (`TZ = "Europe/Ljubljana"`). On a UTC machine a
  naive `new Date(apiString)` is right by accident and the timestamp tests would pass against the bug
  they exist to catch. `time/api-date.test.ts` asserts the pin.
- New logic in `src/lib/` gets a colocated test.

## Environment

`.env.local` is gitignored — never commit real values.

| Variable                       | Scope   | Purpose                                                                     |
| ------------------------------ | ------- | --------------------------------------------------------------------------- |
| `API_BASE_URL`                 | server  | Spring API origin                                                           |
| `SESSION_SECRET`               | server  | Key for the encrypted session cookie, unique per environment, ≥32 chars     |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | browser | Google Sign-In client id — **must match** the backend's `GOOGLE_CLIENT_ID`  |

All three are required and validated by `config/env.ts`; whitespace-only counts as missing. Our
origin must be in the backend's `CORS_ALLOWED_ORIGINS` and the Google client's authorized origins —
though the browser never calls Spring directly, so a CORS error means something is calling from the
wrong side.
