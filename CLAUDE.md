# CLAUDE.md

TasKlean frontend: Next.js + TailwindCSS web app (installable as a PWA) consuming the TasKlean REST
API.

This file is the reference: what exists, where it lives, and the rules. For the reasoning behind any
of it, see [PROJECT_BIBLE.md](PROJECT_BIBLE.md).

**Backend is a sibling repo**: `../tasklean-be` (`/add-dir ../tasklean-be` to read it). Its
`PROJECT_BIBLE.md` is authoritative on **API behaviour**, its `docs/openapi.json` on **API shapes**.
Never restate backend internals here, link to them.

## State

Built: the API layer, the session, the public home page, `/login`, `/register`, `/verify-email`,
`/forgot-password`, `/reset-password`, `/two-factor`, Google sign-in, `/app`, `/app/account`, all of
`/app/settings/*` and logout. Everything else behind the session does not exist.

**Groups are partly built.** `/app` lists them behind a search, a role filter and a sort, all held in
the URL and all answered by the backend. Creating one and joining by code work. `/app/groups/[uid]`
is a shell: a rail that stands still beside a scrolling section. The group's own path is **Tasks**,
which carries only a notice.

- `overview/information` holds every field a group has; `overview/members` is the roster an admin
  promotes, demotes and removes from, with leaving at the end. `overview/activity` is the group's
  trail, newest first; it reads one page and offers no filter yet.
- `settings/{preferences,notifications}` are everybody's, disabled with the reason beside them.
  `settings/{details,invite-code,delete}` are an admin's and redirect a member.
- **Tags & Categories is the only dead entry left in the rail.**

**Two-factor is complete for the one provider the backend has**: a gated sign-in, the methods list,
enrolling, turning it off and reissuing recovery codes. Every `/api/account/2fa` endpoint has a
caller.

**Verified against a real backend**: register, verification, password login, password reset, token
rotation and the whole two-factor section. **Against a stub only**: account, user-settings and
notification-settings. **Never run**: the group and membership endpoints. Every automated test is
MSW.

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

Next.js 16.4.2 (App Router, Turbopack), React 19.3, TypeScript 6 strict, Tailwind 4, ESLint 10,
Prettier, Vitest + MSW, `jose`, `lucide-react`, `zod/mini`, `uqr`. **Node 26** (`.nvmrc` +
`engines.node`); npm comes from Node's bundled copy, so a global npm install would silently shadow
it.

`typecheck` runs `next typegen` first because Next 16 generates `LayoutProps`/`PageProps` into
`.next/types`, so a bare `tsc` fails on a clean checkout. Prettier skips `*.md`
(`.prettierignore`).

### Running against a backend

| Target              | `API_BASE_URL`          | Notes                                                                                                               |
| ------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Local               | `http://localhost:8080` | `docker-compose up -d` + `./mvnw spring-boot:run` in `../tasklean-be`. Dev issues **1-year** access tokens, so refresh only fires if `JWT_EXPIRATION` is overridden. |
| Full stack (Docker) | `http://backend:8080`   | `docker-compose up --build` in the parent dir runs db, backend and frontend together. The compose file sits in `../`, outside both repos and outside git. |
| Staging (Render)    | _not recorded yet_      | Prod profile: 15-minute access tokens, no seed data, Swagger disabled.                                              |

Swagger UI (local only): http://localhost:8080/swagger-ui.html

### The container

`Dockerfile` is a three-stage build (deps, build, runtime) on `node:26-alpine`, running as a
non-root user and serving `next.config.ts`'s `output: "standalone"` bundle with `node server.js`.
`.dockerignore` keeps `node_modules`, `.next` and `.git` out of the context.

