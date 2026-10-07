# TasKlean Frontend Bible

Why this app is built the way it is. Decisions, the reasoning behind them, and what we know about
the API we're consuming. Operational rules live in [CLAUDE.md](CLAUDE.md).

**This document grows as we build.** It is not a plan for the whole app. A section appears when we
actually decide something, and says _why_ — so the reasoning survives even when the decision is
later reversed. Things we haven't decided live under _Open questions_, unanswered, rather than being
guessed at and written down as if settled.

**Companion documents** — not restated here:

| Question                         | Authority                          |
| -------------------------------- | ---------------------------------- |
| What shape does the API return?  | `../tasklean-be/docs/openapi.json` |
| How does the API _behave_?       | `../tasklean-be/PROJECT_BIBLE.md`  |
| Backend conventions and commands | `../tasklean-be/CLAUDE.md`         |

Where shape and behaviour disagree, behaviour wins — the spec deliberately cannot express semantics
("rejoining does not restore an admin role") or authorization ("this endpoint needs GROUP_ADMIN").

---

## What we're building

TasKlean is a household task management app for families, roommates and couples. Tagline:
**"Clean tasks, clear minds"**. Domain: **tasklean.app**.

It's a web app, **also installable as a PWA** — a normal site that works in any browser, which
people who use it often can install to their home screen and get offline tolerance and push
notifications from. PWA is a capability we add, not a different kind of product.

The frontend is the whole product surface. The backend is a stateless REST API with no UI, so every
part of TasKlean a person touches gets built here.

The practical constraint that falls out: **mobile-first, genuinely.** The core interaction is
someone standing in a kitchen marking a chore done. Two taps from a cold start, one hand, 375px.

A native app (React Native or Flutter) is a possible future sibling. It would talk to the Spring API
**directly** with Bearer tokens in OS secure storage — not through this app. That's why the API
stays Bearer-only and why nothing browser-specific was pushed into the backend.

### MVP scope

From the backend bible — the feature set the API was built for:

- Register (email/password and Google) with email verification, and log in
- Create a group, share an invite code, join by code, be in **multiple groups** at once
- Two group roles: `GROUP_ADMIN` (manage group, invite/remove members, change roles, rotate the
  code, manage categories and tags) and `GROUP_MEMBER`
- Tasks with name, description, photo, priority, time estimate, recurrence, tags, category
- Recurring and one-off tasks
- Assign tasks to group members
- Complete tasks, with optional photo proof
- Notifications, and pinging members about a task
- Filter and search tasks by assignee, priority, status, tag, category
- List view and calendar view

Not MVP: task rotation and fairness dashboard, rewards, templates, dependencies, analytics. Don't
design around them — but note that the group is the scoping boundary for all of them, so that part
is already right.

---

## Decisions so far

