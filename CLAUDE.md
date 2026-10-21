# CLAUDE.md

TasKlean frontend — Next.js + TailwindCSS web app (installable as a PWA) consuming the TasKlean REST
API.

For deep context — why the architecture is what it is, the session design, API behaviour, design
system, gotchas, roadmap and the decision log — see [PROJECT_BIBLE.md](PROJECT_BIBLE.md). This file
is the reference: what exists, where it lives, and the rules.

**Backend is a sibling repo**: `../tasklean-be` (`/add-dir ../tasklean-be` to read it). Its
`PROJECT_BIBLE.md` is authoritative on **API behaviour**, its `docs/openapi.json` on **API shapes**.
Never restate backend internals here — link to them.

**State**: API layer, session, the public home page, `/login`, `/register`, `/verify-email`,
`/forgot-password`, `/reset-password`, `/two-factor`, Google sign-in, `/app`, `/app/account`,
`/app/settings/{appearance,language,notifications,two-factor,devices,password,connected-accounts,deactivate}`
and logout exist. Everything else behind the session does not. **Two-factor is complete for the one
provider the backend has**: a sign-in the backend gates is answered end to end, the settings page
lists the methods, and enrolling, turning it off and reissuing recovery codes all work, so every
`/api/account/2fa` endpoint has a caller. Register, verification, password login, password reset and
token rotation have all run against the real backend in Docker, and the whole two-factor section
against a local one; the account, user-settings and notification-settings endpoints have run against
a stub only; every automated test is MSW.

## Quick reference

```bash
npm run dev            # Dev server on :3000 (the origin the backend's CORS allows)
npm run build          # Production build
npm run start          # Serve the production build
npm run lint           # ESLint
npm run typecheck      # next typegen && tsc --noEmit
npm test               # Vitest, single run
npm run test:watch     # Vitest, watch mode
npm run test:coverage  # Vitest with coverage, writes coverage/lcov.info for Sonar
npm run format         # Prettier, write
npm run format:check   # Prettier, check only
```

Next.js 16.4.0 (App Router, Turbopack), React 19.3, TypeScript 6 strict, Tailwind 4, ESLint 10,
Prettier, Vitest + MSW, `jose`, `lucide-react`, `zod/mini`, `uqr`. **Node 26** (`.nvmrc` +
`engines.node`); npm comes from Node's bundled copy, so a global npm install would silently shadow
it.

`typecheck` runs `next typegen` first because Next 16 generates `LayoutProps`/`PageProps` into
`.next/types` — a bare `tsc` fails on a clean checkout. Prettier skips `*.md` (`.prettierignore`).

### Running against a backend

| Target           | `API_BASE_URL`          | Notes                                                                                        |
| ---------------- | ----------------------- | -------------------------------------------------------------------------------------------- |
| Local            | `http://localhost:8080` | `docker-compose up -d` + `./mvnw spring-boot:run` in `../tasklean-be`. Dev issues **1-year** access tokens, so refresh only fires if `JWT_EXPIRATION` is overridden. |
| Full stack (Docker) | `http://backend:8080` | `docker-compose up --build` in the parent dir runs db, backend and frontend together. The compose file sits in `../`, outside both repos and outside git. |
| Staging (Render) | _not recorded yet_      | Prod profile: 15-minute access tokens, no seed data, Swagger disabled.                       |

Swagger UI (local only): http://localhost:8080/swagger-ui.html

### The container

`Dockerfile` is a three-stage build (deps, build, runtime) on `node:26-alpine`, running as a
non-root user and serving `next.config.ts`'s `output: "standalone"` bundle with `node server.js`.
`.dockerignore` keeps `node_modules`, `.next` and `.git` out of the build context.

