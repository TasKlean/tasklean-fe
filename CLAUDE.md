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
is a shell: a rail that stands still beside a scrolling section. The group's own path is the
**board**, and **Labels beside it is built**.

**The board reads, creates, edits and deletes.** `/app/groups/[uid]` lists a page of tasks, as rows
or as cards, behind a search and one `Filter and sort` panel holding every axis at once. The filter
is the URL and the backend answers all of it; the layout is a cookie. **One full-height panel on the
right serves every job**: `?task=<uid>` reads a task and `?task=new` creates one, each a link
somebody can send, and **editing one is the panel's own state** rather than a URL of its own.
Deleting is in the editor's footer and in **a row's own menu**, which the three dots open at a
desk and a long press on a phone. **Completing is built**: one press records a round, a view off it
takes the minutes, a note and a photo, and **the rounds already recorded are a list in the task's
own facts**, each opening the round it names. **Skipping, claiming and archiving are built too**: a
skip is a view off the Complete chevron taking a reason, a claim is the pool chip itself and a row
in both menus, and archiving confirms in place in the task's footer and in both menus.

- `overview/information` holds every field a group has; `overview/members` is the roster an admin
  promotes, demotes and removes from, with leaving at the end. `overview/activity` is the group's
  trail, newest first, a page of 20 at a time behind a Load more press, narrowed by
  `?type=&ref=&actor=&from=&to=` in the URL and picked from three dropdowns, the actor's an
  admin's. The kinds are Group, Members, Tasks, Categories and Tags, and the last four drill down
  to one of them. It is one timeline cut into days, in the reader's own zone, with what an update
  moved behind a press, and a row names the task, member, category or tag it is about.
- `settings/{preferences,notifications}` are everybody's, disabled with the reason beside them.
  `settings/{details,invite-code,delete}` are an admin's and redirect a member.
- `labels` is the household's categories and tags, two sections on one screen. Both lists are
  everybody's and the presses are gated one at a time: a category is wholly an admin's, where any
  member adds a tag and recolours one and only an admin renames or removes it. **Nothing in the
  rail is a dead entry any more**, so `soon` on a nav item has no caller left.

**`/app/settings/activity` is the account's own trail**, last under Security: sign-ins, credential
changes, two-factor and device events, newest first, a page of 20 behind a Load more press. The same
feed the group screens draw, with the range as its only filter and the IP address on the rows the
reader acted on.

**`/app/settings/profile` is where your own name and picture are changed**, and it is the whole of
Account, the first group: first, middle and last name plus an uploaded avatar, saved in one press. A
save reseals the session, so the header's greeting and avatar follow it. The email address is not
editable anywhere. Deactivation is a group of its own at the end.

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

Next.js 16.4.5 (App Router, Turbopack), React 19.3, TypeScript 6 strict, Tailwind 4, ESLint 10,
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