| Decision                                                   | Reasoning                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js, App Router**                                    | Server Components keep tokens and API calls off the client, and Route Handlers give us the session layer in the same deployment.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **TypeScript, strict**                                     | The whole job is consuming someone else's contract. Types are the cheapest correctness available.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **TailwindCSS**                                            | Settled with the backend. Utility-first suits a mobile-first component set we're writing ourselves.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Hand-written types, per feature**                        | We are _not_ generating a client from `openapi.json`. Generating gives a correct client instantly and teaches nothing; writing the types for an endpoint when you build against it means reading the contract and understanding it. Cost: drift is possible, caught by reading the spec when a feature touches it.                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Node 26**                                                | We track LTS. Node 26 is the _Current_ line until **2026-10-28**, when it becomes Active LTS (supported to 2029-04); Node 24 is Active LTS today. Adopting 26 a few weeks early means the project sits on one release line for its whole life instead of migrating a month in. Next.js declares `node >=20.9.0` with no upper bound, so nothing blocks it. Cost: a short window on a Current line, which is low risk with no native dependencies.                                                                                                                                                                                                                                                                                                                      |
| **No Node version manager**                                | Installed from the official MSI via winget rather than through nvm-windows / fnm / Volta. With one JS project there's nothing to switch between, so a manager is pure added attack surface: it fetches executables at runtime, and reading nvm-windows' `src/web/web.go` shows **no checksum or signature verification** of downloaded Node binaries, an inverted `InsecureSkipVerify` flag on its proxy path, and an `http://` fallback for scheme-less mirror settings. The MSI route gets an Authenticode-signed installer (verified: `CN=OpenJS Foundation`) plus winget's pinned-SHA256 check, and fetches nothing afterwards. Fallback to another version is still one winget command. Revisit fnm or Volta only if we genuinely need per-project Node versions. |
| **npm is whatever Node bundles**                           | No globally installed npm. Node's `npm` shim prefers a global npm over the bundled one, so a stale `npm install -g npm` silently pins npm while Node moves on — which is exactly what we found on this machine (npm 10.9.1 shadowing Node 26's 11.19.0). One fewer independently-versioned thing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **React Query when we need it, not before**                | See below.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Vitest + Testing Library + MSW for unit tests**          | See below. The end-to-end tool is deliberately deferred.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Server Components fetch first, React Query after**       | See _Data fetching_ below.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **No global state library**                                | React Query holds server data, the URL holds filters and sort, a cookie holds the active group and theme. That covers everything we have. Adding Zustand later is cheap; unwinding a store full of server data is not.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Design tokens before components**                        | Colour, spacing, typography and radius defined as Tailwind theme tokens in one place, with the dark-mode mechanism chosen up front. Both are miserable to retrofit across a built-out UI — the tokens because every hard-coded value has to be hunted down, dark mode because it changes how every colour is declared.                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **One API client, one error type** | See _API client_ below. |
| **Env validated by hand, not with Zod** | Fifteen lines in `src/lib/env.ts` for three variables, reporting every missing one at once. Keeps Zod a genuinely open decision for forms later instead of smuggling it in as a dependency here, and an explicit loop is clearer than a schema while learning. Revisit if the set grows, or needs coercion, defaults or per-variable rules. |
| **LF line endings pinned in the repo** | `.gitattributes` with `* text=auto eol=lf`. A fresh Windows clone with `core.autocrlf=true` checks the tree out as CRLF, which Prettier (`endOfLine: lf`) then rejects for every file — a repo-wide `format:check` failure that reads as a formatting problem and isn't. Pinning it in the repo makes the rule travel to every machine rather than depending on local git config. |
| **Session in an httpOnly cookie, tokens server-side only** | Forced by the backend's design. See _Session and auth_.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

### React Query

TanStack Query is the choice for client-side server state, and it works with the App Router — but
it's **not installed at scaffold time**, deliberately.

With Server Components, the first render of a page fetches on the server and ships HTML. React Query
adds nothing there; it would be ceremony around a fetch that already happened. It starts genuinely
paying when a view is _interactive against the server_: the task list where filters re-query,
optimistic completion toggles that need rollback on failure, a polled unread-notification badge,
cache invalidation after a mutation so three other views update.

So: build the first screens with Server Components and Server Actions, feel where that gets awkward,
then add React Query at that point. That way its concepts (query keys, staleness, invalidation) land
on a problem we've already met, rather than being scaffolding we adopted on faith.

### Data fetching

**Server Components fetch on first load; React Query owns everything after that.** They hand off
rather than compete — the Server Component fetches, seeds React Query with the result, and React
Query holds the data from then on.

Why the server for first load, given that SEO is irrelevant behind a login: **the BFF makes a
browser-initiated fetch cost two hops** (browser → Next → Spring) and that extra hop can't be
removed, because removing it means putting a JWT in the browser. A Server Component pays one hop,
server-to-server, before the page is even sent — so the page arrives with data in it instead of
showing a spinner while JS loads, hydrates and then fetches. For "two taps from a cold start on a
phone", client-first fetching buys a guaranteed spinner.

React Query then covers what the server can't: filter changes, optimistic completion with rollback,
invalidation after a mutation, and polling the unread-notification badge.

Note that tokens do _not_ decide this — they stay server-side either way, so the BFF requirement is
neutral between client and server fetching. The argument is latency, not security.