**The image takes no build arguments, and one image runs anywhere.** A build needs no environment at
all. `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is never inlined, because its only reader is `getEnv()` in a
Server Component that passes the value down as a prop. It is a **runtime** variable like the other
three, and missing it makes every Google sign-in fail with the generic error.

### Generated files

`AGENTS.md` is written by `next dev` and points agents at the bundled Next docs. **Leave it**:
deleting it makes Next write its marker block into CLAUDE.md instead. `next-env.d.ts` and
`.next/types` are generated and gitignored.

### Known install noise

- **5 "high" audit findings**: `braces` -> `micromatch` -> `fast-glob` ->
  `@next/eslint-plugin-next`, a devDependency chain. `audit fix --force` would downgrade
  `eslint-config-next` to 14.x. Leave it.
- **`unrs-resolver` and `msw` postinstalls are denied** (`allowScripts` in `package.json`).
- **`typescript` is pinned `~6.0.3`, not `^`**: typescript-eslint declares `<6.1.0`, and **TS 7
  throws** on a hard `versionMajor >= 7` guard, killing lint. Don't widen the pin.

## CI and deployment

Two workflows, mirroring the backend's split. `ci-staging.yml` runs on push and PR to `main`,
`ci-production.yml` on push and PR to `production`; a `main` into `production` PR promotes a
release. Both ignore `**.md`, `docs/**` and `LICENSE`.

```
staging      verify -> sonarcloud -> build-and-push -> deploy
production   verify -> sonarcloud -> version -> promote -> deploy -> release
```

- **One `verify` job** runs lint, typecheck, `test:coverage`, `format:check` and `build` in
  sequence, then uploads `coverage/lcov.info`. Splitting them would pay for four runner starts and
  four `npm ci` runs to parallelise gates that take seconds.
- **Sonar is a separate job** so the scan never shares an environment with `npm ci`, and it is
  skipped for a fork PR, which gets no `SONAR_TOKEN`. Config is `sonar-project.properties`, which
  also carries the one rule ignore: **S8776** on `globals.css`, where Tailwind's `@custom-variant`
  reads to a CSS parser as a nesting selector with no scoping root.
- **Production promotes, it never rebuilds.** Staging pushes `sha-<short>` plus a moving `staging`
  tag; production finds the `sha-` tag for the commit being released, or for `HEAD^2` when a merge
  commit sits on top, and retags that digest as the version and `latest`.
- **Render pulls tags**: staging `:staging`, production `:latest`. Health check path `/api/health`.
- **Every action is pinned to a commit SHA**, and `dependabot.yml` covers `github-actions` as well
  as `npm`, because a pinned SHA that nothing updates is a stale dependency.
- `.github/` also holds `pull_request_template.md`, the shape `/pre-commit PR` already produces.
- `permissions: contents: read` at the top of both files; only `version` and `release` ask for
  `contents: write`.
- **No `npm audit` gate**: the five known devDependency findings would fail every run. Dependabot
  covers that ground instead.

Secrets at repo level: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `RENDER_API_KEY`, `SONAR_TOKEN`.
Per GitHub Environment (`Staging`, `Production`): `RENDER_DEPLOY_HOOK`, `RENDER_SERVICE_ID`.

## Architecture

```
src/
  app/
    api/health/        the 200 Render polls; outside Proxy's matcher
    api/image/[uid]/   the bytes of one uploaded image, read from the private
                       bucket so no signed URL reaches the browser
    (app)/             the signed-in shell: layout.tsx, actions.ts (logout)
      app/             everything behind the session
        page.tsx       every group the caller is in, split admin / joined
        groups/        new/ and join/ (page.tsx + actions/ each), and [uid]/:
                       layout.tsx (the rail), page.tsx (the tasks a group opens
                       on), group.helpers.ts (the shared read)
          overview/    page.tsx redirects to information/; members/ is the
                       roster, with actions/ for a role change, a removal and
                       the leave that is the same call; activity/ is the trail
          settings/    page.tsx redirects to preferences/; actions/ serves the
                       admin sections; settings.helpers.ts is the shared read.
                       One directory per section: preferences/, notifications/,
                       details/, invite-code/, delete/
        account/       the profile page behind the avatar menu
        settings/      layout.tsx, page.tsx, sections.ts (Preferences, Security,
                       Account) and sections.types.ts, then one directory per
                       page: appearance/, language/, notifications/,
                       two-factor/, devices/ (+ page.helpers.ts), password/,
                       connected-accounts/, deactivate/
      uploads/actions/ the presign every picker shares, in a segment with no
                       page.tsx, so it is an action rather than a route
    (auth)/            brand panel + form shell, robots noindex. actions.ts is
                       the Google action both screens share; login/, register/,
                       forgot-password/, reset-password/, two-factor/
    (public)/          site header + footer shell; page.tsx is the home page,
                       the one indexable route
    error.tsx          the boundary below the root layout, with a retry
    globals.css        the only place colours, radii and fonts are defined
    icon.png           the favicon, by Next's file convention
    not-found.tsx      the 404
  assets/              images components import; next/image reads their size
  proxy.ts             the auth boundary (Next 16 renamed Middleware -> Proxy)
  hooks/               use-disclosure (a popup's open state and the ways out),
                       use-image-upload (a picked image on its way to the bucket)
  components/
    common/            primitives and what more than one screen shares: avatar,
                       account-menu, logout-button, masked-email, load-error,
                       form-notice, brand-mark, text-field, password-field,
                       code-input, two-factor-code-field, password-strength-meter,
                       submit-button, or-divider, greeting, copy-button,
                       qr-image, google-mark, busy-overlay, text-area,
                       switch-track, group-avatar, image-picker, recovery-codes,
                       invite-code/ (invite-code-field, share-invite)
    app/               signed-in components, one directory per screen
      chrome/          app-header (+ header-bar), group-breadcrumb (+ crumb-pill),
                       group-switcher (+ open-group-uid), add-task-button
      groups/          group-card, group-section, group-filters (+ group-search,
                       show-menu, sort-menu, no-matches), add-group,
                       add-group-bar, no-groups, create-group-form,
                       join-group-form
      group/shell/     group-sidebar (+ group-summary, group-description),
                       group-bar (+ invite-control), group-nav (+ nav-sections,
                       nav-entry, item-tone, open-group-area)
      group/overview/  member-row (+ member-actions, confirm-remove), leave-group,
                       activity/ (activity-row, activity-empty)
      group/settings/  settings-section, group-preferences, group-notifications,
                       edit-group-form, invite-code (+ rotate-invite-code),
                       delete-group
      settings/        settings-nav, then one directory per page: appearance/,
                       language/ (locale-select, our dropdown not the
                       platform's), notifications/, two-factor/, devices/,
                       password/, connected-accounts/, deactivate/
    auth/              login-form, register-form, verify-email-form,
                       two-factor-form, google-sign-in, google-button, back-link,
                       forgot-password-form, reset-password-form
    marketing/         site-header, site-footer, hero, hero-tilt, how-it-works,
                       feature-grid, comparison, cta-band
  lib/                 all non-UI logic; nothing sits directly in src/lib
    account/           account.ts (own password, connections, deactivation),
                       two-factor.ts
    audit/             audit.ts (one page of a group's trail), audit.types.ts,
                       entity/ (the type set, and the six a group holds),
                       labels/ (the line a row reads, from action + entity)
    api/               client.ts (the only module that knows the envelope),
                       errors.ts (the error types and the two generic lines),
                       error-codes.ts, server.ts (session-aware),
                       client.types.ts, retry-phrase.ts, credential-field.ts,
                       action-failure.ts
    auth/
      signin/          one per credential exchange: login, register,
                       verify-email, google, two-factor, plus outcome.ts
      tokens/          access-token.ts, refresh.ts (single-flight), logout.ts
      session.ts       the encrypted cookie; auth.types.ts the wire shapes
      device.ts        the device id cookie and its four headers
      two-factor-challenge.ts, password-reset.ts, google-nonce.ts
      safe-next.ts     blocks open redirect, owns SIGNED_IN_HOME
    config/env.ts      validated environment
    devices/           the caller's own devices and sessions
    groups/            groups.ts (create, join, mine, that list filtered,
                       detail, update, rotate, delete), groups.types.ts,
                       members/, role.ts (the one place a role is compared),
                       photo/ (our route, never the bucket), labels.ts,
                       filter/ (URL <-> query <-> endpoint params),
                       unavailable.ts (the 403), last-admin.ts (the 409)
    images/            fit-box/ (the size drawn at), resize/ (decode, redraw,
                       re-encode in the browser)
    notifications/     settings.ts (GET, and a batch PUT answering with the
                       whole matrix), settings.types.ts
    preferences/       preferences.ts (/api/user-settings), theme-cookie.ts,
                       theme-attribute.ts (client-safe)
    qr/                qr-code.ts (the encoder, server only) + types
    time/              api-date/ (API timestamps <-> Date), relative/ (how long
                       ago, in words, drawn in UTC)
    uploads/           uploads.ts (the presigns), uploads.types.ts (caps the
                       browser reads too), put-object/ (the browser's PUT)
    users/             me.ts, name.ts (display name and initials)
    validation/        rules.ts (field-level Zod pieces), parse.ts, forms/ (one
                       <form>.schema.ts each, plus upload-request),
                       password/ (policy.ts, strength.ts), code-length.ts
  test/                msw.ts, server-only-stub.ts, password-policy-vectors.json
                       (mirrored from the backend, run by policy.contract.test.ts)
```

**Depth follows need, not symmetry**: `signin/` groups five modules because five endpoints exchange
a credential, where `session/` is one module and stays one. **Server Actions stay with their
route**, not in `components/`. **A signed-in component lives under the screen that shows it**, so
`components/app/` mirrors the route tree. A component used by two screens, or carrying none of its
feature's knowledge, moves to `components/common/`. **Tests sit beside the code** they cover.


## Conventions

### Types and components

- **TypeScript strict, no `any`**: `unknown` plus a narrowing guard at boundaries.
- **Props are read-only at the signature**: `}: Readonly<FooProps>)`, while the type stays a plain
  `type FooProps` so one declaration serves anything composing the component.
- **Server Components by default.** `'use client'` only for state, effects, handlers or browser
  APIs, pushed as far down the tree as possible.
- **A client component never reads the environment.** A Server Component calls `getEnv()` and passes
  the value down as a prop. That is how the Google client id reaches the browser, and it keeps
  `config/env/env.ts` as the only gate.
- **Environment comes from `config/env/env.ts`**, never `process.env` (`NODE_ENV` is Next's,
  exempt). **No secrets in `NEXT_PUBLIC_*`**; the Google client id is the one public value.
- **Components never call `fetch`.** All HTTP goes through `request()` in `api/client/client.ts`,
  which takes the access token as a parameter and knows nothing about sessions. **The bucket is the
  one exception, both ways**: `api/image/[uid]` fetches a presigned object URL and
  `uploads/put-object` PUTs bytes to one. That is not our API, carries no envelope and deals in
  bytes, and nothing of ours rides along: the URL is the credential.

**A module reading a server variable, holding a secret, calling `serverApi` or touching a cookie
imports `server-only`**: `config/env`, `api/client`, `api/server`, `api/action-failure`,
`auth/session`, `auth/device`, `auth/signin/*`, `auth/tokens/refresh`, `auth/two-factor-challenge`,
`account/`, `audit/audit.ts`, `devices/`, `users/`, `groups/groups.ts`, `groups/members`,
`uploads/uploads.ts`,
`qr/qr-code` (not for a secret: it keeps the encoder out of the browser bundle),
`notifications/settings`, `preferences/preferences.ts`, `preferences/theme-cookie`.

It must **not** be imported by anything a client component imports: all of `validation/`,
`qr/qr-code.types.ts`, `preferences/preferences.types.ts`, `preferences/theme-attribute`,
`notifications/settings.types.ts`, the four group modules a row in the browser reads
(`groups/groups.types.ts`, which `rules.ts` imports for the role enum, `groups/role`,
`groups/unavailable`, `groups/last-admin`), the three audit modules a feed in the browser reads
(`audit/audit.types.ts`, `audit/entity`, `audit/labels`), and the two upload halves that run in the
browser
(`uploads/uploads.types.ts`, `uploads/put-object`).

### Styling

- **Tailwind utilities only.** No CSS modules, no styled-components, no inline `style` except a
  genuinely dynamic value. Extract a component, not an `@apply` class.
- **Every colour, radius and font is a token** in `globals.css`, named by role (`card`,
  `muted-foreground`, `destructive`) never by appearance. Never hard-code a hex or rem elsewhere.
  **[DESIGN.md](DESIGN.md) is the design authority**; `globals.css` implements it, with Tailwind's
  names rather than DESIGN.md's Material ones and a comment naming each value's origin. Typeface
  **Plus Jakarta Sans** via `next/font`.
- **Dark follows the OS unless the reader chose otherwise.** `globals.css` defines the condition
  once as `@custom-variant dark`, so the palette is written once. `data-theme` on `<html>` is the
  override, written by the root layout from the theme cookie so the first paint is right. The four
  `swatch-*` tokens never flip (the picker shows a scheme rather than wearing it), nor do the four
  `google-*` brand colours.
- **The hand cursor comes from one base rule in `globals.css`**, not a `cursor-pointer` per button,
  since Tailwind 4's Preflight dropped it. It excludes `:disabled`, so a dead control keeps
  `disabled:cursor-not-allowed`.
- **Two utilities for one property fight in the stylesheet, not in the class list.** `items-end`
  beside `items-center`, or `font-bold` beside a `text-label-*` token that carries a weight,
  resolves by Tailwind's output order and the class attribute has no say. Set each property in one
  place.
- **Images are static imports from `src/assets/`**, rendered with `next/image`, never a bare `<img>`
  and never `public/`, which costs the intrinsic size and the blur placeholder. The logo has a
  dark-mode twin, so render `BrandMark`. **A remote profile photo is the exception**: it has no
  build-time size, so `next.config.ts` allowlists the hosts the optimizer may fetch and `Avatar`
  falls back to initials for anything else, since an unlisted host makes `next/image` throw and
  takes the page with it.
- **Icons from `lucide-react`** as components, never an icon font, picking the nearest equivalent to
  the design's Material Symbols, `aria-hidden` when a text label says the same thing. **A brand mark
  is the exception**: lucide carries none, so `GoogleMark` is an inline SVG using `google-*` tokens
  rather than hex in the path.
- **Mobile-first.** Narrow first, then widen. Touch targets >=44px, keyboard-reachable, labelled.
  Check phone, tablet and desktop; tablet is the one that gets skipped.
- **Full height is `min-h-svh`, never `dvh`.** A dynamic viewport grows when the phone address bar
  hides, which leaves the page scrollable and shifts centred content.
- **Motion is opt-out.** Anything that moves sits behind `motion-safe:` or a
  `prefers-reduced-motion` check, and anything cursor-driven ignores a `pointerType` other than
  `mouse`. A hover shadow may stay under reduced motion; the movement may not.

### Forms and validation

- **Forms validate in one place, twice.** Rules live in `validation/`; the client component and the
  Server Action call the same function, and the action is the authority because it runs without JS.
  Inputs are **controlled**, since React resets an uncontrolled form after its action returns.
- **Every form is a `zod/mini` schema** at `validation/forms/<form>.schema.ts`, named
  `<form>Schema`, composing `rules.ts`, parsing through `parseWith` and exposing `parseX` for its
  action and `validateX` for its component. Nothing in `password/policy/policy.ts` becomes a schema:
  the strength meter needs per-rule booleans.
- **An action parses `Object.fromEntries(formData)`**, never `formData.get` by hand, because the
  schema owns trimming: a password reaches the backend exactly as typed while text fields do not.
  The one exception is a **checkbox group**, where the name repeats and `fromEntries` keeps only the
  last box, so those fields are read with `getAll`.
- **A field shows only its first unmet rule**, so the order in `rules.ts` is the order a user is
  asked to fix things.
- **A field complains on blur, but only once it has content.** Empty fields wait for submit. The
  password is never echoed back through server state; other values are.
- **A required field is marked with a `*`, and nothing marks an optional one.** `TextField` renders
  it from the input's own `required`, outside the `<label>` and `aria-hidden`: the native attribute
  is what a screen reader announces, and an asterisk inside the label would change the accessible
  name and break every `getByLabelText`.
- **A `labelAction` renders after the input, not before it**, placed back with `absolute`, so tab
  leads into the field rather than past it.
- **The client's complaint wins while it is visible; the backend's stands until the field is
  edited**: `shown = (visible ? clientError : undefined) ?? (edited ? undefined : serverError)`.
  Reading it as `visible ? clientError : serverError` swallows every refusal of a well-formed value,
  because `submitted` is true from the press onwards. Forms carrying it reset `edited` when a new
  action state arrives, in render rather than an effect.
- **First names reject internal spaces; last names allow them.** Both trim surrounding whitespace.
- **A `select` or checkbox whose value lives in React state cancels the form reset** with
  `onReset={(event) => event.preventDefault()}`: React resets the DOM once the action answers and
  never rewrites a controlled value it did not change. **A text input does not need it**, nor does a
  hidden input, because React writes the value into the attribute a reset restores.
- **A complete code submits its own form.** `CodeInput` calls `requestSubmit()` from an effect once
  six digits are in, so the form's own validation and action still run. It fires on a keystroke or a
  paste, never on a code that arrived with the component, which is a value to look over.

### Errors and feedback

- **Errors surface, never vanish.** Every mutation has a visible success and failure state, and
  never a bare "Something went wrong" when the envelope carried a `message`. A screen that loads
  data catches `ApiError` and renders `LoadError` inline, keeping the rest usable; the route boundary
  is for failures nobody anticipated, and `SessionExpiredError` redirects to `/login`.
- **A Server Action reports a throw through `actionFailureMessage`**, the one place that composes
  the 429 window, falls back to the generic line and redirects a dead session.
- **A status code is never in a message a reader sees.** The status is on `ApiError` for branching,
  so `client.ts` falls back to `GENERIC_FAILURE`. That constant and `UNREACHABLE` live in
  `api/errors`, which `client.ts` and the actions both import: the other way round is a cycle.
- **Nothing answering at all is its own error, with its own line.** A refused `fetch` becomes
  `ApiUnreachableError`, so "We could not reach TasKlean" is said instead of "try again", which is
  the wrong advice while the backend is down. An `AbortError` passes through untouched. The auth
  actions, which write their own wording, wrap theirs in `unreachableOr`.
- **A notice is a `FormNotice`, and never wears `bg-muted`**, the fill every `TextField` and
  `CodeInput` is painted in. The tones are the vocabulary: `success`, `info` for something that
  merely happened, and `error`, the only one that interrupts as an `alert`.
- **A success notice says what the action did, not what the page now reports.** Setting a first
  password flips `passwordSet` before the notice is read, so the state carries
  `done: "changed" | "set"` rather than a boolean.
- **Anything an action hands back only once must survive a re-render.** Recovery codes exist nowhere
  else, so the component holding them stays mounted whatever the server then says, the action does
  not revalidate, and dismissing them is its own state. Writing a cookie in an action re-renders the
  route just as `revalidatePath` does.
- **A destructive button confirms in place**, swapping itself for a question and a cancel rather
  than opening a dialog or trusting `window.confirm`. It is an outlined red pill
  (`border-destructive/40 text-destructive hover:bg-destructive-subtle`) and the confirmation is
  filled, so the escalation shows. **The warning it reveals is `text-destructive`**; behind a
  neutral button it stays `text-muted-foreground`, which is why `ConfirmAction` is told its tone.
- **A control that cannot be used yet stays a disabled button, with the reason beside it**, since
  prose where a button belongs reads as a stray notice. **Where there is no room beside it, the
  reason goes in its name** ("coming soon"), as in the header, a narrow rail and the bottom bar. The
  add-task button **keeps its brand colour while disabled**, being the one thing the bar exists for.

### Data and caching

- **A read two renders in one request both need is wrapped in `cache()`.** `getMyGroups` and
  `getGroup` are, because `request()` sends `cache: "no-store"` so fetch will not dedupe them. React
  memoises per request, so the second caller gets the first one's promise and a failure reaches both.
- **A group's audit trail is never memoised and never shared.** `getGroupActivity` is the one read
  whose rows differ per caller for the same URL, so a cache keyed on it leaks between accounts.
- **An action revalidates only when the page's truth comes from the server.** Devices, password and
  connected accounts render rows and flags the action cannot hand back, so they call
  `revalidatePath`. Appearance, language and notifications return the saved value and render from
  it, so revalidating only buys a second fetch: the route is dynamic and has no cached copy.
- **A page of switches edits a draft and saves it in one press.** The matrix is state, the switches
  are real checkboxes posting one list of type names per channel, and the action sends the whole
  matrix in one batch, reading nothing before or after and revalidating nothing. A reminder appears
  the moment the draft differs from what is saved, and a refused save keeps the draft.

### Accessibility and popups

- **A dropdown is ours, not the platform's.** `LocaleSelect` is a button plus a `role="listbox"`,
  focus kept on the button with `aria-activedescendant`, value posted by a hidden input. Two rules
  make it work: the popup cancels `mousedown`, or the button blurs and the list closes before a
  press lands; and Enter and Space cancel the default, or the browser fires a second toggle. Each
  row is a `<button role="option">` with `tabIndex={-1}`. The cost is that it needs JavaScript.
- **A tickbox is a real checkbox under the paint**: the input `sr-only` inside a `<label>`, the row
  carrying the focus ring with `has-[:focus-visible]:`. A button wearing `role="checkbox"`
  reimplements what the browser gives, and assistive tech treats the two differently.
- **A popup that navigates is a disclosure, not a listbox.** `AccountMenu` and `GroupSwitcher` hold
  links, so Tab already moves correctly and a roving tabindex would take that away. `LocaleSelect`
  is a listbox because it posts a value instead.
- **A popup's open state is `useDisclosure`, never a second copy of it**: the state, the
  press-outside close and the Escape that hands focus back to the trigger.
- **A field that appears on a press takes focus through a ref, never `autoFocus`**, which cannot
  tell an editor that was asked for from one that loaded on its own and is a finding wherever it
  sits.
- **A live region with no name is an `<output>`**, which carries `role="status"` already, so the
  attribute is noise and `getByRole("status")` still finds it. `role="alert"` has no element of its
  own and stays an attribute.
- **A name built from two elements needs an `aria-label`, because the computation trims each node.**
  A label beside a chip comes out as `MembersSoon`, and a hidden separator span does not survive, so
  every entry in a group's nav spells its name out. JSX also strips the whitespace between two
  elements, so this is not a jsdom artifact.
- **A wait that cannot be missed covers the card, not a line under the button.** Google's popup has
  already closed when the action starts, so a caption below the widget read as nothing happening.
  `BusyOverlay` is an `absolute inset-0` scrim, which makes the card's `relative` load-bearing.
- **Google's button sits in a fixed box, not a floor.** Google renders inline elements on one origin
  and an `<iframe>` on another, and the iframe measures 80px before settling at 44, so the slot is
  `h-13` with `overflow-hidden`. Local only serves the inline one, so this is a staging check.

### Groups

- **A group screen reads its uid from the route, never from state.** `/app/groups/[uid]` is the
  authority, `GET /api/groups/{uid}` answers with `myRole`, and there is no active-group cookie to
  go stale.
- **The rail owns the group's identity; a section page owns only its section.** `GroupSidebar`'s
  card carries the `h1`, the description and the member and role line, so no section repeats them.
  `group.helpers.ts` holds the one `loadGroup` every screen calls, so the 403 bounce and the inline
  failure are written once.
- **The card's chips are its corner, and the description's own text is the toggle.** Picture left,
  count and role chips right, coloured not outlined, the sentence they add up to `sr-only`. The
  clamp goes by character count, and the description is drawn in an open rail only.
- **A group's description is capped at 500, where the backend allows 2000.** `rules.ts` owns the
  number, so the schema and the textarea's `maxLength` cannot drift. A `TextArea` with a `maxLength`
  shows an `aria-hidden` live count beside its hint.
- **A `TextArea` grows with what is typed, and `field-sizing` cancels `rows`.** `min-h-24` is the
  floor that replaces it.
- **A card fills its grid track with `w-full` and reserves its description's two lines**, or cards
  in one row come out different sizes.
- **A roster manages everyone but you, and leaving is a band rather than a row.** `LeaveGroup` at
  the end of Members is where it lives, because the roster call is the only one returning your own
  membership uid. The rail's "Leave group" points at `#leave-group`.
- **A membership press posts the group as well as the membership**, through `uidRule`: an action
  never sees the route's params. It revalidates the group's **layout** and `/app`, not just the
  roster.
- **The group list's filter is the URL, and the backend answers it.** `/app?q=&show=&sort=` is the
  whole state, so a filtered list is a pasteable link. `groupApiQuery` is the one place the URL's
  tokens become the endpoint's enums. **Nothing is sorted or narrowed on the client.** **Both boxes
  start ticked and the last ticked one is disabled**, so `show` is never empty.
- **The search box is local state pushed on a delay; every other control pushes at once.** It
  commits 300ms after typing stops. **The URL wins** when it changes underneath, in render not an
  effect, and **a pressed filter carries whatever is in the box**; neither applies while a push of
  ours is in flight.
- **A dropdown panel names the edge it hangs from.** `PANEL` sets no horizontal position: the show
  menu adds `left-0`, the sort menu `right-0`.
- **The two ways into a group are a bar on a phone and the title row on a desktop.** `AddGroup` is
  `hidden lg:flex`, `AddGroupBar` is `lg:hidden`. Each half of the bar is `flex-1 min-w-0` and
  **both carry the border**, colour apart. The list pays `pb-space-3xl` below `lg` so the bar clears
  its last card.
- **A group opens on its tasks, and the overview is a route of its own.**
- **A group's settings and its overview are areas of sections, and the role decides how many.** Each
  section is a route, so a member never loads the invite code and `aria-current` comes from the
  path. Preferences and Notifications are everybody's; details, invite code and delete are an
  admin's, and `loadAdminGroup` redirects a member. Each action still reports its own refusal: the
  gate is UX, Spring is the authority. A form in a section is bounded at `max-w-2xl`.
- **A step that cannot be undone asks for the name, not a second press.** `DeleteGroup` matches the
  typed name trimmed and case-insensitively. **Replacing the invite code confirms neutrally**,
  because nothing is lost.
- **A trail's line is ours, keyed on the action and the entity together.** The backend's
  `actionMessage` is the fallback for a pair we have no copy for, and stands alone, being a whole
  sentence. `auditSentence` returns one string, since a name built from two elements loses the space.
- **A trail's timestamp is relative, with the exact UTC value in the `title`.** `time/relative` pins
  the zone because the row renders on the server, and gives a date past a month.
- **The invite code is a field with its presses beside it.** `InviteCodeField` paints it like every
  other field with the copy press inside as an icon; the replacement and the disabled share are
  round icon presses at the field's height, which `CODE_ACTION` is the one place for.

### The group shell

- **The header is as wide as the page under it.** `HeaderBar` reads the path: it spans the window on
  a group's own screens, and keeps `max-w-app` everywhere else.
- **The signed-in shell is a grid, so a page can fill the height.** `(app)/layout.tsx` is
  `grid-cols-1 grid-rows-[auto_minmax(0,1fr)]`. Both halves are load-bearing: a flex column shrinks
  every centred page, and an implicit column takes the width of the widest thing on it.
- **The rail stands still, and the page beside it scrolls.** `lg:sticky` at `lg:top-header`,
  `calc(100svh - var(--spacing-header))` tall, with its own `lg:overflow-y-auto`, in a shell that is
  `lg:items-start`. `--spacing-header` is the one place the header's height is written, and the
  `<header>` wears it with its bottom border inside.
- **The rail's scrollbar is `scrollbar-slim`**, a `@utility` whose `scrollbar-width` is scoped to
  `@supports not selector(::-webkit-scrollbar)`, because Blink ignores the 6px if it can see it.
- **A collapsed rail is an `lg:` class, never a second tree.** A collapsed label is `lg:hidden`,
  which takes it out of the accessible name, so every entry carries an `aria-label` and the `h1`
  goes `lg:sr-only` rather than away.
- **A group's sections are two bands, and each behaves differently below `lg`.** Workspace is the
  daily work, Administration the group itself. Below `lg` Workspace is the strip above the section
  and Administration moves into the bottom bar's More menu, which the band itself says
  (`phone: "strip" | "menu"`). `NavEntry` renders an entry wherever it lands.
- **The rail's top band is the open area's own sections, headed by the way back.** `navSections`
  takes the path and the role. Only the open sub-section is marked, never the area, which is why
  both Administration entries point at a path that redirects.
- **Inside an area the group's card gives up its space, at `lg` only**, keeping the `h1` as
  `lg:sr-only`. **The paint it drops is written in one place per state**, since `lg:p-0` beside
  `lg:p-space-md` resolves in the stylesheet.
- **The group pill is two controls in one border**: the name navigates, the `ChevronsUpDown` arrow
  opens the list, and each half is a real element with its own name.
- **The header carries a trail at `lg` and the pill alone below it.** Four crumbs at the deepest,
  each two halves like the pill and each dropping its own list. **A crumb wears no border until
  hovered**, with a `/` between. Its sections come from `navSections`, so the trail cannot disagree
  with the rail, and **a crumb is keyed by its level, never its href**, because a group's own page is
  both the group and its tasks. `MY_GROUPS_LABEL` lives in `groups/labels`.
- **A phone's bottom bar carries one label at a time.** The add-task pill at `flex-2`, then a
  `flex-1` pill holding the invite control for an admin and the Administration button; whichever
  panel is open takes the label. The task pill wears `bg-primary`, an open control `bg-secondary`.
  Both panels hang off the `flex-1` pill, not the control that opened them, and **the two controls
  share one `useDisclosure`** so pressing one while the other is open switches panels.

### Images and uploads

- **A group's picture is an uploaded file, addressed by uid and painted as a background.** The bucket
  is private, so `Group.photoUid` is an upload rather than a URL and `lib/groups/photo` turns it into
  `/api/image/{uid}`. The avatar is a square with the group's first letter where a person's is a
  circle with initials, and **the letter is always drawn, with the picture as a layer over it**: a
  background that 404s paints nothing, so a dead upload falls back with no handler, no state and one
  request. An `<img>` would draw the browser's broken glyph whatever its `alt` says. `GroupAvatar`
  is the one place an inline style is used, for the URL. `Avatar`, for a person, is `next/image` and
  **`unoptimized`**: our route is guarded by the session and Next's optimizer drops cookies from its
  own fetch, so an optimized src would be refused and draw nothing.
- **The image route tells a missing object from a broken bucket.** A read is presigned without
  checking the key exists, deliberately, since a `head` per avatar is a round trip, so a bucket that
  lost its objects while the database kept its rows answers 404 and the route passes that on. Every
  other failed read stays a 502. Nothing clears the dead `photoUid`: a write driven by a render
  would delete a good picture on a passing outage.
- **Saving a group replaces it, so an omitted `photoUid` is how a picture is removed.** `PUT
  /api/groups/{uid}` takes the group as it will then be, so `EditGroupForm` posts the uid the group
  already holds on every save that is not a removal, and never a blank one: `""` passes the
  backend's validation and then fails the lookup behind it as a 400. `optionalUidRule` enforces it.
- **The picture is the one JS-only field, and it cannot be set while creating a group.** The bytes
  must reach the bucket and come back as a uid before the form can be sent, so `EditGroupForm`
  intercepts its own submit, which is also why `SubmitButton` does, **which is why the press reports
  itself through two flags**: `busy` covers the upload, which no form submission covers, and
  `useActionState`'s pending flag covers the save, since `useFormStatus` sees only a dispatch made
  inside the submit event. Without JavaScript the native post still saves the name and description
  with the picture echoed unchanged. Creating a group offers no picture, because the backend refuses
  to attach an upload to a group that does not exist yet.

### Housekeeping

- **No em or en dashes.** Not in UI copy, not in comments, not in docs. Older files get swept as
  they are touched.
- **Line endings are LF**, pinned by `.gitattributes`. A CRLF checkout fails `format:check` on every
  file and looks like a formatting problem.
- **Run `/pre-commit` before committing**: gates, conventions, docs, message. It never commits.
- **Commit prefixes**: `fix:` -> patch, `feat:` -> minor, `BREAKING CHANGE:` -> major.

### File layout

**Every file reads in one order**: imports -> types -> metadata and module config -> variables ->
content. Module-level constants and state go in the variables block, not between functions.
`metadata`/`viewport` and `proxy.ts`'s `config` count as config. One blank line between sections,
because Prettier collapses more and offers no option.

**A module with companion files is a directory.** The moment anything else is about one module, its
test included, the set moves into `<module>/` and the module keeps its name:
`login-form/login-form.tsx` beside `login-form.test.tsx`, `client/client.ts` beside `client.test.ts`
and `client.types.ts`. There are no `index` files, so a path still says which file it means. That
holds in `src/lib` too.

**Some files stay flat, because the framework fixes where they are**: `src/proxy.ts` and the
router's own `page.tsx`, `layout.tsx`, `route.ts` and `error.tsx`. Companions sit beside them, as
`devices/page.helpers.ts` does. `proxy.ts` is the dangerous one: read the gotcha in the bible before
moving it.

**One component per file, and a component's parts live with it.** A sub-component is its own file
named after what it exports. What several parts share is named after the owner:
`<module>.types.ts`, `<module>.styles.ts`, `<module>.helpers.ts`, and **helpers collect into that
one file** rather than one file each. Two functions stay in one file where the second is private to
the first, as `clock` is to `expiryNote`, or where they share module state, as the Google helpers do.

**Types move out at two.** A module declaring more than one type keeps them in a sibling
`<module>.types.ts`, which is then the single import source: never re-export them. A type derived
from a value in the module stays with it (`env.ts` keeps `RequiredKey`), and dependency order then
wins over section order.

**Every page exports `metadata`, directly after the imports.** Titles are the bare page name, since
the root layout owns `template: "%s - TasKlean"`. The homepage sets none. A `metadata` export is
**impossible in a client component** and fails silently. Auth routes are `noindex` via the `(auth)`
layout.

### Comments

- **File header**: one to three lines on any non-obvious module: what it is _for_, plus the single
  thing a reader must know. No history, no essays, no restating exports. Plain presentational
  components get none.
- **Functions**: TSDoc on **every function, exported or not**, including pages and layouts. One-line
  imperative summary; `@param`/`@returns`/`@throws` only where not obvious from name and type.
- **Types**: a `//` above a field only when the type cannot carry the meaning (units, which id
  namespace, what `null` means). **Never one per field.**
- **Inline**: `//` above the line, never trailing, explaining the _why_. Only when the code is
  correct but looks wrong, encodes a backend quirk, or rejects an obvious alternative. **One line.
  Two at the absolute most.** Three is a violation, not a judgement call: if it needs more, it
  belongs in the bible and the comment belongs deleted. Default to none.
- **No worked examples.** State what the code does; a demonstration belongs in a test.
- **Tests get no comments at all**, helpers included. The `it(...)` description is the comment.
- **Upkeep**: update or delete a comment in the same change as the code beneath it.

## Session and auth

- **The session is an encrypted cookie**, `tasklean_session`, sealed with `jose` as a **JWE** (not
  signed: a signed payload is readable base64url and ours carries the refresh token). It holds the
  token pair and `userUid`. `auth/session/session.ts` exports the name and options so `proxy.ts`
  cannot drift. **There is no server-side store**; the sealed tokens live in the browser.
- **Proxy is the auth boundary and the only refresh site on the navigation path.** Default deny:
  everything is protected unless in `PUBLIC_PATHS`. `/api` is excluded from the matcher so Route
  Handlers answer `401` instead of redirecting to HTML.
- **Never refresh where the rotated pair cannot be persisted.** Refresh tokens are single-use, and
  cookies can only be written in Proxy, a Route Handler or a Server Action, **never in a Server
  Component render**.
- **`serverApi()` is session-aware; `request()` is raw.** `serverApi` throws `SessionExpiredError`
  on `401` and deliberately does not refresh; `403` passes through as `ApiError`. It attaches the
  device headers and spreads them **last**, so no caller can substitute its own address or the
  secret vouching for it.
- **`credentialCheck: true` is the one opt-out, and only `/api/account` uses it.** Those endpoints
  verify a password or a Google token we just sent, and the backend answers a wrong one with `401`
  carrying no code, so without the flag a typo would sign the person out.
- **Mutations use Server Actions, not Route Handlers.** Next checks `Origin` against `Host`, so CSRF
  is covered without a token of our own.
- **Everything behind the session lives under `/app`.** The prefix makes the boundary legible in the
  URL and keeps a marketing page and an app route from colliding. Protection does not depend on it.
- **`/app` is the signed-in home, and `/` stays public.** A visitor with a session is bounced off the
  auth screens to `SIGNED_IN_HOME`, never off the marketing page. `safe-next.ts` owns that constant.
- **Role checks in our code are UX, never authorization.** Spring is the authority: gate the UI
  optimistically *and* handle the `403`.

### The chrome

- **The chrome knows whether you are signed in, and that costs `/` its static render.** Both layouts
  read the session once and pass `signedIn` and `name` down. Signed in, the public chrome swaps
  "Log in" and "Get started" for "Go to app".
- **The signed-in chrome costs one group read per render, and a failed one costs only the
  switcher.** `(app)/layout.tsx` reads `/api/groups/mine` and catches everything, so an outage leaves
  the header without a switcher rather than taking the page. `getMyGroups` is `cache()`d.
- **The display name rides in the session cookie**, carried by every auth response including
  refresh, so the chrome can greet by name without an API call per page. Display only, and may be
  stale.
- **So does the avatar, but it costs one call at sign-in.** `AuthResponse` has no `photoUrl`, so
  `startSession` reads `/api/users/me` once and seals it. Best effort: a failure costs an avatar,
  never a login. Every sign-in path goes through `startSession`, never `setSession` directly.
- **Sign-in caches the theme as well as the avatar.** `startSession` reads `/api/user-settings` and
  writes `tasklean_theme`, always, so a browser never keeps painting the theme of whoever used it
  last. The API stays the authority.
- **Proxy keeps that cache honest, so the theme follows the account across devices.** Every request
  ending in a document render re-reads `/api/user-settings` and writes the theme onto the **request**
  as well as the response, so the render in flight paints the new scheme. There is no trust window:
  one was tried and it swallowed the case the cache exists for. An RSC payload is skipped because it
  cannot repaint `<html>`, told apart by `sec-fetch-dest` since Next's own `RSC` header never reaches
  Proxy. A failed read keeps the cached colour.

### Devices and the client IP

- **Every browser carries a device id, minted by Proxy into `tasklean_device`.** The backend binds a
  refresh token to it, so a session has a stable identity across rotation and can be listed and
  revoked per device. A cookie rather than browser storage, because refresh happens in Proxy, which
  cannot reach `localStorage`. `auth/device/device.ts` owns it and builds the four headers:
  `X-Device-Id`, `X-Device-User-Agent` (the real browser UA, since the transport one on this hop is
  Node's), `X-Device-Ip` and `X-Internal-Hop`.
- **Nothing reaches the backend without them.** `serverApi()` attaches all four to every
  authenticated call. Calls outside a session take them as a parameter: register, both
  password-reset steps, resend-verification, every sign-in exchange, `startSession`'s two reads, and
  the refresh and theme reads Proxy makes, which use `deviceHeadersFor` since `next/headers` is
  unreachable there. Logout sends them but derives the device from the token's own binding. Proxy
  mints the id only on the auth screens and for signed-in requests.
- **The end user's address is forwarded explicitly, and `CF-Connecting-IP` is the only safe
  source.** Every API call is a server-to-server hop, so the backend's socket sees Cloudflare's edge.
  `X-Device-Ip` carries the real address and `X-Internal-Hop` carries `BFF_HOP_SECRET`, which is what
  makes the backend honour it. Cloudflare sets `CF-Connecting-IP` from the TCP peer, while it only
  *appends* to `X-Forwarded-For`, so that header's leftmost entry is caller-chosen and reading it
  would launder a forged address into a trusted one. `device.ts` forwards a single bare literal or
  nothing, and the secret never rides without an address to vouch for.
- **Logout is best effort at the backend, certain in the browser.** `revokeSession` failing must
  never leave someone in a session they asked to leave, so the cookie is cleared either way. It ends
  **this device only**; signing out everywhere and removing every device are separate calls, and
  both end this session too.

### Google sign-in

- **One endpoint for both screens.** `POST /api/auth/google` signs in, links or provisions by
  itself, so `/login` and `/register` share one Server Action and differ only in Google's label.
- **Every attempt carries a nonce, and the two values are not interchangeable.** Proxy mints the raw
  value into an httpOnly cookie and forwards only its **lowercase hex SHA-256** to the page, which
  hands that hash to Google; the action sends the **raw** value to the backend, which rehashes and
  compares. Sending the hash to the backend would make a stolen token replayable.
- **The nonce is single use, and only a success spends it.** A refused attempt keeps its own, because
  `google.accounts.id.initialize()` cannot be called twice in one document and a second call lets
  Google mint a credential the backend refuses. An attempt finding no nonce mints one and the widget
  reloads to take it up. Proxy drops a leftover one on the first signed-in request.
- **Proxy mints one on `/app/settings/connected-accounts` too**, the one signed-in response that
  keeps its nonce, because linking happens while signed in.

### The second factor

- **A sign-in can end in a challenge instead of a session.** `login` and `google` answer with
  `twoFactorRequired` and a `challengeToken` and no tokens at all, so both return a `SignInOutcome`
  union and `signin/outcome/outcome.ts` is the only place reading either response. Reading `token`
  without checking the flag first looks like a successful login and leaves the browser with no
  session.
- **The challenge rides in an httpOnly cookie, not the URL or a hidden field.** It is a credential
  with a five-minute life, so `auth/two-factor-challenge/` owns `tasklean_2fa_challenge` and the
  verify action reads it from there, ignoring anything a form posts under that name.
- **`/two-factor` is public, and guarded twice.** A visitor finishing a gated sign-in has no session
  by definition, so the path is in `PUBLIC_PATHS`; the page redirects to `/login` with no challenge,
  and `AUTH_PATHS` bounces anyone who has a session. Being in `DEVICE_PATHS` is what mints the device
  id, which `verify` has to send: the device row and the new-sign-in email are created there, not at
  login.
- **A 401 from `/api/auth/2fa/verify` is about the code, not the session.** Two codes end the
  attempt: `TWO_FACTOR_CHALLENGE_INVALID` clears the cookie and returns to `/login?expired=2fa`, and
  `ACCOUNT_DEACTIVATED` to the notice login already has. Every other 401 shows against the code
  field. **Refresh is not gated**, so a returning browser is never asked for a code.
- **One field takes either kind of code.** `twoFactorCodeRule` accepts six digits or an
  eight-character recovery code and normalises the way the backend matches: spaces and the hyphen
  stripped, uppercased. The screen offers a toggle because the two look nothing alike to type.
- **Enrolling is two calls, and only the second turns anything on.** `/2fa/setup` re-authenticates
  with the password and answers with the secret and an `otpauth://` URI; `/2fa/enable` takes a code
  from the app and answers with ten recovery codes **plus a fresh token pair**, having revoked every
  other session. Both carry `credentialCheck: true`, and `enable` carries the device headers so the
  pair stays on this browser. Running `setup` again replaces a setup nobody confirmed, so the entry
  already in the app stops working.
- **Turning it off and reissuing codes ask for both credentials.** `/2fa/disable` and
  `/2fa/recovery-codes` take one `{ password?, code }` body, so one schema and one form serve both,
  and the code is **spent** either way. Only `disable` answers with a fresh pair, and sealing it
  re-renders the page with the factor off, so the component holding the confirmation must outlive it.
- **Only an authenticator code can confirm a setup**: `/2fa/enable` has no recovery codes to fall
  back on yet, so that form uses `codeRule`, not `twoFactorCodeRule`.
- **Only the authenticator app exists.** Email and Text message are listed with a dead "Coming soon"
  button, and the backend's `TwoFactorProviderType` has only `LOCAL`. `TwoFactorMethod` refuses to
  render children for a method marked unavailable, so no form can appear behind one by accident.
- **The QR code is encoded on the server.** `lib/qr/qr-code/qr-code.ts` turns the URI into one SVG
  path, so `uqr` never reaches the browser bundle. `qr-ink` and `qr-paper` never follow the colour
  scheme: a camera reads dark modules on a light field in either one.

### Passwords and credentials

- **A password change reseals the session.** `/api/account/change-password` and `/set-password`
  revoke every refresh token, this browser's included, then issue a fresh pair for the device
  `X-Device-Id` names. The action seals it with `startSession`; without the header the backend binds
  the pair to a new device and emails a new-sign-in notice for this same browser.
- **A 401 from `/api/account` is routed by its code, not its status.** `PASSWORD_INVALID` reaches
  the password field and `TWO_FACTOR_CODE_INVALID` the code field, and `refusedCredential` is the one
  place reading them. Those endpoints answer 401 for a dead session too, carrying no code, and
  blaming a field for that would hide it.
- **Changing a credential asks for the second factor, and only the page knows it is required.**
  Change-password, set-password and deactivate run the backend's one gate, so with a factor on a
  call carrying no code is refused, and with no factor the field is ignored. The wire field stays
  optional in all three schemas, since whether a code is needed is read per page and never posted;
  the page passes `twoFactorEnabled` down and the component runs `twoFactorCodeError` on top of its
  schema. `setPassword` therefore carries `credentialCheck: true` as well.
- **A password reset ends at the login screen, never in a session.** `/api/auth/reset-password`
  returns no tokens and revokes every refresh token, so the action clears our cookie and sends them
  to `/login?reset=1`. `/forgot-password` answers the same way for an address with no account, and
  emails a Google-only account a "nothing to reset" notice, so the screen keeps its notice neutral.
  **Neither reset step is in `AUTH_PATHS`**: an emailed link has to work for a browser that still
  holds a session, and `/app/settings/password` links to `/forgot-password`. `DEVICE_PATHS` is the
  separate list that mints the device id.
- **Password policy** lives in `validation/password/policy/policy.ts` and the **frontend is the
  spec**; the backend matches it. 8 to 64 characters, one each of
  upper/lower/digit/non-alphanumeric, and no guessable password. Enforced at register, never at
  login. `PASSWORD_HINT` in the same module is the one line the three password forms show. Both
  sides run the same vectors: `src/test/password-policy-vectors.json` is a verbatim mirror of the
  backend's canonical copy, so changing the policy means editing both implementations, both copies
  of the file, and running both suites.

## Consuming the API

Consequences of the backend's design, not preferences. Breaking them produces bugs that look like
backend bugs. Reasoning in [the bible](PROJECT_BIBLE.md).

- **Every response is an envelope**: `{ success, message, code?, data }`, on failure too, never
  HTML. `api/client/client.ts` unwraps it and throws `ApiError`; nothing above it sees the envelope.
  No field is marked `required` in `openapi.json`, so narrow rather than trust.
- **Branch on `ApiError.code`, never on the message.** Only some failures carry one, so a check reads
  the code and falls back to the message only where an older backend build is plausible. **A code
  more than one module reads lives in `api/error-codes.ts`**: `PASSWORD_INVALID` and
  `TWO_FACTOR_CODE_INVALID` so far.
- **Never branch on the exact 2xx code**: POSTs return `201` while the spec says `200`.
- **A 2xx that breaks the contract throws `TypeError`.** A success carrying no token pair, no secret
  or no recovery codes is a value that is not the type we require, not a failure the backend
  reported. `Error` is kept for configuration that is wrong before any request is made.
- **`uid` vs `id` is not interchangeable.** `User`, `Group`, `Task` and `GroupMember` are addressed
  by string `uid`; everything else by numeric `id`. Payloads are flat, so foreign keys are ids, never
  nested objects, except that a membership carries its `user` nested.
- **`assignedToId` / `createdById` / `groupMemberId` are GroupMember ids, a third namespace.** Name
  them `memberId`, never `userId`. Still numeric on the task and completion endpoints; the membership
  routes take the membership's own `uid`.
- **All timestamps are UTC with no zone marker** and parse as local if handled naively. Everything
  goes through `time/api-date/api-date.ts`: `parseApiDate` in, `toApiDate` out. **Writing back takes
  no `Z`** (the backend parses `ISO_LOCAL_DATE_TIME`).
- **`401` ends a session, `403` never does.** `401` -> one silent refresh, then clear and `/login`.
  `403` -> show a permission message, never log out, never retry. The exception is an endpoint
  checking a credential from the request body, where `401` is that credential's verdict.
- **`429` is real and carries `Retry-After`.** Show the window; never auto-retry. `api/retry-phrase/`
  composes the message. **The reason is ours, not the backend's**: its 429 is a single constant
  saying "try again later", so pasting it in front of the window said the same thing twice.
- **A 403 on a group route means "not available to you", and never "no such group".** The membership
  check answers false for a group that is not yours and for a uid that does not exist alike, and the
  framework refuses before any service code runs. That is deliberate: the alternative lets someone
  probe for real uids. `groups/unavailable/` owns the check and the path it bounces to.
- **The group routes carry no `code`, so they are told apart by status plus route.** A 409 is the
  last-admin guard on a role change, a removal or a leave, which `groups/last-admin/` phrases, and
  the already-a-member refusal on join, which is a different thing with the same status.
- **List endpoints need a scope parameter**: `?groupId=`, `?userId=`, `?taskId=`. Missing one is a
  `400`, not an empty list. **The group and membership routes are the exception**, carrying their
  scope in the path, though tasks, categories, tags and audit logs still take `?groupId=`.
- **No pagination exists, and only the group list filters, sorts and searches.** `GET
  /api/groups/mine` takes `q`, a repeatable `role` and a `sort`, and refuses a value it does not know
  with a `400` rather than falling back, so a query is normalised before it is sent. Every other
  resource is filtered and sorted on the client, with the predicates in one place per resource. **The
  search cap is a shared constant**: `QUERY_MAX_LENGTH` is the backend's `FieldLimits.SEARCH_TEXT`.
- **Types are hand-written per feature** from `openapi.json`. We do not generate a client.

## Tests

`vitest.config.mts` + `vitest.setup.ts`. Tests sit beside their code as `*.test.ts(x)`.

**Test what would hurt if it broke.** A test earns its place by covering a business rule, a security
or permission boundary, a backend contract, an accessibility guarantee, or a bug that actually
happened. Nothing is written to raise coverage: if a line is only reachable by a test nobody would
miss, the test is the problem.

**What not to write:**

- **No class-name assertions.** `toHaveClass("lg:hidden")` passes while the layout is broken and
  fails on a rename that changed nothing. Responsive behaviour is checked in a browser, not jsdom.
- **No geometry or animation maths**: exact transforms, SVG path coordinates, computed pixel sizes.
  **The exception is a rule with a reason**, such as ignoring a non-mouse `pointerType` or honouring
  `prefers-reduced-motion`.
- **No re-testing the library.** A zod enum built from a literal list in the same repo does not need
  a case per value; assert the one thing that could drift from the backend.
- **No duplicate coverage across layers.** A schema test is the authority on a rule; the form test
  covers what the user sees happen, not the rule again.

**Repetition is justified where each case is configured separately**, as `credentialCheck` is per
endpoint: a missing flag signs someone out, so every endpoint carrying it earns its own test.

- **Default environment is `node`**; a component test opts in with `// @vitest-environment jsdom` on
  line one.
- **No globals**: import `describe`/`it`/`expect` from `vitest`. Turning them on would force
  `tsconfig`'s `types` to list every `@types` package explicitly.
- **`cleanup()` runs after each test** in `vitest.setup.ts`. Testing Library only registers it
  automatically when globals are on, so without it every `render` stacks into one document.
- **HTTP is mocked at the network boundary with MSW**, never by stubbing our own modules. Shared
  server in `src/test/msw.ts`, handlers per test via `server.use()`. Unhandled requests **fail the
  test**.
- **`server-only` is aliased to a stub**: the package throws unless resolved under React's
  `react-server` condition, which Vitest doesn't apply. The production guard is unaffected.
- **The suite runs in a pinned non-UTC timezone** (`TZ = "Europe/Ljubljana"`). On a UTC machine a
  naive `new Date(apiString)` is right by accident and the timestamp tests would pass against the bug
  they exist to catch.
- **jsdom implements no `ResizeObserver`**, so `vitest.setup.ts` stubs it. The stub never fires, so a
  measured size stays absent.
- **`BFF_HOP_SECRET` has a harness default** in `vitest.config.mts`, because `getEnv()` validates
  every required variable at once. A file asserting the header's value sets its own.

## Environment

`.env.local` is gitignored. Never commit real values.

| Variable                       | Scope   | Purpose                                                                       |
| ------------------------------ | ------- | ----------------------------------------------------------------------------- |
| `API_BASE_URL`                 | server  | Spring API origin                                                             |
| `SESSION_SECRET`               | server  | Key for the encrypted session cookie, unique per environment, >=32 chars      |
| `BFF_HOP_SECRET`               | server  | Proves a call came from us, so the client IP we forward is trusted, >=32 chars |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | browser | Google Sign-In client id, **must match** the backend's `GOOGLE_CLIENT_ID`     |

All four are required and validated by `config/env/env.ts`; whitespace-only counts as missing. Our
origin must be in the backend's `CORS_ALLOWED_ORIGINS` and the Google client's authorized origins,
though the browser never calls Spring directly, so a CORS error means something is calling from the
wrong side.