- **9 "moderate" audit findings, all one advisory**: `minimatch`'s globparts DoS, reached through
  `eslint` itself and through `typescript-eslint` inside `eslint-config-next`. Lint-time
  devDependencies only, and `audit fix --force` would downgrade `eslint-config-next`. Leave it.
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
                       layout.tsx (the rail), page.tsx (the board a group opens
                       on) + page.helpers.ts (its five reads),
                       actions/ (the one press, the layout cookie),
                       group.helpers.ts (the shared read)
          labels/      the household's categories and tags, with page.helpers.ts
                       for the two reads and actions/ for all six presses
          overview/    page.tsx redirects to information/; members/ is the
                       roster, with actions/ for a role change, a removal and
                       the leave that is the same call; activity/ is the trail,
                       with actions/ for the page after a cursor and the search
                       in its task picker, and page.helpers.ts for the reads:
                       the first page, the roster, the board and the labels its
                       rows and its pickers read by, and the refusals
          settings/    page.tsx redirects to preferences/; actions/ serves the
                       admin sections; settings.helpers.ts is the shared read.
                       One directory per section: preferences/, notifications/,
                       details/, invite-code/, delete/
        account/       the profile page behind the avatar menu
        settings/      layout.tsx, page.tsx, sections.ts (Account, Preferences,
                       Security, Deactivate) and sections.types.ts, then one
                       directory per page: appearance/, language/, notifications/,
                       two-factor/, devices/ (+ page.helpers.ts), password/,
                       connected-accounts/, deactivate/, activity/ (the
                       account's own trail: page.helpers.ts for the read,
                       actions/ for the page after a cursor), profile/ (your own
                       name and picture, with actions/ for the save)
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
                       use-image-upload (a picked image on its way to the bucket),
                       use-long-press (a held finger, and the click it ends in)
  components/
    common/            primitives and what more than one screen shares: avatar,
                       account-menu, logout-button, masked-email, load-error,
                       form-notice, brand-mark, clipped-name (a name on one
                       line, the whole of it a press away), text-field, password-field,
                       code-input, two-factor-code-field, password-strength-meter,
                       submit-button, or-divider, greeting, copy-button,
                       qr-image, google-mark, busy-overlay, text-area,
                       switch-track, group-avatar, image-picker, recovery-codes,
                       side-panel (a dialog anchored right, the page usable
                       behind it),
                       tooltip (+ .styles: a hover bubble naming what a pill is,
                       and the paint both bubbles share),
                       info-tip (that bubble beside a field's name, opened by a
                       press as well, for a screen with no hover),
                       zone-probe (the browser's own zone, into a cookie),
                       label-chip (a category or tag, tinted from its own hex),
                       label-tint (that hex on its way into CSS, with the
                       fallback, for every control that wears one),
                       category-icon (the icon set and what draws a stored name),
                       swatch (a dot in a label's own colour),
                       swatch-select (a circle that opens a grid of them),
                       signed-out-listener and signed-out-broadcast (the two
                       ends of the sign-out a tab tells the others about),
                       invite-code/ (invite-code-field, share-invite),
                       filter-chip (one choice in a filter panel, a real
                       checkbox or radio under the paint, wearing a label's own
                       colour where it is one),
                       filter-select (a dropdown that posts a value, the
                       listbox contract LocaleSelect runs; a row may carry a
                       rule above it),
                       filter-menu/ (what any filtered list shares:
                       filter-menu-row (+ .helpers), filter-menu.styles,
                       clear-filters),
                       activity/ (a trail, whichever one: activity-feed,
                       activity-timeline, activity-row, change-card, token-line,
                       day-sections-toggle, activity-empty, date-menu/
                       (+ preset-list, custom-range))
    app/               signed-in components, one directory per screen
      chrome/          app-header (+ header-bar), group-breadcrumb (+ crumb-pill),
                       group-switcher (+ open-group-uid), add-task-button
      groups/          group-card, group-section, group-filters (+ group-search,
                       show-menu, sort-menu, no-matches), add-group,
                       add-group-bar, no-groups, create-group-form,
                       join-group-form
      group/board/     the tasks a group opens on: board.styles.ts, label-mark
                       (a category's icon, or the dot that stands in), outcome-pill
                       (what became of one round, read by a history row and by
                       the round itself), status-pill
                       (where a task has got to, read by a row and by the open
                       task), task-list (+ no-tasks) drawing either task-row
                       (+ row-press (the element, its long press and its menu),
                       due-digits, due-chip, task-marks (repeat and photo
                       proof), priority-mark, assignee-chip, claim-chip (that
                       chip as the press that takes an unheld task), task-menu
                       (view, claim, edit, archive and delete, + .types)) or
                       task-card (+ card-menu, the card's own, which the lanes
                       to come will share), task-pager,
                       task-panel/ (task-panel, the state the reader, the
                       editor and the round are picked by, + .types (the line a
                       press reports), task-reader, task-editor, delete-task,
                       archive-task,
                       complete-button/ (one press, and the menu that leads to
                       the longer way and to the skip), complete-form/ (the
                       round's own view, + .labels), skip-form/ (the round
                       nobody did, + .labels), round-panel/ (round-panel and round-view: one
                       recorded round, read), task-view/ (task-view, .helpers,
                       fact-card, fact-row, description-block,
                       history/ (history-list, a page at a time, and
                       history-row)) and
                       task-form/ (category-pills, priority-pills, due-fields,
                       estimate-field, photo-proof-card/, tag-editor/ (+
                       add-tag-panel), create-header and edit-header (a bar
                       each, and the words both own), form-row,
                       .styles, .labels (what each field is for, in one line
                       each), .helpers (the stretches both the field and the
                       editor read))), board-bar (+ view-picker (one pill on a
                       track of two, at every width, + view.labels),
                       task-search, filter-panel (+ filter-fields: sort, then
                       assignee, category, tag, priority, status, due; field
                       (one axis, as a disclosure), strip (the sideways row and
                       the two ways to move it)))
      group/shell/     group-sidebar (+ group-summary, group-description),
                       group-bar (+ invite-control), group-nav (+ nav-sections,
                       nav-entry, item-tone, open-group-area),
                       shell.styles (the column every section applies)
      group/overview/  member-row (+ member-actions, confirm-remove), leave-group,
                       activity/ (what only a group's trail has: former-divider,
                       type-menu/ (+ kind-list, entity-list/ (the things of one
                       kind, searched where there are too many to offer),
                       .helpers) and actor-menu/)
      group/labels/    label-section (the heading, the card, and the add press
                       that opens a form at the top of it), category-list
                       (+ category-row, category-form), tag-list
                       (+ tag-row, tag-form), color-picker, icon-picker (both
                       one circle over swatch-select), labels.styles.ts
      group/settings/  settings-section, group-preferences, group-notifications,
                       edit-group-form, invite-code (+ rotate-invite-code),
                       delete-group
      settings/        settings-nav, then one directory per page: appearance/,
                       language/ (locale-select, our dropdown not the
                       platform's), notifications/, two-factor/, devices/,
                       password/, connected-accounts/, deactivate/, profile/
    auth/              login-form, register-form, verify-email-form,
                       two-factor-form, google-sign-in, google-button, back-link,
                       forgot-password-form, reset-password-form
    marketing/         site-header, site-footer, hero, hero-tilt, how-it-works,
                       feature-grid, comparison, cta-band
  lib/                 all non-UI logic; nothing sits directly in src/lib
    account/           account.ts (own password, connections, deactivation),
                       two-factor.ts
    audit/             audit.ts (one page of a trail, a group's or the caller's
                       own account), audit.types.ts,
                       entity/ (the type set, the five a group holds, and the
                       key a name is resolved by),
                       labels/ (the line a row reads, from action + entity),
                       changes/ (the line one changed field reads),
                       tokens/ (the pieces a line is built from),
                       days/ (a feed cut into the days it happened on),
                       dates/ (the ranges on offer and their words),
                       filter/ (URL <-> query <-> endpoint params, for both
                       scopes), paging/ (the line a refused cursor shows)
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
      signed-out-channel/  the BroadcastChannel a tab reports a sign-out on,
                       the one module here that runs in the browser
    config/env.ts      validated environment
    devices/           the caller's own devices and sessions
    groups/            groups.ts (create, join, mine, that list filtered,
                       detail, update, rotate, delete), groups.types.ts,
                       members/, role.ts (the one place a role is compared),
                       labels.ts,
                       filter/ (URL <-> query <-> endpoint params),
                       unavailable.ts (the 403), last-admin.ts (the 409)
    images/            fit-box/ (the size drawn at), resize/ (decode, redraw,
                       re-encode in the browser)
    labels/            categories/ and tags/ (four calls each, both lists
                       scoped by the path), refusals/ (the two codeless 409s),
                       palette/ (the colours a label may wear, as data)
    notifications/     settings.ts (GET, and a batch PUT answering with the
                       whole matrix), settings.types.ts
    preferences/       preferences.ts (/api/user-settings), theme-cookie.ts,
                       theme-attribute.ts (client-safe)
    qr/                qr-code.ts (the encoder, server only) + types
    tasks/             tasks/ (the eight calls), tasks.types.ts,
                       completions/ (the two writes and the two reads, the
                       types, and the words a round reads in), due/ (how a due
                       date reads), filter/ (URL <-> query <-> endpoint params,
                       the hrefs the board's controls hang off, and what those
                       controls offer),
                       permissions/ (who may change one task),
                       recurrence/ (how often one comes back, in words),
                       status/ (where one has got to, in words),
                       refusals/ (the 403 and the 404 a press runs into, and
                       the four 409s a round does),
                       view/ (the list-or-cards cookie),
                       write/ (form fields <-> the write body, and the due
                       date's two halves <-> one instant)
    text/              humanise/ (wording a backend constant nothing has words
                       for, which a trail's lines and a task's panel both read)
    time/              api-date/ (API timestamps <-> Date), since/ (how long ago,
                       in words), day/ (a day's name, its key, the clock, the
                       date in digits, and the instant a wall time reads in one
                       zone), zone/ (the zone cookie's name and shape, and
                       zone-cookie.ts, the read)
    uploads/           uploads.ts (the presigns), uploads.types.ts (caps the
                       browser reads too), put-object/ (the browser's PUT),
                       image-src/ (our route, never the bucket)
    users/             me/ (the profile: two reads and the one write, plus
                       me.types.ts), name/ (display name and initials)
    validation/        rules.ts (field-level Zod pieces), parse.ts, forms/ (one
                       <form>.schema.ts each, plus upload-request, audit-page,
                       account-page, round-page and task-search, which no form
                       posts),
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
- **A component or a function cannot cross into a client component**, so a component built on a
  client shell that takes either is itself a client component, state of its own or not. Neither the
  build nor a jsdom test catches it, because jsdom renders the client component directly and never
  crosses the boundary: it fails at render, in the running app. A shared disclosure taking an icon
  and a render prop cost us the whole board screen once, with lint, build and six green tests.
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
`labels/categories`, `labels/tags`, `tasks/tasks`, `tasks/view`, `uploads/uploads.ts`,
`qr/qr-code` (not for a secret: it keeps the encoder out of the browser bundle),
`notifications/settings`, `preferences/preferences.ts`, `preferences/theme-cookie`.

It must **not** be imported by anything a client component imports: all of `validation/`,
`qr/qr-code.types.ts`, `preferences/preferences.types.ts`, `preferences/theme-attribute`,
`notifications/settings.types.ts`, the four group modules a row in the browser reads
(`groups/groups.types.ts`, which `rules.ts` imports for the role enum, `groups/role`,
`groups/unavailable`, `groups/last-admin`), the five audit modules a feed in the browser reads
(`audit/audit.types.ts`, `audit/entity`, `audit/labels`, `audit/changes`, `audit/tokens`), the four
label modules a row or a picker in the browser reads (`labels/categories.types.ts`,
`labels/tags.types.ts`, `labels/refusals`, `labels/palette`), and the
three upload modules that run in the browser (`uploads/uploads.types.ts`, `uploads/put-object`,
`uploads/image-src`), and `auth/signed-out-channel`, whose two ends are both browser side.

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
  place. **Every `text-label-*` token carries `font-weight: 600`**, so a
  `font-semibold` beside one is that same fight and is simply deleted.
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
- **A rule for an optional field must accept the empty string**, because that is what a form posts
  for a field nobody filled. `dayRule` and `timeOfDayRule` fold it into their own pattern, where
  checking the shape first made the `|| undefined` after it unreachable.
- **A rule a component also runs must take the shape the component holds.** `validateTask` runs the
  same schema on live state, so `flagRule` takes a boolean as well as the `"on"` a tickbox posts: a
  schema that only reads form text refuses the form's own component.
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
  **`SwatchSelect` is the same contract laid out as a grid**, for a choice with nothing to read:
  five fixed columns, so up and down move by a row rather than by one cell.
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
- **A hover bubble is CSS, and the whole of it is `pointer-fine:`**, down to the anchor's own
  `relative`, so a touch screen is left exactly as it was: a tap counts as a hover there and would
  leave a bubble sitting over whatever was tapped. The reveal and the resting state are one
  property set once, since two opacity utilities in one class list resolve in the stylesheet.
  `Tooltip`'s bubble is `aria-hidden` or it joins the accessible name of the row's own link;
  `InfoTip`'s is a `role="tooltip"` the press is `aria-describedby`, so it is read whether it is
  open or not.
- **A pill under a stretched link has to be raised to be hovered at all.** `after:inset-0` covers
  the whole row and takes every pointer, so the pill beneath it never knows it was pointed at:
  the anchor carries `pointer-fine:z-10`. The cost is that a raised cell **outside** that link
  stops opening the task on a desk, which is the date's slot; the avatar never did, `Avatar`
  being `relative` already. Measured, both ways.
- **An (i) opens on a press as well as a hover**, a touch screen having neither and Safari not
  focusing a button it was tapped on. The press is cancelled and kept to itself, so an (i) inside a
  `<label>` does not toggle that label's control, and the icon is 24px drawn with the hit area
  taken out to 44 by a pseudo-element rather than by padding that would move the name beside it.
- **A `<label>` holding an (i) names its control with `htmlFor`**, because a label's control is its
  first labelable descendant and a `<button>` is one: the photo-proof card took the (i) as its
  control, so hovering the card opened that bubble and a press on the switch pressed the (i)
  instead. Measured.
- **An info bubble sits above the field's own row, not against the icon**, which is why
  `InfoTip`'s wrapper is deliberately not `relative`: anchored to a 24px circle it ran off a 390px
  panel, and anchored to the row it hangs from the left edge and can never come out wider than the
  field. Measured. **A row at the top of a scrolling box is the exception**, where `below` is the
  only placement that is not clipped away.
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
  menu adds `left-0`, the sort menu `right-0`, and `SwatchSelect` takes an `align` because a circle
  at the right of its row opened a 246px grid off the screen. **One hanging off a narrow trigger
  also needs `w-max`**: an absolute box shrinks to fit the width its containing block offers, so
  `SwatchSelect`'s grid over a 44px circle came out one cell wide until it said otherwise. Measured.
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
- **A section says what it is behind the (i) beside its heading, not in a line under it.** The
  settings sections, the overview's three screens, both halves of Labels and the board's Sort and
  Filter each carry one, and a heading's bubble opens **beside the words** from `sm`, hanging off
  the (i) itself, where a field's hangs off its own row. Below `sm` it drops under the heading
  instead: measured, a 224px bubble off the end of a heading runs out of a 360px screen. Labels
  keeps its note for a member, which is a permission
  rather than a description. **The trail's two pills say what they narrow on hover**, being named
  by a word each.
- **A step that cannot be undone asks for the name, not a second press.** `DeleteGroup` matches the
  typed name trimmed and case-insensitively. **Replacing the invite code confirms neutrally**,
  because nothing is lost.
- **A trail's line is ours, keyed on the action and the entity together.** The backend's
  `actionMessage` is the fallback for a pair we have no copy for, and stands alone, being a whole
  sentence. **A line is `AuditToken[]`, not a string**, so `audit/tokens` names what each piece is
  and `TokenLine` is the one place a name, a field and a value are painted: names and fields bold, a
  value in a pill.
- **A row names the thing it is about, and the screens that own those things are read to do it.** The
  entry carries a ref and no label, so the page hands the feed one name map, keyed by `nameKey`
  (the entity type and the ref together, because a category and a tag number themselves separately).
  It is built from four reads: `GET /api/groups/{uid}/members?status=ALL`, which names a departure as
  readily as a current member, one page of the board (the newest hundred, every status, newest
  first), and the household's categories and tags. The paging action makes the same reads and returns
  the names with its page. **A line is one template per pair**, `THING_PHRASES` with `{thing}` where
  the thing goes, and `KIND_NOUNS` is the one place each kind's noun is written, named ("the **Bins**
  task") or not ("a task"), so the two read as one sentence with a different subject. A task keeps the
  first group of its uid in brackets where nothing could name it, so the row still says which one.
  **Nothing prints a numeric id**: a category or tag nobody could name reads as the kind alone.
  **A deleted thing is nameless by construction**, being in none of those lists, which is the cost of
  resolving a name here rather than the backend sending one.
- **A row about one round of a task says which round, in the line.** The backend carries it as a
  shown `dueDate` field on `COMPLETE`, `TASK_SKIPPED`, `TASK_MISSED` and `COMPLETION_UNDONE`, which
  `ROUND_PHRASES` is read for instead of `THING_PHRASES`: "completed the `14 Mar 2026` round of the
  **Bins** task". It is **a value in a pill, not a name**, being a fact rather than something a
  reader can press, and **it is then kept out of the change card**, which would otherwise repeat it
  as "Due date set to". A one-off carries no field at all and reads as the task alone. The date is
  drawn in the reader's zone through `auditDate`, which is the one place a trail draws one, so a
  round, a changed due date and the board's own chip cannot disagree.
- **A row whose actor is its own subject says what happened, not who did it to whom.** Group creation
  and a join by code both write `MEMBER_ADDED` against the actor's own membership, so the map carries
  the membership's `userUid` and those rows read "joined the group". Checked before any name is used.
- **A trail is cut into days, and a row shows only the clock.** The headings are Today, Yesterday and
  then a date, and the press that takes them away is the feed's own state, hanging off the end of the
  **first day's rule**, which is the line it is about: it dates each row instead and leaves the line
  unbroken. Run together, that bare rule is drawn on its own, so the press does not move when
  pressed. It reads like a row's "Show changes", and its label says what the press will do ("Group by
  date", "Ungroup by date") rather than carrying a switch's state. **The whole feed is measured
  against one instant**, passed down from the page, so appended rows agree with the first and the
  browser hydrates to what the server drew.
- **Every zone-aware function takes the zone, and never reads it.** `time/day` formats and `audit/days`
  groups, both from an argument, so the server's render and the browser's hydration cannot disagree.
- **The trail's cursor lives in the feed component's memory, never in the URL.** `ActivityFeed` holds
  the pages and asks for the next through the action it was handed, which revalidates nothing, since
  a re-render would throw away what is on screen. The feed names no trail of its own: the group's
  action takes the uid bound to it, so a press cannot name a group. A refused cursor is reported, never retried from the first page.
  `nextCursor` is the only thing that says more exists, and `total` is the label at the foot of the
  list, where Load more is, said once rather than above a list the reader has scrolled past.
- **The trail's filter is the URL, and `?ref=` is never read without `?type=`.** The endpoint refuses
  that pair with a 400 carrying no code, so `auditFilter` drops both or neither, and the cursor
  carries the filter so page two cannot resume in another feed. **The feed is keyed on the filter**,
  or React keeps the pages the last one loaded.
- **A trail is filtered by the thing, the person and the days, in three controls.** `?type=&ref=`
  narrows what the rows are about, `?actor=` whose actions they are, `?from=&to=` when, and the
  endpoint takes all of them at once. An
  actor is a **user** uid, a third namespace from the membership uid `?ref=` carries, which is why
  `actorRefRule` is its own rule. **Only an admin is offered the control, and a refusal is
  normalised before it is sent**: the endpoint answers a member naming anybody but themselves with a
  403 carrying no code, which `isGroupUnavailable` cannot tell from the group being gone, so
  `allowedActor` clears it and `loadTrail`'s bounce is gated on the filter holding no actor.
- **The range is calendar days in the URL and instants on the wire.** `?from=&to=` carries
  `YYYY-MM-DD`, which `auditFilterQuery` turns into `dateFrom` and `dateTo` using the reader's zone,
  passed in like every other zone-aware call. **`dateTo` is exclusive**, so the ceiling is sent as
  the start of the following day, which `time/day`'s `dayStart` and `shiftDays` work out. A backwards
  range is a 400 with a message of the backend's own, so it is headed off three times: the two fields
  cap each other, `auditFilter` drops both ends if a typed URL reads backwards, and the endpoint
  stays the authority. **`auditFilterParams` takes a `Partial`**, so a link naming two axes is not
  revisited every time the filter grows another.
- **One timeline, whatever the filter says, and every filter is a dropdown of links.** A row carries
  no entity chip, since its own sentence names the kind. All three menus are disclosures, not
  listboxes: the panels hold `<Link>`s, so the server decides what is current and JavaScript only
  opens them. **A closed pill names the filter until something is picked** ("Entity type", "Actor",
  "Date"), where the panel's own reset row keeps the wording of a choice ("All activity", "Anyone",
  "Any time") and the pill's `aria-label` keeps saying which. **A pill that holds one thing names it**
  ("Member: Dan Novak", "Actor: Alice Johnson", and "One member" for a ref nothing can name), and
  `ClearFilters` is the one way back to the whole trail, on a line of its own at the right-hand end of
  the controls, drawn only while something narrows the feed. **A choice that needs more than a link
  drills down in place**: Members, Tasks, Categories and Tags each carry a press of its own at the
  row's end and the panel swaps the kinds for that list, which is one `EntityList` for all four, and
  Custom range is a press rather than a link, having no days of its own until they are typed. Focus
  follows the panel that replaced the button, both ways, landing back on the row it drilled from.
  **A kind with nothing to offer keeps its row and loses only that press**, which would open an
  empty panel. **The tasks are the one list with a search**, the panel offering the newest ten and a
  box that asks `searchTasksAction` 300ms after typing stops, the same pause the board's own search
  waits: the list is capped where a household's categories and tags are not. **The custom range is a GET form** posting the two days to the
  same path with the rest of the filter as hidden fields, so it works with no JavaScript. Both panels are painted from `filter-menu.styles` and their
  rows are one `FilterMenuRow`, so a row in either measures the same.
- **The people who have left are offered, and the block they sit in is labelled.** The roster sorts
  them last, so `FormerDivider` heads the block once rather than tagging every row, and each row
  carries the wording in its `aria-label` because the divider is hidden. **A panel names the edge it
  hangs from** and each pill is half the row on a phone, since a 256px panel hanging off the inner
  edge of the right-hand pill runs off a 360px screen.
- **An element a page hands a client component as a prop carries a `key`.** The slots `ActivityFeed`
  takes (`heading`, `menu`, `dates`, `clear`) cross the server boundary as named props, where React
  validates them as list children and warns without one. `children` is the one prop exempt, and the
  day switch sharing the menu's row is what cost us it.
- **An update names the fields it moved, and carries their values only sometimes.** The backend
  withholds a value unless it is safe to keep forever, so `audit/changes` phrases four states: `A to
  B`, set, cleared and a bare "changed", and an unmapped name is humanised rather than dropped.
  `assignedToId` is **Assignee**, since it is a membership id.
- **What an update moved sits behind a press, counted in the label.** "Show 5 changes" opens the card
  under the line. **One change to a field the line already names ends the sentence instead**, which
  `INLINE_FIELDS` is the one place for, so a role change reads whole and shows nothing to press.
- **A value is worded by its field's kind, and an unknown enum is still worded.** A role goes through
  `roleLabel`, a date through `parseApiDate` in the reader's zone, a flag reads Yes or No and minutes
  carry their unit. Anything shaped like one of the backend's constants is humanised, so a field
  added later reads properly before we have mapped it.
- **The invite code is a field with its presses beside it.** `InviteCodeField` paints it like every
  other field with the copy press inside as an icon; the replacement and the disabled share are
  round icon presses at the field's height, which `CODE_ACTION` is the one place for.

### The board

- **The shell gives a section the width, and the section applies it.**
  `SECTION_COLUMN` in `group/shell/shell.styles` is the app's 1200px column, worn by every group
  screen rather than by the shell's own wrapper, because the **cards layout drops it** and takes
  the whole content area so a wide screen fits more of them. The list keeps it: a row spanning
  1536px reads badly. The shell still owns the padding.
- **The cards count their columns off the board, not the window.** The list's wrapper is an
  `@container`, so `@xl`, `@5xl` and `@7xl` step 1 to 4 columns at 576, 1024 and 1280px of the
  board's **own** width, which keeps a card near 300px and wider. The panel is an overlay, so an
  open task takes none of that width and the grid is the same whether one is open.
- **The board has no heading of its own.** The rail's card carries the group's name, which is this
  screen's `h1`, and a second line saying what a board is told a reader nothing they came for.
- **A group opens on its board, and the whole of what it shows is the URL.** `?q=`, `?status=`,
  `?who=`, `?category=`, `?tag=`, `?priority=`, `?overdue=`, `?sort=` and `?page=`, so a filtered
  board is a pasteable link and nothing is narrowed, ordered or paged on the client. `taskQuery`
  reads them, `taskQueryParams` writes them and `taskApiQuery` is the one place they become the
  endpoint's enums.
- **Sending no status is what asks for the to-do list.** The endpoint reads an absent status as
  `TaskStatus.OPEN`, so the default is written as nothing at all rather than as the pair it stands
  for, and clearing the filters means a bare path. The menu offers three states, not four:
  `IN_PROGRESS` is in the column's constraint and nothing ever sets it.
- **`who` is one field because the endpoint refuses two.** `assignedToUid` with `unassigned` is a
  400, so `?who=` is `me`, `free` or a membership uid and becomes one parameter or the other.
  `me` resolves from `myMemberUid`, which rides on the group read rather than costing a roster call.
- **A filter press returns to the first page.** `boardHref` resets `page` unless the page is what
  changed, since narrowing a board while reading page four otherwise lands on a page that no longer
  exists.
- **Pages are one-based in the URL and zero-based on the wire**, and the pager counts rows from the
  size the board answered with rather than from the backend's default written out again.
- **The open task is `?task=`, and whether it is being edited is not.** The page reads the task by
  uid, so the panel is a link somebody can send, survives a reload and closes with an ordinary
  navigation. Read by uid rather than found in the page, because the filter or the page may not
  hold it; a uid that is gone opens the board rather than an error. `?task=new` is the form for one
  that does not exist yet, safe as a reserved value because a uid is a UUID. **Editing is
  `TaskPanel`'s own state**, so Discard puts the facts straight back and leaves no history entry.
  **`?edit=1` is the one thing that may ask for it from outside**, which is what a row's own menu
  does: the panel starts on the form, and a discard or a save `replace`s the URL back to the plain
  task, so a reload does not reopen a form nobody is in any more. The panel resets that state when
  the pair the URL names changes, or Edit on a second row would open the first one's facts.
- **Creating stays in the URL because it crosses a navigation, where editing never does.** Both Add
  task presses are in the chrome, a subtree the board cannot reach, so the request has to survive
  the trip to the board: `addTaskHref` takes the group's uid and points at its board, carrying the
  filter only where the press already sits there. A context flag in the shell was tried and
  **cannot work**: the App Router runs Strict Mode in dev, whose mount, unmount, remount cycle
  fires the panel's own cleanup and clears the request before the remount reads it.
- **Nothing behind the panel is dimmed, so it is not modal.** `SidePanel` is `role="dialog"` with
  **no `aria-modal`, no scrim and no focus trap**, and it never freezes the page: a trap behind a
  page that looks usable is worse than no trap, and a transparent full-screen link would swallow
  every press on the board. It takes focus **on arrival only**, tying that to the close href having
  fired on every render and taken focus off whatever was being typed into. **Escape and a press
  outside close the reader and not the editor**, which `dismissable` is the one flag for: neither
  must throw away a half-typed task, where a task being read has nothing to lose, and Escape is
  also the key that closes the colour grid inside the form, which does not stop it bubbling. The
  press is `pointerdown`, so one on a row behind the panel closes this task and opens that one.
  **The leading control is a link or a press, by `close`**: a link where the URL names what is
  open, so it works with no JavaScript, and a press where nothing but state does. **Only a panel
  the URL holds wears a cross**: the editor's press leads back to the facts rather than out, so it
  is an arrow, where a task being created has no facts behind it and keeps the cross and the
  board's own link.
- **The panel is the full height of the page, covering the chrome, and wears no shadow.** 32rem
  from `sm`, 40rem from `lg`, a sheet below that. Its top bar carries the close press, then
  whatever the mode puts there, which is why `SidePanel` takes a `header` slot rather than a title.
- **A task just created opens as facts, not as the form it was typed into.** The save hands the
  panel the new uid, which it replaces the URL with, and the form stays up until those facts
  arrive: `editing || creating` is the condition, since a reader with no task to draw is a blank
  panel.
- **Reading a task goes: pills, name, words, picture, card, tags, byline.** Status, priority and
  category as pills; the name as the body's own `h2`; the description capped at 260 characters
  behind a Read more; the picture under a `Reference image` heading; then one card of what it is
  set to (assigned to, task owner, due date, repeat, estimated time, photo proof); then its tags;
  then who
  added it and how long ago, which `sinceLabel` words. Complete sits in the header and again in
  the footer, taking that row's width, with **Edit and Delete beside it as 44px icon presses**:
  Complete is what the row is for, and two more labels do not fit a phone. **The question Delete
  asks takes the whole row**, so the presses it is about stand aside while it is up, which
  `onAsking` is the one flag for, and a refusal is a notice above that row.
- **Each form has its own top bar.** A task being created carries its name and the one press that
  writes it down; one being edited carries its name, who wrote it and when, Discard and Save. There
  is nothing to discard a new task back to, so `CreateHeader` and `EditHeader` are two components
  rather than one with a mode, and each owns the two words the panel's name and the footer's press
  read from it. **Cancel is the one word for backing out**, in the editor's header and its footer
  alike, and it splits the same way: a press that puts the facts back while editing, and a link out
  of the panel while creating, as that header's own close already is.
- **The description keeps its height rather than growing to fit.** `TextArea` takes `fixed` for a
  field whose value arrives with it: a stored description otherwise made the box a different size
  every time the editor opened and moved the fields under it. It is still dragged taller by hand,
  and the group's description and a round's note still grow, both starting empty.
- **One word for the press that writes a task down: `Add task`.** The chrome's two entry points
  already said it, so the form's own submit says it in its header and its footer rather than
  Create. The panel is still headed `New task`, which names the thing rather than the action.
- **Editing goes: title, category, description, assignee, repeat and priority, due date and time,
  estimate, picture, tags, photo proof.** Repeat beside priority and the two due fields are half
  rows; everything else is whole. Only the title is marked required, and nothing says "optional",
  the absence of a `*` being what says it.
- **A task that repeats has two member pickers, side by side.** `Assigned to` is the round in hand
  and `Task owner` is whose task it is between rounds, which the backend hands every finished
  round back to. The owner picker is drawn for a repeating task alone, a one-off having no round
  to come, so a task saved as a one-off is saved with no owner. **The two mirror while the other is
  empty**, and picking an owner stops it for good: the backend hands an open round to an owner the
  moment one is named, so a form that did not mirror would show one thing and save another, where a
  form that kept mirroring could not say "Mark covers this round for John". The owner's own empty
  row reads `Nobody`, where the round's reads `Unassigned`.
- **Priority is one pill moving along a track of three, low to high, and none of them where nobody
  said**, where the filter menu leads with High. A radio cannot be unticked, so **the press on the
  one already on is what clears it**, hanging off the click because a value that has not moved
  fires no change. **The estimate is one row of five**, four stretches and a box that is the fifth pill
  rather than a field under them. The stretches are `aria-pressed` buttons rather than radios
  because the field that posts is a single input: the box carries the name while it holds the
  answer, and a hidden input carries a chosen stretch. Two controls sharing the name would post
  twice.
- **A tag is added from the task, and it is created the moment it is added.** The box holds the
  task's tags and one `Add tag` press, which opens **the group's own tags first**, headed `Choose
  one of the group's tags`, and the way to make a new one under an `OrDivider` and `Add a new one`,
  for a reader who finds none that fits. **A tag on offer is the chip itself**, `LabelChip` at the
  size the task wears it inside a transparent press carrying the focus ring, so what is being
  picked and what lands on the task are the same pill rather than a 36px one. Focus lands on the
  first tag offered, or on the name box where there are none, and **the box narrows the list as it
  is typed**, so it is the way through a long list as well as the name of something new. A name the
  household already holds reads `Attach tag` rather than `Create tag`. A save posts names alone, so a colour can only be kept by the tag
  existing: `createTaskTagAction` writes it before the task is saved and the household keeps it
  even if the edit is then discarded. **The box remembers the colour it was told**, the household's
  list being a render old, or a tag made here would wear the fallback until the board was read
  again. A name the household already holds comes back from a 409 as
  itself rather than as a failure.
- **The cap is a counter, not a sentence.** `2 / 5` sits at the right-hand end of the row the chips
  are in, **bold and in the foreground once the fifth is on**, which is the one thing saying why
  `Add tag` and the panel's presses have died: a dead press reading the cap out in its own name was
  a line of prose where a button belongs, and the panel repeated it. The digits are `aria-hidden`
  beside an `sr-only` sentence, nothing else announcing the cap, and the weight comes from
  `text-label-sm-strong`, `label-sm` carrying 600 already.
- **The panel stays open across adds, so several tags go on in one visit.** The list is what the
  task does not already carry, so a tag leaves it the moment it goes on and comes back the moment
  the chip's own cross takes it off. Its left-hand press is `Done` rather than Cancel, there being
  nothing pending to cancel, **focus moves to the name box after each add**, the pill pressed
  having left the list, and **the cap is enforced in the box**, which is no longer reachable only
  through the press that opened the panel.
- **A field is explained by an (i) beside its name, never by a line under it.** Eleven of them
  would have pushed the form half as long again, so `task-form.labels` holds the sentences and
  `InfoTip` draws them. Only the title, which needs none, and the estimate's own stretches go
  without. **A field sharing a row hangs its bubble from the row's right-hand end**, which
  `infoEnd` is the flag for: half a row is narrower than the bubble, so Priority's and Due time's
  reached past the panel. Measured at 440, the width where the panel's own container crosses `@sm`
  and the halves go two-up, which is why no narrower phone showed it. **The first field of a
  scrolling box drops its bubble under the row instead**, which `infoBelow` is the flag for: the
  box's own `overflow-y-auto` clips whatever sits above its first row, so the round's minutes lost
  the top of a bubble to the panel's header and no z-index could have paid it back.
- **Deleting is permanent and confirms in place**, in the reader's footer rather than the
  editor's: it is a thing done to the task, not an edit to it, and a phone's form footer already
  holds Cancel and Save.
- **Finishing a task is one press, and the details are a way off it.** `POST
  /api/tasks/{uid}/complete` with an empty body records the round, the backend snapshotting the
  task's own estimate, so the footer's Complete is a form posting that and works with no
  JavaScript. The chevron in the same pill opens one row, `Complete with details`; the header's
  press is the simple one alone, there being no room beside it.
- **A task asking for proof has no one-press path at all.** The backend refuses a round with no
  photo, so both presses read `Complete with proof` and lead to the view that takes one. **The
  photo is offered on every task** regardless, somebody being free to show work nobody demanded.
- **The round's own view is the panel's third mode**, like editing and for the same reason: it is
  state rather than a URL, so leaving it puts the facts straight back and writes no history entry.
  It takes the minutes as the task form's own row of five, a note capped at 1000 and a picture,
  and **`COMPLETION_PHOTO` presigns against the task** where `TASK_PHOTO` presigns against the
  group, the submit being intercepted so the uid exists before the round is posted.
- **A task may be finished early, once, and the press says so for the second one.** The backend
  takes a round against a due date still ahead, so nothing gates the first press on the date, and
  refuses the next until that round has passed. `roundAlreadyDone` is the one place that reads it,
  off the task's own `nextDueDate` and the newest round the history page carries, and the press is
  then a dead grey `Done for 14 Mar` like the one a task held elsewhere draws: a reader who filled
  in the minutes, a note and a photo should never meet `TASK_ROUND_ALREADY_AHEAD` at the end of it.
  **The backend stays the authority**, judging the same thing in its own zone, so the refusal is
  still phrased.
- **A refused round says why.** `TASK_ROUND_ALREADY_AHEAD`,
  `TASK_INSTANCE_ALREADY_RECORDED`, `TASK_PHOTO_PROOF_REQUIRED`, `TASK_ARCHIVED` and
  `TASK_ROUND_NOT_DUE` are the five 409s `completionRefusalMessage` phrases, and a 403 is somebody
  else's task. **The last of those is only reachable on a skip**, which `canSkipRound` heads off:
  early is allowed for a round that is done and refused for one nobody could have missed yet.
- **The two Complete presses share one in-flight flag.** The header's and the footer's are two
  forms with two pending flags of their own, so `TaskReader` holds `recording` and hands each press
  the other's state: without it a quick pair of presses records two rounds and the second comes
  back as the double tap. The backend's own cap is the backstop, not the guard.
- **The line a round reports belongs to the panel, not the press.** The view that recorded it is
  gone by the time it is read, so `TaskPanel` holds a `PanelNotice` and the reader draws it in the
  footer, which is where a refused delete lands too. **The press tells the panel once**, through a
  ref holding the state it last reported, since an action's answer outlives every other render.
- **A task with no round left draws no Complete press at all.** `canRecordRound` is the one place
  that says so: a repeating task is put back to `TODO` when a round is recorded, so `COMPLETED` is
  only ever a one-off that is finished, and the Completed pill above the name is what says it.
- **A task assigned to somebody else draws a dead press naming them.** The endpoint refuses
  anybody but the assignee, **an admin included**, so `assignedElsewhere` is a permission of its
  own rather than part of `canEditTask`, and the press reads `Assigned to Ana` in grey: a name the
  roster could not resolve still blocks it, as "somebody else". An unassigned task is anybody's,
  and **recording a round claims a one-off alone**: a repeating task's round goes back to its
  owner, or to nobody where it has none, so doing somebody a favour does not inherit the task.
- **A round nobody did is skipped from the Complete chevron, and the view takes a reason.**
  `SkipForm` is the panel's fourth mode, state rather than a URL exactly as the editor is, and it
  posts a note of up to 1000 characters and nothing else: the endpoint stores no minutes and asks
  for no photo, even on a task that demands one to be marked done. **A skip is refused for a round
  still ahead**, which completing one early is allowed for, so `canSkipRound` reads the task's own
  `nextDueDate` against the reader's today and the chevron offers the row only where there is a
  round to write off. A task asking for proof reaches the skip through that same chevron, which it
  now grows: its one press cannot finish the round, so the menu holds the skip alone.
- **Archiving confirms in place, in the task's footer and in both menus, and nothing undoes it.**
  The backend has no unarchive and a save carries no status, so the press is the one thing on this
  screen that cannot be walked back. It is **neutral rather than red**, the task and its rounds
  staying and only its place on the board being lost, which is why the confirm pill is
  `bg-secondary` where a delete's is `bg-destructive`. The footer's two questions are one row, so
  `asking` names which of them is up rather than whether one is, and each stands the other aside.
  **The panel stays open on the archived task**: the revalidated page redraws it with the Archived
  pill and no Complete press, where a delete has to navigate out.
- **Claiming is every member's, and the pool chip is the press.** `POST /api/tasks/{uid}/claim`
  takes a task only while `assignedTo` is null, answering 409 `TASK_ALREADY_ASSIGNED` for one
  somebody already holds, the caller included, which `claimRefusalMessage` is the one place that
  reads. `ClaimChip` wraps the chip that says nobody holds it, **raised above the row's own
  stretched link** so it can be pressed at all, which costs that cell its way into the task; the
  menus' Claim row is the way in that keeps it. **The open task's own `Assigned to` row is the same
  chip**, so a reader who opened a task before taking it does not have to close it again. A refusal
  hangs off the chip as an `alert`, there being no notice slot on a row. **The press is the chip's
  own 36px**, under the app's 44px floor as the filter panel's pills and a card's halves are: the
  control is the chip rather than something beside it, and padding it out would move every row's
  last column. **It touches neither the owner nor the status**: a claim moves the
  round in hand, and a repeating task hands it back to its owner when the round is recorded.
- **A trail line exists for all three**, keyed on the action and `TASK`, because the backend files
  a round, a claim and an archive against the task rather than against the row it wrote:
  `TASK_SKIPPED`, `TASK_MISSED`, `TASK_CLAIMED`, `TASK_ASSIGNED`, `TASK_ARCHIVED` and
  `COMPLETION_UNDONE`.
- **The task's name is one line with the whole of it a press away.** `ClippedName` is the group
  card's own control, moved to `common/`: a 100-character name, or one unbroken word, otherwise
  widened the panel on a phone. The description is the same idea by character count, and **the
  whole of it is the toggle**, with `Read more` at its right-hand end.
- **A row in the history is built like a row on the board**, down to `ROW_DUE`'s own width: the
  round's date leads in digits, the outcome pill and the note and photo marks are the upper line,
  when it was recorded and what it took the lower one, and the member and the chevron are centred
  down both, the chip `compact` like the board's own so a phone shows the circle alone. The marks
  are circles rather than bare glyphs, the digits carry no tone (a recorded round is never late),
  and the whole row's `aria-label` spells all of it out.
- **`OutcomePill` is the one place a round's outcome is painted**, worn by a history row and by the
  round it opens, toned per outcome: Done `success-subtle`, Missed `destructive-subtle`, Skipped
  `muted`.
- **The rounds already recorded are a list at the end of the task's facts.** `GET
  /api/tasks/{uid}/completions` is cursor-paged, five a page, so `HistoryList` holds the pages and
  the cursor in its own memory behind a Load more press, exactly as a group's trail does, and the
  action it asks with carries the task bound to it. The list is drawn inside `TaskView`'s own body,
  which is the box that scrolls, and a task nobody has recorded draws nothing at all. **It is
  keyed on the count**, so a round recorded just now remounts it: the pages are state, and a
  revalidated page would otherwise never reach them.
- **One round is `?round=`, and it is the only panel with nothing to press.** A round is a fact
  rather than a thing to change, so it lives in the URL where the editor does not: each row is a
  link, the panel survives a reload, and the way back to the task's facts is a link wearing the
  arrow. It is read by id, because the round a link names may sit on a page the list never loaded,
  and a stale id opens the task rather than an error.
- **The filter's states are worded by `statusLabel`**, off the status each one stands for, so a
  filter and the pill on the task it finds cannot say different things: To do, Completed,
  Archived. **The words are the backend's own constants**, so what a reader sees and what the
  column holds read alike.
- **`StatusPill` is toned and marked per status**, so a board reads as states rather than a column
  of grey: To do wears `secondary`, the palette's own blue container, with a dashed circle,
  Completed `success-subtle` with a tick, like a round's own Done, and Archived and anything else
  `muted` with a box or a plain circle. It is shorter than `OutcomePill`, measuring like the other
  pills in a row rather than like the round's own heading, and its words are
  `text-label-sm-strong`, the one place that token is for. **A row passes `compact`**, so a phone
  draws the icon alone with the state still read out, as the assignee's own chip does.
- **The three pills on a row are told apart by shape, not only by colour.** A priority is the solid
  tone, square-ish and tight (`PRIORITY_CHIP`), so it reads before the words beside it; a category
  is the tinted pill with its icon and a border; a tag is the same tint with no border, led by a
  hash. The order after the name is priority, then category, the loudest thing first.
- **A tag is a `LabelChip` with `kind="tag"`, and that is the one place the hash is written.** It
  is `aria-hidden`, the name being what a reader hears, and it stands in for the dot a tag used to
  carry, which said nothing a pill wearing the colour did not. The filter's own strip says `hash`
  on its `FilterChip` for the same mark, where the dot still confirms the pick.

- **One form creates and saves, and it posts every field.** `PUT /api/tasks/{uid}` takes the task
  as it will then be, so a field the form left out would be cleared on every edit: the two modes
  differ only by which action runs and whether a `taskUid` rides along. The submit is intercepted
  for the same reason a group's picture is, and **`TASK_PHOTO` presigns against the group**, not
  the task, so a picture can be attached while creating one where a group's cannot.
- **A repeating task needs a date, and the schema is where that is settled.** The endpoint refuses
  the pair with a 400 carrying no code, so `taskSchema` carries an object-level refine reporting it
  on `dueDate`.
- **The due date is two fields here and one instant on the wire.** A day and an optional clock
  time, which `taskWriteRequest` turns into an offset instant in the reader's own zone, passed in
  like every other zone-aware call. **An empty time means the end of that day**, so a task due
  Tuesday is overdue on Wednesday rather than at Tuesday midnight, and `dueFields` reads 23:59 back
  as a blank time because nobody typed it.
- **The form's assignee posts a membership uid, where the filter's posts `me`.** A filter is a link
  anybody opens as themselves; an assignment names one person. People who have left are not offered
  at all, a task having nowhere to go to somebody who is gone. **Both pickers read the same
  roster**, so `assigneeOptions` takes the word for nobody rather than holding it.
- **A refusal a write can blame on one field is `taskFieldRefusal`**, the one place that reads
  them. `assignedToUid` and `defaultAssigneeUid` both answer 404 carrying no code, as the task
  itself does, so those two are told apart by the backend's own message and `taskGoneMessage`
  stands aside for them: a bad uid otherwise read as "That task has been removed". A due date in
  the past is the same shape with a code, `TASK_DUE_DATE_PAST`, and lands on `dueDate`.
- **The due date picker stops at today, and the schema has no say in it.** The endpoint refuses a
  new task dated before the caller's own today, judged in the offset we send, so `DueFields` takes
  a `min` the page works out as `dayKey(now, timeZone)` and hands down. **The floor is on both
  modes**: an edit may keep a date that has gone by, which the stored value still shows and still
  posts, but nothing may pick another past day. The rule cannot live in `taskSchema`, which knows
  neither today nor the task's stored date, so the refusal is routed to the field instead.
- **`FilterSelect` reports a pick and follows a value written from outside.** The mirror needs
  both: the editor holds the answer in its own state, and a field whose value was mirrored has to
  show what the form will post. The sync is in render, not an effect.
- **Tags are free text the backend creates on the way through, capped at five.** Every picked name
  is a real checkbox, so ticking the household's own works with no JavaScript, and a typed one is a
  checked box too since nothing else would carry it. Folded case-insensitively before the cap,
  because the backend matches that way and `Weekly` must not cost two of the five.
- **The two Add task presses are links, drawn only inside a group**: the header's renders nothing
  elsewhere, a task having no group to belong to.
- **One bar, in two shapes, and one tree.** On a phone it is a two-column grid: the search takes
  the top row and the layout and the filter take the corners of the one under it; from `sm` it is a
  single flex row, the layout on the left and the search and the filter on the right. The grid's
  placement classes do nothing once it is a flex row, so the corners are written once with no
  `sm:` undoing them. Six pills across the top were tried and dropped: the row never fit a phone,
  and a reader setting three things paid three page loads.
- **The layout is one picker at every width: a pill that moves along a track of two.** The chosen
  one carries its name, the other is its icon alone with the name still read out, so the control
  fits a phone without becoming a second component. Two shapes were tried and the phone's
  **could not work**: its rows closed the menu on the press that submitted them, and a form taken
  out of the document during a click never submits, so the cookie was never written. `view.labels`
  is the one place a layout's name and icon are read from, and the track is `w-fit`, or its column
  stretches it and leaves dead space inside its border.
- **The panel is a GET form and applies in one press**, in two sections: the order first, then
  everything that narrows, as Assigned to, Category, Tag, Priority, Status, Due. Every axis posts a
  plain form field to the board's own path, so the panel needs no JavaScript beyond the press that
  opens it. **It never posts the page**, which is how a new filter starts at the first one, and the
  trigger counts the axes it holds, leaving the search out: that has its own box.
- **With JavaScript the submit is taken over, so an untouched axis is not in the URL.** A native GET
  posts every field it holds, and an untouched one posts empty, which left `?category=&tag=` on a
  board they narrow nothing on. The handler reads the form back through `taskQuery` and writes it
  out through `boardHref`, so a press here and a link anywhere else cannot disagree, and the native
  post stays for a browser with no JavaScript.
- **The panel is a sheet wherever the phone's bar is, and a dropdown where it is not.** Below `lg`
  `GroupBar` is fixed over the end of the page, so a panel hanging off the trigger put its own
  footer underneath it on a short phone: there it is `fixed` above the bar instead, which is also
  where a thumb reaches. `--spacing-shelf` is the one place the band that bar reserves is written.
  Measured: 25px clear at 390x667, 390x844 and 768x1024.
- **`FilterSelect`'s list is in flow, not an overlay.** It opens inside a box that scrolls its own
  fields, and an absolutely positioned list is clipped by that box, which put most of it under the
  panel's footer. In flow it extends the scroll content instead, and pushing the fields below it
  down costs nothing where every answer is one line.
- **Every field is a disclosure, and a collapsed one is hidden rather than unmounted.** The legend
  is the whole press at `text-label-lg`, plus or minus at its end. A form posts a field it cannot
  see, so a collapsed axis keeps the choice already on it; unmounting would clear the filter the
  moment a reader tidied the panel. **jsdom loads no CSS, so the hiding itself is a browser
  check**; what a test pins is `aria-expanded` and that a collapsed field still posts. Measured:
  six 36px rows 4px apart, the whole block 381px, no scrolling on a 390x844 phone.
- **Which fields are open lives in `FilterFields`, not in each one**, because one press in the
  Filter heading sets them all: it reads "Expand all" until every field is open and "Close all"
  after. `Field` is controlled, so the press and a field's own legend write the same state.
- **A field opens on arrival only where something is picked.** `appliedAxes` is the one place that
  says which axes hold something back, which the trigger counts and each field reads its own flag
  from, so what is applied is never hidden behind a plus.
- **A field is pills, a strip or a dropdown, by how many answers it has.** `Field`'s `layout` names
  which: status, priority and overdue are pills; category and tag are **strips**, since a household
  with twenty categories would stack five rows deep and push Apply off a phone; sort and assignee
  are `FilterSelect`, our listbox rather than the platform's, posting through a hidden input. The
  assignee is a `block`, since a full-width control collapses inside a flex row. **Overdue is its
  own field, not a priority**, which is the three levels alone.
- **A pill that names a label wears that label's colour, and a category its icon.** `label-pill`
  tints it from the stored hex and **deepens the same colour when the input inside it is checked**,
  so the strip reads as colours whether or not one is picked and no pill is ever filled with a hex
  the text would disappear into. One utility rather than a second behind `has-[:checked]:`, which
  would set the same two properties and leave the stylesheet's order to settle it. `LabelMark`
  draws the icon, falling back to the dot for a tag and for an icon name the set does not hold, so
  a pill never loses its mark. **A tag's dot waits for the pick**, which `markOn` is the flag for:
  the pill already wears the colour, so the dot confirms the one that is on rather than repeating
  on all of them. A category keeps its icon drawn throughout, that being what names it. The same
  pill is the task form's category row, and the task's own tag chips carry the dot too.
- **A strip takes the wheel and a drag, not just its scrollbar**, which is 6px at the foot of a
  panel. `Strip` translates a vertical wheel sideways through a listener of its own, React's
  `onWheel` being passive and unable to stop the panel scrolling too, and hands the wheel back at
  either end so a reader is never stuck on it. A drag is **a mouse only**, a finger already
  scrolling it, and it swallows the click it ends with: the press would otherwise tick the pill it
  started on. Five pixels of slack, so a press with a twitch in it is still a press.
- **Each section's name carries a rule under it**, so Sort and Filter read as two blocks rather
  than one list with two labels in it, with the expand press at the right-hand end of Filter's.
- **The assignee dropdown offers the reader once, and `who=me` is what it posts.** Anyone and
  Unassigned come first, then a rule, then `Me (their name)` and everybody else: a second row under
  the reader's own name was the same board twice. The row keeps `me` rather than their membership
  uid, which is what makes a filtered board a link anybody can open as themselves, and `whoValue`
  folds a URL naming their own uid onto that row, since a typed URL may say either and they mean one
  board. The rule is a `divider` flag on the row below it, drawn as decoration rather than a
  `separator`, since a listbox may own nothing but options.
- **`WhoChoice` and `LabelChoice` are declared once**, in `tasks/filter/filter.types`. Four copies
  had drifted: the page's `LabelChoice` carried no `color`, so every tag swatch in the filter was
  drawing the default instead of the tag's own.
- **`min-w-0` on the fieldset is load-bearing.** A fieldset defaults to `min-width: min-content`,
  so it grows past the panel rather than letting a strip scroll inside it. Measured.
- **Only the fields scroll; the footer is pinned.** `overflow-y-auto` on a box makes its `overflow-x`
  auto as well, which let the fields box swallow the scroll the strips wanted, so it says
  `overflow-x-hidden` too. Apply is outside that box, or it falls below the fold on a short screen.
- **The panel's pills are 36px, under the app's 44px floor**, deliberately: six fields of them at
  full height scroll before a phone can reach Apply. Everything on the bar itself stays 44. **The
  task form's own choices are the same 36px**, so a pill in the panel and a pill in the filter
  measure alike, and its footer presses and the panel's close stay 44. **The priority track's
  chosen segment wears that priority's own tone**, not the brand fill, so the form shows what the
  board will say.
- **The search replaces the URL; it never submits its form.** `requestSubmit()` on a GET form is a
  document navigation, so every keystroke reloaded the page and the arriving document put its own
  older `q` back in the box. The submit is cancelled and `router.replace` runs instead, which is
  what the group list's search does. The form and its hidden fields stay, for a browser with no
  JavaScript.
- **A pill in a strip is `relative`.** Its checkbox is `sr-only`, so absolutely positioned, and
  with no containing block of its own it escapes the strip's overflow and widens the whole page.
  Measured: 85px of horizontal page scroll at 1280.
- **The layout is a cookie, not the URL.** `tasklean_view` holds `list` or `cards`, because it is
  the reader's own preference and should follow them to the next group where a filter should not.
  Only an action may write a cookie, so the pills are a form with two submit buttons carrying the
  value, which also makes them work with no JavaScript.
- **A row is a grid of four columns and two lines, and the same tree draws both shapes.** The due
  date leads, then the status pill, the name and the rest of its pills, then the assignee and the
  menu; the repeat and the
  photo proof go on the line below. The date, the assignee and the menu **span both lines and are
  centred** down them, the date answering for the whole task rather than for its upper line. On a
  phone the pills drop under the name, the assignee is its avatar alone, the menu's column is not
  drawn at all and the marks ride at the end of the pills. Measured at 360, 390, 768 and 1280:
  nothing scrolls sideways.
- **The date is digits in a fixed slot, and the slot is kept on a task with no date**, so every
  name down a board starts on one line. It is the name's own size at `text-body-lg-strong`, so the
  date leads the row, and **it keeps the foreground colour whatever it says**: the tone
  `dueDigits` carries is drawn as a 2px rule under the digits instead, `bg-destructive` for overdue
  and `bg-warning` for due soon, with nothing at all under an ordinary date. The wording is in the
  bubble and in the text a reader hears, not in the colour. The digits read `11/3`, with the year
  only where it is not the one being read in.
- **The marks are written once and placed twice**, since no one container is both the line under
  the name and the end of the row of pills. One copy is `sm:hidden` and icon-only, the other
  `hidden sm:flex` with the words; a hidden copy is out of the accessible tree, so neither is read
  twice.
- **A row's own menu views, edits and deletes, and every reader has one.** View is the row's own
  link, so the menu is never empty; Edit and Delete are drawn for the author or an admin alone.
  Edit carries `?edit=1`, since the editor is the panel's state and a row cannot reach it; Delete
  asks in the panel it opened and reports a refusal there rather than taking the board. Nothing
  navigates on a success: the action revalidates the board and the row goes away with it.
- **The menu hangs under whatever opened it**: the three dots where they are drawn, and the row
  itself on a phone, where the hold was, the wrapper being positioned from `sm` only so the row is
  what the panel resolves against below it. **It flips above that where the screen has no room
  underneath**, measured off the wrapper as it opens, since a row near the foot of the page
  otherwise puts its panel under the group bar, which is fixed there up to `lg`. **The wrapper is
  raised to `z-30` while it is open**: the next row's menu is positioned at the same level and
  later in the document, so at `z-10` it painted over the panel. **The press wears the hover's own
  fill while the menu is open**, a hover not surviving the press that opened it and never having
  been there on a touch screen.
- **On a phone the menu is a long press on the row, and the three dots are not drawn.** A control
  per row costs width a phone has not got, and nothing is lost to anybody who cannot hold a finger
  down: the open task carries Edit and Delete of its own. `useLongPress` is touch and pen only, a
  mouse having the dots and meaning to select, gives up on a finger that moves and **swallows the
  click it ends in**, which would otherwise open the task over the menu. The row is `select-none`
  below `sm` for the same press.
- **The row is a client component for those two things alone.** `RowPress` holds the disclosure and
  the handlers and takes the cells as `children`, so everything in a row is still rendered on the
  server.
- **The row's link is stretched over the whole row with `after:inset-0`**, which is what lets the
  menu be a real button beside it rather than a control nested in an anchor. The row carries the
  focus ring for it with `has-[a:focus-visible]:`, and the menu sits above it on `z-10`.
- **An unassigned task is drawn exactly like an assigned one**, down to the circle: `Avatar` falls
  back to a person where it is given no name and no picture, so a column of assignees reads as one
  column rather than as two kinds of thing.
- **Every pill says what kind of thing it is, on hover**, in the open task as well as on a row.
  `Tooltip` names the axis over the category, the status, the priority and the assignee, where the
  date and the marks put their own wording there instead, the digits and the icons not carrying it.
  The chip keeps the `sr-only` text it already had, the bubble being `aria-hidden`. **The open
  task's three hang below their row**, being the first row of a box that scrolls, which clips
  whatever sits above it.
- **A card is the photo, or the category's colour where there is none**, so a grid of tasks
  nobody has photographed still reads as a grid. The colour sits under the picture rather than
  beside it, so a dead upload falls back with no handler and one request. **It clips nothing**, a
  bubble being an absolute child, so the photo rounds its own top corners. The picture is `h-36`
  on a phone and `h-48` from `sm`, where a card is the face of the board rather than a strip. **The
  name is `text-title-lg`**, a step the scale grew between DESIGN.md's `headline-sm` and
  `headline-md`, and **the wash over it is as long as the picture lets it be**: `pt-space-3xl` is
  the gradient's own length, three stops from solid under the name to gone at the top, since a
  short one reads as an edge rather than as a fade. The body pays `py-space-sm` against the sides'
  `space-md`, so the height under the picture is its three lines rather than its padding.
- **A card reads in four bands: the picture, its facts, its pills, who has it.** On the picture sit
  the status at the top left, the two presses at the top right and the name at the foot of it; then
  the line that reads straight off it, the due date in words beside the repeat with the photo mark
  at its far end;
  then the priority and the category; then the assignee and the estimate, one at each end of the
  foot. **One pill on the picture, and the status is the one**, where the rest have room for their
  words below it. The status, the name and the body all keep the same `space-md` gutter, so the
  card has one edge rather than three, and the foot is `items-end`, which puts the estimate on the
  assignee chip's own base rather than against the middle of its circle. Every pill names its axis
  on hover, as a row's do.
- **A card dates a task in words, with no pill around it.** `dueSpelled` is `dueDigits`'s twin for
  a line that has the width: `longDate` in `time/day` spells the month out and adds the year only
  outside the one being read in, and `DUE_WORDS` tones the words where a row's pill tones a fill.
  **The nearest two days are named rather than dated**, as they are on a row, so it reads `Today`
  or `Tomorrow` with the date itself behind it in the bubble; a task already late keeps its date,
  which is how late it is. **The colour is the glance, never the whole message**: the state is in
  the bubble and in an `sr-only` word before the date, so "Overdue 21 November" and "Due Today" are
  what a reader who cannot see the red hears. It sits beside the repeat and the photo mark, which
  already read as icon plus words.
- **A card's bubbles hang from an edge, never centred.** A transformed box still counts towards the
  scrollable overflow, so a centred bubble on a pill near the right-hand column widened the whole
  page: the left-hand pills are `above-start`, the estimate `above-end` and the status `below`,
  being the first thing on the card. `TaskMarks` takes a `place` for the same reason.
- **Edit and the dots are one control in two halves, and the menu then holds View and Delete.**
  `CARD_ACTIONS` is the shell, a bordered rectangle over the picture with `CARD_DIVIDER` down the
  middle, and `CARD_ACTION` is a half: 32px, under the app's 44px floor as the filter panel's pills
  are, measuring 73 by 36 together. **The shell cannot clip**, the menu's panel hanging out of it,
  so its own `p-0.5` is what keeps a half's hover fill inside its corners. `CARD_FILL` is written
  whole both ways, a resting half and an open one both setting a background.
  The pair **fades in under a mouse and stays drawn for a finger**, which has no hover to reveal it
  with, and an open menu holds it there (`has-[[aria-expanded=true]]`) so its panel is never left
  hanging off nothing.
- **`CardMenu` is the card's own menu, not the row's wearing another look.** It owns its
  disclosure, which `RowPress` holds for a row, so the card itself stays a Server Component, and it
  offers View and Delete alone, Edit being the half beside it. It is the one of the two menus with a
  test of its own, holding the delete and the gate rather than inheriting the row's. The two are
  drawn in different places and will drift, and the lane board to come opens this one, so the
  panel's paint is written twice on purpose.
- **The name is the card's link, stretched over the whole of it with `after:inset-0`**, which is
  what lets the menu be a real button over the picture rather than a control nested in an anchor.
  The card carries the focus ring for it with `has-[a:focus-visible]:`, and the menu sits above the
  stretched link on its own `z-10`, as a row's does.
- **The name is read off the card's own colour rising out of the picture.** `SCRIM` is a gradient
  `from-card` under `text-foreground`, so it is dark words over a pale wash in one scheme and pale
  words over a dark one in the other, with no second palette to keep in step.
- **A card's controls are drawn at every width.** A card has no long press to reach the menu with,
  so neither half can be a desktop control, and the shell's own fill is what keeps them legible
  over a photo.
- **A flex column stretches its children**, so a pill inside a card needs a row of its own or it
  spans the card. Measured.
- **Who may change a task is a third permission model.** `canEdit` on the backend is the author or
  a group admin, where every member may view, complete, skip and claim. `canEditTask` reads it from
  `createdBy.memberUid` against `myMemberUid`, and it is UX: each press still handles its own 403.
- **A due date is named rather than dated for the nearest days**, and `overdue` is the backend's own
  verdict against its clock rather than one worked out again here. The whole board is measured
  against one instant passed down from the page, so every row agrees and the browser hydrates to
  what the server drew.
- **Five reads, run together and reported separately.** Only the board's own failure costs the
  reader anything they came for; a failed roster or label read costs a filter menu. The rows carry
  their own tags and assignee, so the category list is the only one a row needs.

### Labels

- **A category is the household's filing system; a tag is a member's label.** A task has one
  category and up to five tags, a category is referenced by `categoryId` and a tag **by name**, and
  a category cannot be deleted while tasks are filed under it where a tag can be deleted whenever.
- **The permissions split per control, not per screen.** Both lists are everybody's. A category is
  wholly an admin's. A tag is added and recoloured by any member and renamed or removed only by an
  admin, and **the backend splits that one PUT by field**: the body is refused when a non-admin
  sent a different name, compared exactly, so changing only the case is still a rename. A member's
  save therefore reposts the stored name as a hidden field.
- **A control the reader will never have is not drawn**, where one that is merely unbuilt stays a
  disabled button. **Only a member is told why**: an admin is drawn every press there is, so a line
  listing them says nothing, which is why `note` is optional and passed for a member alone.
- **The add press shares the title's line and wears the brand colour.** It is the thing each section
  is for, so it is the filled pill rather than the quiet one, on the `h2`'s own row at every width
  with the description running the full width below it.
- **Both PUTs replace the whole label**, so a save carries the colour and the icon it already holds.
- **A deleted name stays taken.** Creating it again revives the original row, with its id, its
  colour and the tasks still filed under it. Renaming onto that name is refused instead, since only
  a create revives. **Nothing in the response says which happened**, so the screen cannot call it
  restored rather than created, and a 409 on a create can therefore only be a live label.
- **The taken-name refusal is one sentence, and says nothing about deleted labels.** A create
  refused that way collided with a label the reader can see, and a rename never revives anything.
- **A label's colour is data, not a token.** `labels/palette` holds the hex codes because the value
  is stored on the label and has to outlive any change to the design. How it is painted is
  `label-tint` in `globals.css`, which reads `--label-color` off an inline style and mixes it into
  the background: 16% in light and 26% in dark, where the same percentage reads as no colour.
  `label-pill` is the same recipe for a label that is a choice, deepened to 38% and 52% once the
  input inside it is checked. `labelTint` is the one place the value and its fallback are written.
- **The list reads first and the fields appear on a press.** The press sits at the top right of the
  section's heading and opens the form at the **top of the card**, so a household with forty labels
  scrolls to neither. It takes the same label as the form's own submit and is drawn only while the
  form is closed, so one label never names two controls. `LabelSection` owns that state, and builds
  the two forms itself, because the press and the form sit in its two halves and a Server Component
  cannot hand a client form its `onCancel`. **Nothing on this screen works without JavaScript**:
  revealing the form, a row that swaps into an editor and the confirm step are all client state, the
  same standing the roster's presses already have.
- **A colour and an icon are one circle each, showing the choice and opening the rest.**
  `SwatchSelect` is built on `LocaleSelect`'s mechanics rather than `useDisclosure`, because it
  posts a value: focus stays on the button, `aria-activedescendant` names the active cell, the panel
  cancels `mousedown` so a press is not preceded by the blur that closes it, Enter and Space cancel
  the default, and the grid has a fixed five columns so up and down can move by a row.
- **A name field is capped at `sm:max-w-xs`.** A name is 100 characters at most, so a field spanning
  a desktop card is far wider than anything typed into it.

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
- **The settings shell does it the other way: nothing scrolls but the section.** At `lg` the shell is
  `calc(100svh - var(--spacing-header))` tall, so the `h1` and the rail stay put without sticking,
  and the columns carry `lg:overflow-y-auto` over a `lg:min-h-0` grid, whose floor would otherwise be
  its own content and grow the page instead.
- **The settings panes scroll with no scrollbar at all**, through a `scrollbar-none` `@utility`
  beside the slim one: `display: none` on WebKit's pseudo-element and `scrollbar-width: none` for
  everyone else. The wheel, the keyboard and a trackpad all still scroll them.
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

- **`TASK_PHOTO` is signed against the group, not the task**, so unlike a group's own picture one
  can be attached while the task is still being created. **`COMPLETION_PHOTO` is signed against
  the task**, proof of one round being no use against another, and by then the task exists.
- **An uploaded picture is addressed by uid and painted as a background.** The bucket is private, so
  `photoUid` is an upload rather than a URL and `uploads/image-src` turns any uid into
  `/api/image/{uid}`, whatever the picture is of. A group's is a square with its first letter where a
  person's is a circle with their initials, and **the letter is always drawn, with the picture as a
  layer over it**: a background that 404s paints nothing, so a dead upload falls back with no
  handler, no state and one request. An `<img>` would draw the browser's broken glyph whatever its
  `alt` says. `GroupAvatar` and `Avatar` are the two places an inline style is used, for the URL.
- **`Avatar` draws our upload and Google's URL differently, and ours wins.** An account carries one or
  the other, never both, so a `photoUid` is drawn as the layer above and a `photoUrl` stays
  `next/image`: the optimizer allows that host and is worth having, where our own route is behind the
  session and may legitimately 404. `isRenderable` and `next.config.ts`'s `remotePatterns` therefore
  guard only the URL half.
- **The picker is a bordered block, and the border is the drop target.** It is dashed at all times
  and only its colour changes, a border appearing on a drag having shifted everything inside it:
  the form's own edge colour at rest, the brand's over a dragged file. The dashes are what say the
  block takes a file.
- **The picker previews the shape the picture will be saved in.** `ImagePicker` takes a `shape`,
  square for a group and `circle` for a person, so what is chosen is seen as it will be drawn. Each
  shape names its own radius in `previewBox`, since two radius utilities in one class list resolve in
  the stylesheet.
- **The image route tells a missing object from a broken bucket.** A read is presigned without
  checking the key exists, deliberately, since a `head` per avatar is a round trip, so a bucket that
  lost its objects while the database kept its rows answers 404 and the route passes that on. Every
  other failed read stays a 502. Nothing clears the dead `photoUid`: a write driven by a render
  would delete a good picture on a passing outage.
- **Saving a group replaces it, so an omitted `photoUid` is how a picture is removed.** `PUT
  /api/groups/{uid}` takes the group as it will then be, so `EditGroupForm` posts the uid the group
  already holds on every save that is not a removal, and never a blank one: `""` passes the
  backend's validation and then fails the lookup behind it as a 400. `optionalUidRule` enforces it.
- **Saving a profile replaces it the same way, and its subject comes off the session.** `PUT
  /api/users/{uid}` takes the profile as it will then be, so `ProfileForm` reposts the uid the
  account already holds and `updateProfileAction` takes the user uid from the cookie rather than from
  the form: only the subject may send a `photoUid`, and the backend refuses a body carrying one for
  anybody else. The save then reseals the session, so the chrome's name and avatar follow it.
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
- **A task is a task, everywhere.** Copy, comments and both documents say task, never chore, so
  the screens, the API, the column and the URL all carry the one noun.
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
- **So does the avatar, but it costs one call at sign-in.** `AuthResponse` carries no picture of
  either kind, so `startSession` reads `/api/users/me` once and seals both fields, leaving `Avatar`
  the one place that picks. Best effort: a failure costs an avatar,
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
- **The reader's zone is a cookie the browser writes, `tasklean_tz`.** Nothing on the server knows a
  zone: no API field holds one and no request header carries one. `ZoneProbe` sits in the signed-in
  layout, writes the cookie when it differs from the one there and refreshes once, so a first document
  is drawn in UTC and redrawn. It compares against the cookie, not against what was rendered, and
  refreshes only if the write landed, or a browser blocking cookies would reload forever.
  `readTimeZone()` validates through `Intl` before the value reaches a formatter.

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
- **Signing out already ends every tab's session; the channel only makes them show it.** The cookie
  is browser wide, so a stale tab is already bounced by Proxy, refused by `serverApi` and 401'd by
  the image route. `auth/signed-out-channel` posts to the other tabs so the page they are painted as
  catches up, and `SignedOutListener` sits in the signed-in shell. **It reloads the document, never
  `router.refresh()`**, which is modelled as a navigation to the route it is already on and so
  discards the redirect Proxy answers with, leaving the tab painted as it was.
- **The post happens on arrival, never on a press.** `SignedOutBroadcast` renders on the screen a
  sign-out lands on: `/login` behind `signedOut`, `deactivated` or `reset`, and the home page behind
  the `/?signedOut=1` logout redirects with. Arrival is the first moment the cookie is certainly
  gone, where a press would race the backend call logout makes first, and a refused "sign out
  everywhere" would sign the other tabs out anyway. **Same browser profile only, and a deliberate
  sign-out only**, so a session that expired on its own leaves the other tabs stale until touched.

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
- **A task carries two members, and only one of them moves.** `assignedTo` is the round in hand
  and `defaultAssignee` is whose task it is; a finished round, skipped or missed alike, puts
  `assignedTo` back to `defaultAssignee`, and a create with an owner and no assignee starts the
  first round with the owner. A write names them `assignedToUid` and `defaultAssigneeUid`, both
  membership uids. `PUT /api/tasks/{uid}/assignee` moves the round alone and **has no caller
  yet**: the form's whole-state PUT already does it.
- **A person carries a `photoUid` or a `photoUrl`, never both, and the uid is ours.** `photoUid` is
  an upload read through `/api/image/{uid}`; `photoUrl` is only what Google provisioned the account
  with, and clearing ours makes it reappear. Both fields ride on `/users/me`, `/users/{uid}`, every
  roster user and the trail's actor, so a reader taking `photoUrl` alone shows nothing for anyone who
  uploaded. **Only the subject may write one**: a `photoUid` in a body for somebody else is a 403
  whatever the caller's platform role, so an admin editing another account must omit the field.
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
  scope in the path, as do a group's categories and tags (`GET /api/groups/{uid}/categories`,
  `/tags`), though tasks and audit logs still take `?groupId=`. **A write to a label carries no
  group at all**: it addresses one by numeric id, and a create names the group in the body.
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