**One hard rule**: never put per-user data in a shared server cache. Per-session caching on the
client is fine; a group's task list in a shared cache leaks between households.

### API client

`src/lib/api/client.ts` exposes a single `request<T>()`. Four choices in it are worth the reasoning:

**Auth is a parameter, not a session lookup.** `request()` takes an `accessToken` and knows nothing
about cookies, sessions or refresh. The session layer and single-flight refresh _wrap_ it. Folding
refresh into the client would mean the module that unwraps envelopes also owns token rotation, and
the refresh path is the one piece of phase 1 that can't be tested locally — keeping it outside means
the client stays trivially testable and refresh can be reasoned about on its own.

**One `ApiError` carrying a status, not a class per status code.** The status _is_ the discriminator,
and the set isn't knowable in advance: `openapi.json` documents only 200/400/401/403/429/500, while
`404` and `409` demonstrably occur. A subclass hierarchy over an open set would be wrong the first
time the backend returns something new; a status field never is.

**A second error type, `ApiResponseFormatError`, for "this isn't the envelope".** The backend renders
_every_ failure as envelope JSON, including a 404 on an unknown route and a 429 from the rate
limiter. So a non-JSON or non-envelope body doesn't mean the API failed — it means something else
answered: a proxy, or `API_BASE_URL` pointing somewhere wrong. That's a different bug with a
different fix, so it gets a different type rather than being flattened into a 500.

**An empty 2xx body resolves to `undefined`** rather than throwing, so a `204` on a delete is
ordinary. A 2xx that _does_ carry a body must be the envelope. The leniency is deliberately
one-sided: absence is plausible, malformed presence is not.

### Testing

**Vitest + Testing Library for units, MSW at the network boundary.** Arrives in phase 1, not phase 0
— an empty harness rots, and phase 0's job is a running app. **The end-to-end tool is a separate
decision, deferred** (see _Open questions_).

There is a limit on how far unit tests can reach here, and it's worth knowing up front. The Next.js
docs are explicit that **async Server Components can't be unit tested**, and recommend e2e for them:

> Since `async` Server Components are new to the React ecosystem, Vitest currently does not support
> them. While you can still run unit tests for synchronous Server and Client Components, we recommend
> using E2E tests for `async` components.

Our convention is Server Components by default, and they'll be async because they fetch. So **unit
tests cover the logic layer and client components, and the pages need something else** — whatever we
pick later. The reason Next gives is that async Server Components are new to _React_, so this is not
a Vitest-vs-Jest differentiator; Jest is in the same position. Our httpOnly cookie session is the
other thing jsdom can't reach, so the login → cookie → protected-route path falls on the same side
of that line.

**Vitest over Jest** because its setup is five dev dependencies and a ten-line config, where Jest
needs the `next/jest` transform wrapper and more ESM wrangling. Vitest is ESM/TypeScript-native
through Vite, so there's no Babel/SWC layer to debug when an import mysteriously fails — fewer
confusing moving parts, which is worth real money while learning. Its API is Jest-compatible
(`describe`/`it`/`expect`, mocks, fake timers), so nothing learned is wasted. The one point for Jest
is that it's the React Native default — relevant only if the native sibling ever happens, in its own
repo.

**MSW returns the envelope**, including the `401`/`403`/`409`/`429` shapes, so the API client is
exercised against realistic payloads rather than stubbed functions. That's the whole point of mocking
at the network boundary instead of mocking our own modules.

**A hole to be honest about**: the refresh-and-rotation path can't be exercised end-to-end locally,
because the local backend issues year-long access tokens. Refresh gets unit-tested with a controlled
clock and mocked responses; a staging-targeted e2e run is the only real-world check.

---

## Session and auth architecture

The backend decided this and it isn't ours to relitigate: **Spring stays a pure stateless Bearer API
for every client — it never issues cookies and never handles CSRF.** The browser-only cookie concern
was deliberately pushed into this app. This matters from the first auth screen, so it's decided up
front rather than discovered.

### The shape

```
Browser  ──(httpOnly cookie)──▶  Next.js server  ──(Authorization: Bearer)──▶  Spring API
```