**The image takes no build arguments, and one image runs anywhere.** `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
is never inlined, because the only reader is `getEnv()` in a Server Component that passes the value
down as a prop, so no client code references `process.env`. It is a **runtime** variable like the
other two, and missing it makes every Google sign-in fail with the generic error. A build needs no
environment at all.

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

## CI and deployment

Two workflows, mirroring the backend's split. `ci-staging.yml` runs on push and PR to `main`,
`ci-production.yml` on push and PR to `production`; a `main` into `production` PR is what promotes a
release. Both ignore `**.md`, `docs/**` and `LICENSE`.

```
staging      verify -> sonarcloud -> build-and-push -> deploy
production   verify -> sonarcloud -> version -> promote -> deploy -> release
```

- **One `verify` job** runs lint, typecheck, `test:coverage`, `format:check` and `build` in sequence,
  then uploads `coverage/lcov.info`. Splitting them would pay for four runner starts and four
  `npm ci` runs to parallelise gates that take seconds.
- **Sonar is a separate job** so the scan never shares an environment with `npm ci`, and it is
  skipped for a fork PR, which gets no `SONAR_TOKEN`. Config lives in `sonar-project.properties`.
- **Production promotes, it never rebuilds.** Staging pushes `sha-<short>` plus a moving `staging`
  tag; production finds the `sha-` tag for the commit being released, or for `HEAD^2` when a merge
  commit sits on top, and retags that digest as the version and `latest`. Production runs the bytes
  staging proved.
- **Render pulls tags**: the staging service `:staging`, production `:latest`. Health check path is
  `/api/health`.
- **Every action is pinned to a commit SHA**, and `dependabot.yml` covers `github-actions` as well
  as `npm`, because a pinned SHA that nothing updates is a stale dependency.
- `.github/` also holds `pull_request_template.md`, which is the summary, changes, testing and notes
  shape `/pre-commit PR` already produces.
- `permissions: contents: read` at the top of both files; only `version` and `release` ask for
  `contents: write`.
- **No `npm audit` gate** - the five known devDependency findings would fail every run. Dependabot
  covers that ground instead.

Secrets at repo level: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `RENDER_API_KEY`, `SONAR_TOKEN`.
Per GitHub Environment (`Staging`, `Production`): `RENDER_DEPLOY_HOOK`, `RENDER_SERVICE_ID`.

## Architecture

```
src/
  app/
    api/health/        route.ts, the 200 Render polls; outside Proxy's matcher
    (app)/             the signed-in shell: layout.tsx, actions.ts (logout)
      app/             everything behind the session lives under /app
        page.tsx       the signed-in landing page
        account/       the profile page behind the avatar menu
        settings/      layout.tsx (rail beside content), page.tsx (index), sections.ts
                       (grouped: Preferences, Security, Account) and sections.types.ts
          appearance/  page.tsx and actions.ts: the colour scheme
          language/    page.tsx and actions.ts: the UI language
          notifications/  page.tsx and actions.ts: the channels each notification uses
          two-factor/  page.tsx and actions/: the methods on offer, enrolling in an
                       authenticator app, turning it off and reissuing recovery codes
          devices/     page.tsx with page.helpers.ts, and actions/: list, sign out,
                       remove, sign out everywhere
          password/    page.tsx and actions.ts: change a password, or set the first
          connected-accounts/  page.tsx and actions.ts: link and unlink Google
          deactivate/  page.tsx and actions.ts: closing the account
    (auth)/            shared shell (brand panel + form), robots noindex
      actions.ts       the Google Server Action, shared by both screens
      login/           page.tsx, actions.ts
      register/        page.tsx, actions.ts
      forgot-password/ page.tsx, actions.ts
      reset-password/  page.tsx, actions.ts
      two-factor/      page.tsx and actions.ts: the second factor a gated sign-in asks for
    (public)/          site header + footer shell, the one indexable route
      page.tsx         the home page
    error.tsx          the boundary below the root layout, with a retry
    globals.css        design tokens — the only place colours/radii/fonts are defined
    icon.png           the favicon, by Next's file convention
    not-found.tsx      the 404, for any path no route matches
  assets/              images components import; next/image reads their size from the file
  proxy.ts             the auth boundary (Next 16 renamed Middleware → Proxy)
  components/
    common/            primitives, no feature knowledge: avatar, account-menu, logout-button,
                       masked-email, load-error, form-notice, brand-mark, text-field,
                       password-field, code-input, two-factor-code-field (either kind of
                       code, and the switch), password-strength-meter, submit-button,
                       or-divider, greeting, copy-button, qr-image
    app/               signed-in chrome: app-header, settings-nav, device-row,
                       sign-out-everywhere, password-form, google-connection,
                       unlink-google, deactivate-account, appearance-form, theme-preview,
                       language-form, notifications-form, notification-toggle,
                       switch-track, two-factor-method (the shell every method shares),
                       two-factor-card, two-factor-enroll, two-factor-manage,
                       two-factor-confirm, recovery-codes
    auth/              login-form, register-form, verify-email-form, two-factor-form,
                       google-sign-in (the rule plus the button), google-button, back-link,
                       forgot-password-form, reset-password-form
    marketing/         public-page sections: site-header, site-footer, hero,
                       hero-tilt, how-it-works, feature-grid, comparison, cta-band
  lib/                 all non-UI logic; nothing sits directly in src/lib
    account/           account.ts (the caller's own password, connections and deactivation)
                       and two-factor.ts, which reads the second factor's state and turns it on
    api/               client.ts (the only module that knows the envelope), errors.ts,
                       error-codes.ts (the envelope codes more than one module reads),
                       server.ts (session-aware), client.types.ts,
                       retry-phrase.ts (the 429 message),
                       action-failure.ts (what every Server Action shows on a throw)
    auth/
      signin/          one per credential exchange: login, register, verify-email, google,
                       two-factor, plus outcome.ts, which decides whether a login response
                       is a session or a challenge
      tokens/          access-token.ts (expiry), refresh.ts (single-flight rotation),
                       logout.ts (revokes server-side)
      session.ts       the encrypted cookie; auth.types.ts the wire shapes
      device.ts        the per-browser device id cookie and the headers carrying it
      two-factor-challenge.ts  the short-lived cookie holding a gated sign-in's challenge
      password-reset.ts  forgot and reset, neither of which returns tokens
      google-nonce.ts  the per-attempt Google nonce: cookie, header, mint and hash
      safe-next.ts     blocks open redirect via Proxy's ?next=, owns SIGNED_IN_HOME and
                       the two-factor prompt's path
    config/env.ts      validated environment
    devices/devices.ts the caller's own devices and sessions
    notifications/     settings.ts (the channels each notification type uses: a GET for the
                       page, a batch PUT that answers with the whole matrix) and
                       settings.types.ts
    preferences/       preferences.ts (theme and language, via /api/user-settings),
                       theme-cookie.ts (the cached theme the server paints from),
                       theme-attribute.ts (the data-theme value, client-safe)
    qr/                qr-code.ts (the encoder, server side only) and qr-code.types.ts
    time/api-date.ts   API timestamps ↔ Date
    users/             me.ts (the caller's profile), name.ts (display name and initials)
    validation/        every form rule, shared by a form and its action
      rules.ts         the field-level Zod pieces (email, name, password, code, theme, locale,
                       notification type, two-factor code)
      parse.ts         runs a schema, reshapes issues to one message per field
      forms/           one <form>.schema.ts per form: login, register, verify-email,
                       google-signin, forgot-password, reset-password, device-action,
                       change-password, set-password, deactivate-account, appearance,
                       language, notifications, two-factor, two-factor-setup,
                       two-factor-enable, two-factor-confirm
      password/        policy.ts (the rules) and strength.ts (the advisory meter)
      code-length.ts   CODE_LENGTH, shared with CodeInput
  test/                msw.ts, server-only-stub.ts, password-policy-vectors.json
                       (mirrored from the backend, run by policy.contract.test.ts)
```

**Depth follows need, not symmetry**: `signin/` groups five modules because five endpoints exchange
a credential, where `session/` is one module and stays one. **Server Actions stay with their route**,
not in `components/`. Every name above that has a test, a `.types.ts` or parts of its own is a
directory holding them, so `client.ts` is `api/client/client.ts`. A component used by one feature
starts in that feature's directory. **Tests sit beside the code** they cover.

## Conventions

- **TypeScript strict, no `any`** — `unknown` plus a narrowing guard at boundaries.
- **Props are read-only at the signature**: `}: Readonly<FooProps>)`. The type itself stays a plain
  `type FooProps`, so one declaration still serves anything that composes the component, and
  nothing in the tree can write to the object it was handed.
- **Server Components by default.** `'use client'` only for state, effects, handlers or browser APIs,
  pushed as far down the tree as possible.
- **A client component never reads the environment.** A Server Component calls `getEnv()` and passes
  the value down as a prop. That is how the Google client id reaches the browser, and it keeps
  `config/env/env.ts`'s validation as the only gate.
- **Components never call `fetch`.** All HTTP goes through `request()` in `api/client/client.ts`, which takes
  the access token as a parameter and knows nothing about sessions.
- **A module reading a server variable or holding a secret imports `server-only`**, and so does
  every feature module that calls `serverApi` or touches a cookie: `config/env/env.ts`, `api/client/client.ts`,
  `api/server/server.ts`, `api/action-failure/action-failure.ts`, `auth/session/session.ts`, `auth/device/device.ts`, `auth/signin/*`,
  `auth/tokens/refresh/refresh.ts`, `auth/two-factor-challenge/two-factor-challenge.ts`, `account/`, `devices/`, `users/`,
  `qr/qr-code/qr-code.ts` (not for a secret: it keeps the encoder out of the browser bundle),
  `notifications/settings/settings.ts`, `preferences/preferences.ts` and `preferences/theme-cookie/theme-cookie.ts`. `validation/` must **not**, since
  client components import it, and neither may `qr/qr-code/qr-code.types.ts`, `preferences/preferences.types.ts`,
  `preferences/theme-attribute/theme-attribute.ts` or `notifications/settings/settings.types.ts`, which the forms read.
- **Environment comes from `config/env/env.ts`**, never `process.env` (`NODE_ENV` is Next's, exempt).
  **No secrets in `NEXT_PUBLIC_*`**; the Google client id is the one public value.
- **Styling is Tailwind utilities.** No CSS modules, no styled-components, no inline `style` except a
  genuinely dynamic value. Extract a component, not an `@apply` class.
- **Every colour, radius and font is a token** in `src/app/globals.css`, named by role (`card`,
  `muted-foreground`, `destructive`) never by appearance. Never hard-code a hex or rem elsewhere.
  **[DESIGN.md](DESIGN.md) is the design authority**; `globals.css` implements it. Token names are
  Tailwind's, not DESIGN.md's Material ones — each value carries a comment naming its origin.
  Typeface **Plus Jakarta Sans** via `next/font`.
- **Dark follows the OS unless the reader chose otherwise.** `globals.css` defines the condition
  once as `@custom-variant dark`, and both the dark token block (through `@variant dark`) and every
  `dark:` utility run through it, so the palette is written once. `data-theme` on `<html>` is the
  override; the root layout writes it from the theme cookie, so the first paint is already right.
  The four `swatch-*` tokens are the exception that never flips: the picker has to show a scheme
  rather than wear it.
- **Images are static imports from `src/assets/`**, rendered with `next/image`, never a bare
  `<img>` and never `public/`, which costs the intrinsic size and the build-time blur
  placeholder. The logo has a dark-mode twin, so render `BrandMark` rather than either file.
  **A remote profile photo is the exception**: it has no build-time size, so `next.config.ts`
  allowlists the hosts the optimizer may fetch and `Avatar` falls back to initials for anything
  else, since an unlisted host makes `next/image` throw and takes the page with it.
- **Icons from `lucide-react`** as components, never an icon font. Pick the nearest equivalent to the
  design's Material Symbols. `aria-hidden` when a text label says the same thing.
- **Mobile-first.** Narrow layout first, then widen. Touch targets ≥44px, keyboard-reachable,
  labelled. Check phone, tablet and desktop — tablet is the one that gets skipped.
- **Motion is opt-out.** Anything that moves sits behind `motion-safe:` or a
  `prefers-reduced-motion` check, and anything cursor-driven ignores a `pointerType` other than
  `mouse`. Tailwind wraps `hover:` in `@media (hover: hover)` already, so a tap never sticks. A
  hover shadow may stay under reduced motion; the movement may not.
- **Forms validate in one place, twice.** Rules live in `validation/`; the client component and the
  Server Action call the same function, and the action is the authority (it runs without JS). Inputs
  are **controlled** — React resets an uncontrolled form after its action returns.
- **Every form is a `zod/mini` schema** in `validation/forms/<form>.schema.ts`, named `<form>Schema`
  and exported. A new form composes `rules.ts`, parses through `parseWith`, and exposes `parseX` for
  its action and `validateX` for the component. `zod/mini` not `zod`. Nothing in `password/policy/policy.ts` becomes a
  schema: the strength meter needs per-rule booleans. Reasoning in the bible.
- **An action parses `Object.fromEntries(formData)`**, never `formData.get` by hand — the schema owns
  trimming, so a password reaches the backend exactly as typed while text fields do not. The one
  exception is a **checkbox group**, where the name repeats and `fromEntries` would keep only the
  last box: those fields are read with `getAll` into a list, as `notifications/actions/actions.ts` does.
- **A field shows only its first unmet rule.** Zod reports every failed check; the order in
  `rules.ts` is therefore the order a user is asked to fix things.
- **A field complains on blur, but only once it has content.** Empty fields wait for submit. The
  password is never echoed back through server state; other values are.
- **First names reject internal spaces; last names allow them** — "Van Der Berg" is an ordinary
  surname where a two-word first name rarely is. Both trim surrounding whitespace rather than
  rejecting it.
- **No em or en dashes.** Not in UI copy, not in comments, not in docs. A full stop, a comma or a
  colon says the same thing. Older files still carry them and get swept as they are touched.
- **A Server Action reports a throw through `actionFailureMessage`.** One place composes the 429
  window, falls back to the generic line when the envelope carried nothing, and redirects a dead
  session to `/login`. An action that writes its own copy will drift from the others.
- **Errors surface, never vanish.** Every mutation has a visible success and failure state. Never a
  bare "Something went wrong" when the envelope carried a `message`. A screen that loads data
  catches `ApiError` and renders `LoadError` inline, keeping the rest of the page usable; the route
  boundary is for the failures nobody anticipated, and `SessionExpiredError` redirects to `/login`.
- **A `select` or a checkbox whose value lives in React state cancels the form reset.** React resets
  a form's DOM once its action answers, and never rewrites a controlled value it did not change, so
  the control keeps the reset value while state disagrees. `onReset={(event) => event.preventDefault()}`
  is the fix, and the language select and the notification switches carry it. **A text input does
  not need it**: React writes its value into the attribute, which is what a reset restores, so the
  two-factor code survives a refusal with nothing added.
- **A complete code submits its own form.** `CodeInput` calls `requestSubmit()` from an effect once
  six digits are in, so the form's own validation and action still run. It fires on a keystroke or a
  paste, never on a code that arrived with the component: a prefilled one, as the email link's is, is
  a value to look over. The press is still there for a paste and for a second attempt.
- **Anything an action hands back only once must survive a re-render.** Recovery codes exist
  nowhere else, so the component holding them stays mounted whatever the server then says, the
  action does not revalidate, and dismissing them is its own state. Writing a cookie in an action
  re-renders the route just as `revalidatePath` does, so a conditional that unmounts the component
  takes the codes with it.
- **An action revalidates only when the page's truth comes from the server.** Devices, password and
  connected accounts render rows and flags the action cannot hand back, so they call
  `revalidatePath` and the re-render is what updates the screen. Appearance, language and
  notifications return the saved value and the form renders from it, so revalidating only buys a
  second fetch: the route is dynamic, `request()` sends `cache: "no-store"`, and a dynamic segment
  is stale in the client router cache as soon as it lands, so there is no stored copy to invalidate.
- **A page of switches edits a draft and saves it in one press.** The notification matrix is state,
  the switches are real checkboxes posting one list of type names per channel, and the action sends
  the whole matrix in one batch. It reads nothing before or after and revalidates nothing: the form
  holds every value, the batch answers with the backend's own re-read, and a dynamic route fetched
  with `no-store` has no cached copy to invalidate. A reminder appears the moment the draft differs from what is saved,
  and a refused save keeps the draft so it can be sent again.
- **A destructive button confirms in place.** Removing a device or signing out everywhere swaps the
  button for a question and a cancel, rather than opening a dialog or trusting `window.confirm`,
  which cannot be styled and reads badly on a phone.
- **Line endings are LF**, pinned by `.gitattributes`. A CRLF checkout fails `format:check` on every
  file and looks like a formatting problem.
- **Run `/pre-commit` before committing** — gates, conventions, docs, message. It never commits.
- **Commit prefixes**: `fix:` → patch, `feat:` → minor, `BREAKING CHANGE:` → major.

### File layout

**Every file reads in one order**: imports → types → metadata and module config → variables →
content. All module-level constants and state go in the variables block, not between functions.
`metadata`/`viewport` and `proxy.ts`'s `config` count as config and go above the implementation.
One blank line between sections — Prettier collapses more and offers no option.

**A module with companion files is a directory.** The moment anything else is about one module, its
test included, the whole set moves into `<module>/` and the module keeps its own name:
`login-form/login-form.tsx` beside `login-form.test.tsx`, `client/client.ts` beside `client.test.ts`
and `client.types.ts`. There are no `index` files, so a path still says which file it means. That
holds everywhere, `src/lib` included.

**Some files stay flat, because the framework fixes where they are**: `src/proxy.ts` and the
router's own `page.tsx`, `layout.tsx`, `route.ts` and `error.tsx`. Companions sit beside them
instead, the way `devices/page.helpers.ts` does. `proxy.ts` is the dangerous one, so read the
gotcha in the bible before trying to move it.

**One component per file, and a component's parts live with it.** A sub-component is its own file
named after what it exports, so nothing is found only by scrolling. What several parts share is
named after the owner: `<module>.types.ts`, `<module>.styles.ts`, `<module>.helpers.ts`. **Helpers
collect into that one file** rather than one file each, so a directory lists a component and its
parts instead of a drawer of one-function modules. Two functions stay in one file where the second
is private to the first, as `clock` is to `expiryNote`, or where they share module state, as the
Google helpers do.

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
  token pair, `userUid`, `activeGroupId`. `auth/session/session.ts` exports the name and options so
  `proxy.ts` can't drift. **There is no server-side store**; the sealed tokens live in the browser.
- **The chrome knows whether you are signed in, and that costs `/` its static render.** Both
  layouts read the session once and pass `signedIn` and `name` down, so the header and footer stay
  presentational. Signed in, the public chrome swaps "Log in" and "Get started" for "Go to app".
- **The display name rides in the session cookie.** Every auth response carries it, including
  refresh, so the chrome can greet by name without an API call on every page. It is display only
  and may be stale; anything that matters reads the backend.
- **So does the avatar, but it costs one call at sign-in.** `AuthResponse` has no `photoUrl`, so
  `startSession` reads `/api/users/me` once and seals it beside the name. Best effort: a failure
  costs an avatar, never a login. Every sign-in path goes through `startSession`, never
  `setSession` directly, or the chrome loses the photo on whichever path skipped it.
- **Sign-in caches the theme as well as the avatar.** `startSession` reads `/api/user-settings`
  beside `/api/users/me` and writes `tasklean_theme`, always, so a browser never keeps painting the
  theme of whoever used it last. The API stays the authority: the cookie is this browser's cache,
  rewritten on every save, and a change made on another device arrives at the next sign-in.
- **Everything behind the session lives under `/app`.** `/app` is the home, `/app/account` and
  `/app/settings/*` hang off it, and future screens follow. The prefix makes the auth boundary
  legible in the URL and keeps a marketing page and an app route from ever colliding. Protection
  does not depend on it: Proxy is default-deny.
- **`/app` is the signed-in home, and `/` stays public.** A visitor with a session is bounced off
  the auth screens to `SIGNED_IN_HOME`, never off the marketing page, which stays readable.
  `safe-next.ts` owns that constant, so login, Google and Proxy agree.
- **Logout is best effort at the backend, certain in the browser.** `revokeSession` failing must
  never leave someone in a session they asked to leave, so the cookie is cleared either way. It
  ends **this device only**; other browsers keep their sessions, and signing out everywhere is a
  separate call from account settings.
- **Every browser carries a device id, minted by Proxy into `tasklean_device`.** The backend binds
  a refresh token to it, so a session has a stable identity across rotation and can be listed and
  revoked per device. A cookie rather than browser storage, because refresh happens in Proxy, which
  cannot reach `localStorage`. `auth/device/device.ts` owns the cookie and builds the three headers the
  backend reads: `X-Device-Id`, `X-Device-User-Agent` (the real browser UA, since the transport one
  on this hop is Node's) and `X-Forwarded-For`. They ride on login, Google, verify-email, refresh
  and every `/api/devices` call, the last because `currentDevice` is resolved from the header. Logout
  sends them too, but derives the device from the token's own binding, not from what we send.
  Proxy mints only on the auth screens and for signed-in requests, never for an anonymous reader of
  the marketing page.
- **Proxy is the auth boundary and the only refresh site on the navigation path.** Default deny —
  everything is protected unless in `PUBLIC_PATHS`. `/api` is excluded from the matcher so Route
  Handlers answer `401` instead of redirecting to HTML.
- **Never refresh where the rotated pair cannot be persisted.** Refresh tokens are single-use;
  cookies can only be written in Proxy, a Route Handler or a Server Action — **never in a Server
  Component render**.
- **`serverApi()` is session-aware; `request()` is raw.** `serverApi` throws `SessionExpiredError` on
  `401` and deliberately does not refresh. `403` passes through as `ApiError`.
- **`credentialCheck: true` is the one opt-out, and only `/api/account` uses it.** Those endpoints
  verify a password or a Google token we just sent, and the backend answers a wrong one with `401`
  carrying no code, so without the flag a typo would sign the person out.
- **A password change reseals the session.** `POST /api/account/change-password` and `/set-password`
  revoke every refresh token, this browser's included, then issue a fresh pair for the device the
  `X-Device-Id` header names. The action seals it with `startSession`, and without the header the
  backend binds the pair to a new device and emails a new-sign-in notice for this same browser.
- **Proxy mints a Google nonce on `/app/settings/connected-accounts` too.** Linking happens while
  signed in, so that path is the one signed-in response that keeps its nonce instead of dropping
  it.
- **Mutations use Server Actions, not Route Handlers** — Next checks `Origin` against `Host`, so CSRF
  is covered without a token of our own. A Route Handler would need one.
- **Role checks in our code are UX, never authorization.** Spring is the authority: gate the UI
  optimistically *and* handle the `403`. Not built yet.
- **Google sign-in is one endpoint for both screens.** `POST /api/auth/google` takes the ID token
  from Google Identity Services and signs in, links or provisions by itself, so `/login` and
  `/register` share one Server Action at the `(auth)` group root and differ only in Google's label.
- **Every Google sign-in carries a nonce, and the two values are not interchangeable.** Proxy mints
  the raw value into an httpOnly cookie and forwards only its **lowercase hex SHA-256** to the page,
  which hands that hash to Google; the action sends the **raw** value to the backend, which rehashes
  and compares. Sending the hash to the backend would make a stolen token replayable. The nonce is
  single use: every outcome of an attempt replaces it, and the action returns the new hash so the
  button on screen stays usable. A session makes it pointless, so Proxy drops a leftover one on the
  first signed-in request.
- **A sign-in can end in a challenge instead of a session.** `login` and `google` answer with
  `twoFactorRequired` and a `challengeToken` and no tokens at all when the account has a second
  factor, so both return a `SignInOutcome` union and `signin/outcome/outcome.ts` is the only place that
  reads either response. Reading `token` without checking the flag first is the one mistake that
  looks like a successful login and leaves the browser with no session.
- **The challenge rides in an httpOnly cookie, not the URL or a hidden field.** It is a credential
  with a five-minute life, so `auth/two-factor-challenge/two-factor-challenge.ts` owns `tasklean_2fa_challenge` and the
  verify action reads it from there, ignoring anything a form posts under that name. A reload keeps
  working, and Proxy drops a leftover one the way it drops a spent Google nonce.
- **`/two-factor` is public, and guarded twice.** A visitor finishing a gated sign-in has no session
  by definition, so the path is in `PUBLIC_PATHS`; the page redirects to `/login` when there is no
  challenge to answer, and `AUTH_PATHS` bounces anyone who already has a session. Being in
  `AUTH_PATHS` is also what mints the device id, which `verify` has to send: the device row and the
  new-sign-in email are created at that step now, not at login.
- **A 401 from `/api/auth/2fa/verify` is about the code, not the session.** Two codes end the
  attempt: `TWO_FACTOR_CHALLENGE_INVALID` clears the cookie and returns to `/login?expired=2fa`,
  and `ACCOUNT_DEACTIVATED` to the notice login already has. Every other 401 shows against the code
  field, so a mistyped digit costs a retry and nothing else. **Refresh is not gated**, so a
  returning browser with a live refresh token is never asked for a code.
- **One field takes either kind of code.** `twoFactorCodeRule` accepts six digits or an
  eight-character recovery code and normalises the way the backend matches: spaces and the hyphen
  stripped, uppercased. The screen offers a toggle because the two look nothing alike to type, not
  because the endpoint cares.
- **Enrolling is two calls, and only the second one turns anything on.** `POST
  /api/account/2fa/setup` re-authenticates with the password and answers with the secret and an
  `otpauth://` URI; `POST /2fa/enable` takes a code from the app and answers with ten recovery codes
  **plus a fresh token pair**, having revoked every other session. Both carry
  `credentialCheck: true`, since their 401 is the password or the code and not the session, and
  `enable` carries the device headers so the new pair stays on this browser. Running `setup` again
  replaces a setup nobody confirmed, so the entry already in the app stops working.
- **Turning it off and reissuing codes ask for both credentials.** `POST /2fa/disable` and `POST
  /2fa/recovery-codes` take one `{ password?, code }` body, so one schema and one form serve both.
  The code may be an authenticator or a recovery code and is **spent** either way. Only `disable`
  answers with a fresh pair, which the action seals, and that write re-renders the page with the
  factor off, so the component holding the confirmation has to outlive it.
- **A 401 from `/api/account` is routed by its code, not its status.** Only `PASSWORD_INVALID`
  reaches the password field. Those endpoints answer 401 for a dead session too, carrying no code,
  and blaming the field for that would hide it.
- **Only an authenticator code can confirm a setup.** `/2fa/enable` has no recovery codes to fall
  back on yet, so that form uses `codeRule`, the plain six digits, not `twoFactorCodeRule`.
- **The QR code is encoded on the server.** `lib/qr/qr-code/qr-code.ts` turns the URI into one SVG path, so
  `uqr` never reaches the browser bundle and the client gets a string rather than a few thousand
  booleans. `qr-ink` and `qr-paper` are the two tokens that never follow the colour scheme: a camera
  reads dark modules on a light field in either one.
- **Only the authenticator app exists.** The settings page lists Email and Text message as methods
  with a dead "Coming soon" button, and the backend's `TwoFactorProviderType` has only `LOCAL`.
  `TwoFactorMethod` is the shell they share, and it refuses to render children for a method marked
  unavailable, so no form can appear behind one by accident.
- **A password reset ends at the login screen, never in a session.** `POST
  /api/auth/reset-password` returns no tokens and revokes every refresh token the user holds, so the
  action clears our cookie and sends them to `/login?reset=1`. `/forgot-password` answers the same
  way for an address with no account, and emails a Google-only account a "nothing to reset" notice,
  so the screen keeps its notice neutral and never redirects. `/reset-password` is public and
  deliberately **not** in `AUTH_PATHS`: an emailed link has to work even for a browser that still
  holds a session.
- **Password policy** lives in `validation/password/policy/policy.ts` and the **frontend is the spec**;
  the backend matches it. 8 to 64 characters, one each of upper/lower/digit/non-alphanumeric, and a
  guessable password is rejected. Enforced at register, never at login. Both sides run the same
  vectors: `src/test/password-policy-vectors.json` is a verbatim mirror of the backend's canonical
  copy, so changing the policy means editing both implementations, both copies of the file, and
  running both suites.

## Consuming the API

Consequences of the backend's design, not preferences. Breaking them produces bugs that look like
backend bugs. Reasoning in [the bible](PROJECT_BIBLE.md).

- **Every response is an envelope**: `{ success, message, code?, data }`, on failure too, never
  HTML. `api/client/client.ts` unwraps it and throws `ApiError`; nothing above it sees the envelope. No
  field is marked `required` in `openapi.json`, so narrow rather than trust.
- **A code more than one module reads lives in `api/error-codes.ts`.** `PASSWORD_INVALID` is the
  only one so far: the password section, deactivation and both two-factor confirmations branch on
  it. A code only one module reads stays a constant in that module.
- **Branch on `ApiError.code`, never on the message.** Only some failures carry one
  (`EMAIL_NOT_VERIFIED` is the first), so a check reads the code and falls back to the message only
  where an older backend build is plausible.
- **Never branch on the exact 2xx code** — POSTs return `201` while the spec says `200`.
- **`uid` vs `id` is not interchangeable.** `User`, `Group`, `Task` are addressed by string `uid`;
  everything else by numeric `id`. Payloads are flat — foreign keys are ids, never nested objects.
- **`assignedToId` / `createdById` / `groupMemberId` are GroupMember ids, a third namespace.** Name
  them `memberId`, never `userId`. Resolve yours from `GET /api/group-members?groupId=`.
- **All timestamps are UTC with no zone marker** and parse as local if handled naively. Everything
  goes through `time/api-date/api-date.ts`: `parseApiDate` in, `toApiDate` out. **Writing back takes no `Z`**
  (the backend parses `ISO_LOCAL_DATE_TIME`).
- **`401` ends a session, `403` never does.** `401` → one silent refresh, then clear and `/login`.
  `403` → show a permission message, never log out, never retry. The exception is an endpoint that
  checks a credential from the request body, where `401` is that credential's verdict.
- **`429` is real and carries `Retry-After`.** Show the window; never auto-retry.
  `api/retry-phrase/retry-phrase.ts` composes the two into one message and every auth action uses it.
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
  they exist to catch. `time/api-date/api-date.test.ts` asserts the pin.
- **jsdom implements no `ResizeObserver`**, so `vitest.setup.ts` stubs it. A component that
  measures itself would otherwise throw on mount; the stub never fires, so a measured size simply
  stays absent.
- New logic in `src/lib/` gets a colocated test.

## Environment

`.env.local` is gitignored — never commit real values.

| Variable                       | Scope   | Purpose                                                                     |
| ------------------------------ | ------- | --------------------------------------------------------------------------- |
| `API_BASE_URL`                 | server  | Spring API origin                                                           |
| `SESSION_SECRET`               | server  | Key for the encrypted session cookie, unique per environment, ≥32 chars     |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | browser | Google Sign-In client id — **must match** the backend's `GOOGLE_CLIENT_ID`  |

All three are required and validated by `config/env/env.ts`; whitespace-only counts as missing. Our
origin must be in the backend's `CORS_ALLOWED_ORIGINS` and the Google client's authorized origins —
though the browser never calls Spring directly, so a CORS error means something is calling from the
wrong side.