The Next.js **server** is the only thing that ever holds a JWT.

- The browser gets an **httpOnly, Secure, SameSite=Lax** cookie holding an _encrypted_ session
  (access token, refresh token, user identity, active group). Browser JavaScript never sees a JWT,
  so an XSS can't steal one.
- Browser→server calls go to our own Route Handlers or Server Actions. Client code has no knowledge
  of the Spring origin and couldn't reach it if it tried.
- Mutations from the browser carry a **CSRF token** (double-submit, checked server-side).
  `SameSite=Lax` alone isn't the whole defence.
- The cookie is persistent, tracking the refresh-token TTL (14 days), giving a rolling session.

### Flows worth knowing before writing them

**Register** returns **no tokens** — the account is unverified. It's `POST /api/auth/register`, then
a verification screen.

**Verify** (`POST /api/auth/verify-email`, `{ email, code }`) returns the token pair. _This is the
login._ The session cookie gets written here, not at register.

**Resend verification** always returns `200` with a generic message, whatever the email's state.
That's deliberate anti-enumeration. Never infer account existence from it, and never word the UI as
if we knew — "we sent a code" is right, "that email isn't registered" is a leak we're not allowed to
produce.

**Login** failures — unknown email, wrong password, deactivated, unverified, Google-only account —
all come back as `401` with one message. The backend won't distinguish them, so the UI mustn't
pretend to. One message, with a "resend verification code" affordance next to it, since unverified
is the most recoverable case.

**Google** — the _browser_ runs Google Identity Services and gets an **ID token**, posts it to our
server, which forwards it to `POST /api/auth/google`. Three config preconditions, all easy to get
wrong: our `NEXT_PUBLIC_GOOGLE_CLIENT_ID` must exactly equal the backend's `GOOGLE_CLIENT_ID`; our
deployed origin must be an Authorized JavaScript origin on that OAuth client; the consent screen
must be published or the tester whitelisted.

**Refresh** — access tokens live **15 minutes** in staging/prod (a year in local dev, which is why
refresh can only be tested against staging). It's **single-use with rotation**: each refresh revokes
the old token and returns a new pair, so the new pair **must** be written back to the cookie or the
session is dead. Two consequences:

- **Serialize refreshes.** Two concurrent `401`s must not both refresh — the second would present an
  already-revoked token and kill the session. Single-flight it.
- Refresh is where a **deactivation or role change takes effect** — the backend re-reads `is_active`
  and `role` there. A deactivated user keeps working for up to 15 minutes, by design.

**Logout** currently revokes **all** of the user's refresh tokens — it signs them out everywhere.
The backend plans per-device logout later. Until then, don't word the button as "sign out of this
device".

---

## The API, annotated

The full catalog is the spec. This is what a _client_ needs that the spec can't say.

| Resource          | Path                           | Client notes                                                                                                                                                                                                                                      |
| ----------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth              | `/api/auth/*`                  | Public. `register` returns no tokens. `login`, `verify-email`, `refresh`, `google` return the pair. `logout` and `refresh` take `{ refreshToken }` in the body.                                                                                   |
| Users             | `/api/users`                   | `GET /me` is the caller's own profile — **the source of the caller's numeric `id`**, needed for `?userId=` filters. `GET /api/users` (list all) is platform-ADMIN only. `PUT /{uid}/role` is SUPER_ADMIN only and has no place in the product UI. |
| Groups            | `/api/groups`                  | `GET /mine` is the one to build on — it returns `myRole` and `dateJoined` per group. `POST /join` takes `{ inviteCode }`. `POST /{uid}/invite-code` rotates and **invalidates every outstanding invite** — warn before the click.                 |
| Group members     | `/api/group-members`           | `GET` needs `?groupId=`. Role change is `PATCH /{id}/role?role=GROUP_ADMIN` — a **query parameter**, not a body.                                                                                                                                  |
| Tasks             | `/api/tasks`                   | `GET` needs `?groupId=`. Addressed by `uid`. Creating one requires `groupId`, `createdById` (a GroupMember id), `name`, `priority`, `status`.                                                                                                     |
| Task completions  | `/api/task-completions`        | `GET` needs `?taskId=`, or `/member/{groupMemberId}`. Append-only — there's no delete, so "undo a completion" isn't available.                                                                                                                    |
| Categories / Tags | `/api/categories`, `/api/tags` | Group-scoped, `?groupId=`, numeric ids. Duplicate name in a group → `409`.                                                                                                                                                                        |
| Notifications     | `/api/notifications`           | Read-only plus `PATCH /{id}/read`. All GETs need `?userId=`. `/unread/count` is cheap enough to poll for a badge.                                                                                                                                 |
| Devices           | `/api/devices`                 | Push token registration. `GET` needs `?userId=`.                                                                                                                                                                                                  |
| Audit logs        | `/api/audit-logs`              | `?groupId=`, or `/entity?entityType=&entityId=`, or `/member/{id}`. Could power a group activity feed.                                                                                                                                            |

### Status codes and what the UI does

| Code | Meaning                                                                 | UI                                                                                 |
| ---- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 2xx  | Success                                                                 | POSTs really return 201 though the spec says 200 — never branch on the exact code  |
| 400  | Validation, malformed body, bad enum/param type                         | Render against the field; `message` joins the field errors                         |
| 401  | Missing/expired/invalid token, bad credentials, deactivated, unverified | Refresh once, then log out. On the login form, one generic message.                |
| 403  | Authenticated but not permitted                                         | Permission message. **Never** log out, never retry. Not predictable from the spec. |
| 404  | Not found, or unknown route                                             | Not-found state for the resource                                                   |
| 409  | Duplicate, or a violated rule (last admin, already a member)            | Show the server's `message` verbatim — it's written for humans                     |
| 429  | Rate limited                                                            | Message plus the `Retry-After` window. No auto-retry loop.                         |
| 500  | Unhandled                                                               | Generic message; the server never leaks detail                                     |

### Rules the spec can't express

From the backend bible. Getting these wrong produces UI that lies:

- **Rejoining never restores an admin role.** Someone who left and rejoins by code comes back as
  `GROUP_MEMBER`, on the same reactivated membership row.
- **An unknown invite code and a deleted group's code both return `404`**, deliberately, so a
  redeemer can't probe for codes that once existed. Don't write copy that distinguishes them.
- **The invite code is admin-only.** `inviteCode` comes back `null` for a plain member. Gate invite
  UI on `myRole === 'GROUP_ADMIN'`, not on the field being present.
- **Rotation is the only revocation.** No per-invite tokens; rotating kills every outstanding invite
  at once.
- **Last-admin protection.** Demoting or removing the last active `GROUP_ADMIN` is a `409`. Disable
  the control when they're the only admin, _and_ still handle the `409` — another admin may have
  left meanwhile.
- **Joining is self-service.** Holding a valid code _is_ the authorization; any authenticated user
  can redeem one. A second join attempt is `409`.
- **A user with no group has nothing to do.** No tasks, no categories, no tags — the group is the
  authorization boundary. "Create a group or join one" is a first-class screen, not a fallback.

---

## Known API gaps

Found by reading the spec against the MVP list. Each needs a backend change or a documented
workaround **before** the feature depending on it gets built.

1. **A group member's name can't be resolved.** `GroupMemberResponse` carries `userId` (numeric), but
   users are fetched by `uid` and `GET /api/users` is platform-ADMIN only. So a normal user can't turn
   a group member into a display name or avatar — which blocks assignee pickers, "completed by", and
   the member list. Needs the backend to embed user display fields in `GroupMemberResponse`, or a
   group-scoped members-with-users endpoint. No clean client-side workaround.
2. **Tags can't be attached to tasks.** The task request has no `tagIds`, the response has no tags,
   and the `TaskTag` junction has no controller. Tags are creatable and listable but not assignable,
   so filter-by-tag isn't buildable.
3. **No file upload.** `photoUrl`, `taskPhotoUrl` and `completionPhotoUrl` are plain URL strings;
   image storage is unbuilt on the backend. Photo proof can't ship until there's an upload path.
4. **Notifications are read-only.** There's `GET` and `PATCH /{id}/read`, but no create endpoint — so
   "ping a member about a task", an MVP feature, has no API.
5. **No server-side task filtering.** Client-side only for now.
6. **No "leave group" distinct from removal.** `DELETE /api/group-members/{id}` exists, but whether a
   plain member may call it on their own membership is a `@PreAuthorize` question the spec can't
   answer — verify against a running backend before building the control.

---

## Gotchas

1. **API timestamps have no `Z`.** They're UTC, but `new Date("2026-09-28T10:00:00")` parses as
   _local_. Every date bug in this app will be this bug.
2. **Three id namespaces in one payload** — `uid` (string, external), numeric `id` (per entity), and
   GroupMember ids masquerading as person references.
3. **Local dev issues year-long access tokens**, so refresh, rotation and the `401` path are
   effectively untested locally. Test them against staging.
4. **Refresh tokens are single-use.** Concurrent refreshes kill the session.
5. **`403` is invisible until it happens.** The spec models _that_ a token is needed, never _which
   role_. Each new screen needs its permissions checked against a running backend.
6. **POST returns 201 while the spec says 200.**
7. **The auth endpoints deliberately refuse to tell you anything.** Unverified, unknown, deactivated
   and wrong-password are all `401` with one message; resend-verification is always `200`. Copy must
   not imply knowledge the API withheld.
8. **`docs/openapi.json` is regenerated on every backend dev start.** A noisy diff there is normal; a
   _shape_ change in it is an API change we need to follow.
9. **`priority`, `status` and `recurrenceType` are plain strings with no enum in the schema** —
   CHECK-constrained in SQL only. `recurrencePattern` is free-form JSON. Define the unions ourselves
   and validate at the boundary; a typo is a `400` at runtime, not a compile error.
10. **Notifications reference `userId`, not group membership**, and carry denormalized `taskId` and
    `groupId`. One can arrive for a group the user isn't a member of.
11. **The spec's status-code list is incomplete.** Every one of the 56 operations documents
    200/401/429/500 (most also 400/403) and _nothing else_ — `404` and `409` appear nowhere in
    `openapi.json`, though both demonstrably occur (duplicate name → `409`, unknown invite code →
    `404`). Never treat the documented set as exhaustive.
12. **No response headers are documented at all**, including the `Retry-After` the rate limiter
    actually sends on `429`. Read it defensively and tolerate its absence.
13. **No envelope field is marked `required`** in `openapi.json` — not even `success`. The declared
    `ErrorResponse` schema is the same envelope with `success: false`, and is referenced by zero
    responses. Narrow at the boundary rather than trusting the shape.

---

## Roadmap

The order the app gets built in, and why that order. Each phase is shippable and unblocks the next.

**Phases past the current one are direction, not design.** They say _what_ and _why_, never _how_ —
the how gets decided when we reach them, and lands in this document then. A phase whose _Known API
gap_ is still open doesn't get started; the gap gets raised with the backend instead.

| #     | Phase                      | What it is                                                                                                                                                         | Why here                                                                                                                                                                                                    |
| ----- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0** | **Initialize** ✅ done | `create-next-app` with the flags chosen deliberately, folder layout, lint/format, `.env.example`, first commit. Outcome: the app runs on `:3000` and does nothing. | Every choice made here (App Router, `src/`, import alias, Turbopack) is expensive to reverse later.                                                                                                         |
| 1     | **API layer and session** ← _current_ | Envelope unwrapping, a typed API error, the UTC time module, the encrypted cookie session, single-flight refresh, the middleware that draws the auth boundary.     | Everything sits on this, and it's the part where a mistake looks like a backend bug. It's also where unit testing arrives — this is the code most worth testing.                                            |
| 2     | **Auth screens**           | Register → verify → login, Google sign-in, logout.                                                                                                                 | The first flow that exercises phase 1 end to end against a real backend. Needs the staging URL, because refresh can't be tested locally. End-to-end testing and CI start making sense once this exists.     |
| 3     | **Group onboarding**       | `/groups`, create a group, join by invite code, the no-group empty state, the active-group switcher in the shell.                                                  | A user with no group has nothing to do — no tasks, no categories, no tags. Nothing after this works without it. It's also where "which group am I looking at" gets decided.                                 |
| 4     | **Tasks — the core loop**  | List with client-side filters, detail, create, edit, complete.                                                                                                     | This is the product. The app is genuinely useful at the end of this phase and not before. Likely where React Query earns its place — filters re-querying and optimistic completion are exactly its problem. |
| 5     | **Members and roles**      | Member list, invite, role change, remove, last-admin handling.                                                                                                     | _Blocked on API gap 1_ — a member's display name can't be resolved yet.                                                                                                                                     |
| 6     | **Categories and tags**    | Management screens for both.                                                                                                                                       | Task-tagging within it is _blocked on API gap 2_.                                                                                                                                                           |
| 7     | **Calendar view**          | Tasks over `nextDueDate`.                                                                                                                                          | A second view on data phase 4 already fetches — cheap once tasks exist, pointless before.                                                                                                                   |
| 8     | **Notifications**          | Inbox, unread badge, mark read.                                                                                                                                    | Pinging a member is _blocked on API gap 4_.                                                                                                                                                                 |
| 9     | **PWA**                    | Manifest, icons, service worker, install prompt, offline shell.                                                                                                    | Deliberately late: it's a capability layered onto a working app, and an offline shell for screens that don't exist yet is wasted work.                                                                      |
| 10    | **Push notifications**     | Device registration, permission flow, device management screen.                                                                                                    | Needs the PWA service worker from phase 9.                                                                                                                                                                  |
| 11    | **Photos**                 | Task photos and completion photo proof.                                                                                                                            | _Blocked on API gap 3_ — there's no upload endpoint on the backend.                                                                                                                                         |

**Cross-cutting work**, slotted where it earns its place rather than done up front:

- **Testing** — Vitest + Testing Library + MSW arrive in phase 1, on the API and session layer, which
  is pure logic with high consequence and exactly what unit tests are good at. End-to-end testing is
  a later, separate decision. See _Testing_ under the decisions above.
- **CI** — after phase 2, when there's something worth gating.
- **Hosting and deployment** — deferred. Nothing before phase 9 needs a deployed origin, except that
  Google sign-in on a real domain does, so it may pull forward.

---

## Open questions

Unanswered on purpose. Each gets decided when the work reaches it.

- **Hosting.** Cloudflare is the likely target, but it's far off and Next.js on Cloudflare Workers
  has real constraints worth checking before committing. Nothing should assume a host yet.
- **Staging API URL** — not recorded anywhere in either repo. Needed for `.env.example`.
- **UI primitives** — hand-rolled, or a headless library (Radix / shadcn-style)? Trade-off is
  learning focus management ourselves versus getting accessible dialogs and menus for free.
- **Cache Components** — Next 16 ships a newer rendering model (`cacheComponents: true`) under which
  reading `cookies()` no longer forces the whole route dynamic, so even logged-in pages prerender a
  static shell and stream the per-user parts. It also adds `use cache: private`, which caches
  cookie-dependent reads per session in the browser rather than in any shared cache. Better for us,
  and stricter: it requires explicit `<Suspense>` boundaries and more concepts at once. Decide at
  scaffold time.
- **Error tracking** — nothing exists, so a production bug is currently invisible. Worth doing early
  for one specific reason: the backend mints a `requestId` and echoes it as `X-Request-Id`, so if the
  BFF forwards it into error reports, a frontend error links straight to the backend log line. Nearly
  free now, hard to bolt on later.
- **Session cookie implementation** — a library (`iron-session`) or a hand-rolled encrypted cookie.
- **Active group** — a user is in multiple groups and nearly every list endpoint needs `?groupId=`,
  so "which group am I looking at" is app-level state. Where it lives (session cookie, URL, or both)
  isn't decided.
- **Forms and validation** — whether we reach for React Hook Form + Zod or start plainer.
- **End-to-end testing** — whether to do it, with what, and where it runs. Two things fall outside
  what Vitest can reach and would need it: async Server Components and the httpOnly cookie session.
  Not urgent until there's a flow spanning several pages.
- **Offline behaviour** — read caching is straightforward; queuing mutations offline is a genuine
  distributed-systems problem (ordering, conflicts, auth expiry while queued) and shouldn't be
  waved at.

---

## Log

Newest first. What we decided and when, so the reasoning is recoverable later.

- **2026-10-07** — Phase 1 step 2 done: the API client. `src/lib/api/client.ts` unwraps the envelope
  behind a single `request<T>()`; `errors.ts` adds `ApiError` (status, the backend's human message,
  `retryAfterSeconds`) and `ApiResponseFormatError`. Reasoning for the four shaping choices is under
  _API client_ above. MSW arrived with it, wired globally in `vitest.setup.ts` with unhandled
  requests failing the test. Reading `openapi.json` directly turned up three things the summary
  docs didn't say, now recorded as gotchas 11–13: the documented status set omits `404`/`409`
  although both occur, no response headers are documented including `Retry-After`, and no envelope
  field is marked `required`. Refresh and session deliberately stay out of the client — they wrap it
  in step 4.
- **2026-10-07** — Phase 1 step 1 done: the test harness and env validation. Vitest + Testing
  Library + jsdom, with `node` as the default environment and jsdom opted into per file, and no
  globals (enabling them would force `tsconfig`'s `types` to enumerate every `@types` package).
  `src/lib/env.ts` validates `API_BASE_URL`, `SESSION_SECRET` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID`,
  hand-rolled rather than with Zod, treating whitespace-only as missing and naming every missing
  variable in one error — this closes the _Env validation at boot_ open question. `@types/node`
  bumped `^20` → `^26`, since Vitest requires `>=22` and it should track the Node major anyway.
  Added `.gitattributes` pinning LF, after a fresh Windows clone checked the tree out as CRLF and
  failed `format:check` across the whole repo. MSW is **not** installed yet — it arrives with the
  API client, the first code with a network boundary worth mocking. The harness deliberately came
  before the code it guards, so everything later in phase 1 gets tests written alongside it.
- **2026-10-03** — Phase 0 done. Next.js 16.3.8 scaffolded (App Router, Turbopack, TS strict,
  Tailwind 4, ESLint) with `--empty` so no demo page. Added Prettier, the Node 26 pin, `.env.example`
  and the design-token layer. React Compiler and Cache Components both left off — each can be enabled
  later without rewriting code, so neither is worth the concept load today. Kept the generated
  `AGENTS.md`: reading `writeAgentFiles` showed that deleting it makes `next dev` inject its block
  into our CLAUDE.md instead. Denied `unrs-resolver`'s postinstall; ESLint runs clean without it.
- **2026-10-03** — Data fetching settled: Server Components for first load, React Query after, because
  the BFF makes client-side fetches cost two hops. No global state library. Design tokens and the
  dark-mode mechanism to be set before components get built.
- **2026-10-03** — Unit testing settled: Vitest + Testing Library + MSW, arriving in phase 1. Vitest
  over Jest for the lighter ESM/TS setup and Jest-compatible API. End-to-end testing deliberately
  left open — Next.js documents that async Server Components can't be unit tested, so something will
  be needed for the pages, but the choice waits until there's a flow worth covering.
- **2026-10-03** — Node 26.7.0 installed from the official signed MSI via winget; no version manager,
  after weighing the supply-chain surface. Removed a globally installed npm 10.9.1 that was shadowing
  Node's bundled npm 11.19.0.
- **2026-09-28** — Node 26 chosen over the current Active LTS (24), since 26 goes LTS on 2026-10-28
  and we'd otherwise migrate a month into the project.
- **2026-09-28** — Repo documented. Read the backend's bible and OpenAPI spec end to end; recorded
  the API consumption rules, the session architecture the backend forced, and six API gaps that
  block MVP features. Decided against generating API types. Laid out the phase roadmap. Nothing
  scaffolded yet — phase 0.
