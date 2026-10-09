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
| **Session cookie encrypted with `jose`** | See _Session cookie implementation_. Encrypted (JWE), not signed — a signed payload is readable, and ours holds the refresh token. |
| **Refresh happens in Proxy** | See _Refresh lives in Proxy_. A Server Component render cannot write cookies, so refreshing anywhere else loses the rotated token and kills the session. |
| **Client-side role checks are UX, never authorization** | See _Roles and access_. Spring stays the authority; the UI gates optimistically and still handles the 403. |
| **Env validated by hand, not with Zod** | Fifteen lines in `src/lib/config/env.ts` for three variables, reporting every missing one at once. Keeps Zod a genuinely open decision for forms later instead of smuggling it in as a dependency here, and an explicit loop is clearer than a schema while learning. Revisit if the set grows, or needs coercion, defaults or per-variable rules. |
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

### Time

`src/lib/time/api-date.ts` is the only crossing point between API timestamps and `Date`.

**Reading** is the known problem: unmarked UTC strings parse as local, so `parseApiDate` appends `Z`
unless a zone marker is already there.

**Writing takes no `Z`**, which was verified rather than assumed. The backend's DTOs are
`LocalDateTime` (`TaskRequest.nextDueDate` — the only writable date-time field in the whole API) and
there is no Jackson configuration anywhere, so Spring parses with `ISO_LOCAL_DATE_TIME`, which
accepts no zone marker. Sending a trailing `Z` would be a parse failure, not a harmless extra. So
`toApiDate` emits UTC wall time at second precision with nothing appended.

**Sub-second precision is dropped on write** and tolerated on read: Postgres returns microseconds,
which `Date` truncates to milliseconds anyway, and nothing we send needs better than seconds.

**Tests run in a pinned non-UTC zone** (`Europe/Ljubljana`, which also observes DST). On a UTC
machine a naive parse is accidentally correct, so without the pin the suite would pass against the
exact bug it exists to catch. The pin was confirmed to take effect by temporarily flipping it to
`America/New_York` and watching the local-to-UTC case fail as predicted.

### Testing

**Vitest + Testing Library for units, MSW at the network boundary.** It arrived in phase 1, not phase
0 — an empty harness rots, and phase 0's job was a running app. **The end-to-end tool is a separate
decision, still open.**

**Unit tests cannot reach the pages, and that is structural.** The Next docs state that async Server
Components can't be unit tested and recommend e2e for them; the reason given is that they are new to
*React*, so this is not a Vitest-vs-Jest gap — Jest is in the same position. Our convention is Server
Components by default and they will be async because they fetch, so units cover the logic layer and
client components only. The httpOnly cookie session is the other thing jsdom cannot reach, which puts
login → cookie → protected route on the same side of the line.

**Vitest over Jest** for setup cost: five dev dependencies and a short config against Jest's
`next/jest` transform wrapper and ESM wrangling. Vitest is ESM/TypeScript-native through Vite, so
there is no Babel/SWC layer to debug when an import fails for no visible reason. Its API is
Jest-compatible, so nothing learned is wasted. Jest's one advantage — the React Native default —
matters only if a native sibling ever happens, in its own repo.

**MSW returns the envelope**, including the `401`/`403`/`409`/`429` shapes, so the client is exercised
against realistic payloads rather than stubbed functions. That is the point of mocking at the network
boundary rather than mocking our own modules.

**A hole to be honest about**: refresh and rotation cannot be exercised end to end locally, because
the local backend issues year-long access tokens. It is unit-tested with a controlled clock and mocked
responses; a staging-targeted e2e run is the only real check.

### The design system

**[DESIGN.md](DESIGN.md) is the design authority; `src/app/globals.css` is its implementation.** The
file is Stitch output — a Material 3 theme plus a written description of the brand, components and
layout. A change starts there, not in the CSS.

**The token names are Tailwind's, not DESIGN.md's.** Stitch emits Material roles (`on-surface`,
`surface-container-low`, `primary-container`); the codebase uses the conventional `x` /
`x-foreground` pairs instead, so a component reads like ordinary Tailwind. The cost is real and
worth stating: every screen pasted from Stitch has to be translated by hand. That is why each value
in `globals.css` carries a comment naming its Material origin — the mapping has to be walkable
backwards or the translation becomes guesswork.

**DESIGN.md contradicts itself, and the written description wins.** Its YAML block and its prose
give different hex codes for the same roles: `primary` is `#1c415a` in the block and `#355872` in
the prose, and `secondary` and `tertiary` disagree the same way. The prose is self-consistent —
every elevation shadow is `rgb(53 88 114 / x)`, which is exactly `#355872` — so `#355872` is the
brand colour. `secondary` and `accent` take the block's lighter *container* values, which land close
to what the prose asks for. Whether they should be the prose's exact tones is still open; it is a
"does this look right" question, settled by looking at a screen rather than by reasoning.

**Dark mode is derived, not designed.** DESIGN.md is a light-only scheme. The derivation reuses what
the Material block already implied rather than inventing — `primary` becomes its `inverse-primary`,
`foreground` its `inverse-on-surface`, and the light `primary` demotes to `accent`. The canvas ramp
and the sage/coral tones are genuinely new and marked as such, to be replaced when Stitch emits a
dark scheme. One deliberate departure: **dark shadows are re-tinted near-black**, because a
slate-tinted ambient glow is invisible on a dark canvas and the light values would silently flatten
every card.

### The password policy

**The frontend is the spec here, not the mirror.** `validation/password.ts` holds it and the backend
is being changed to match, so that file is the thing to read and any disagreement is a backend bug.

**8–64 characters**, one each of uppercase, lowercase, digit and non-alphanumeric, and **a password
rated weak is rejected** — the form's minimum is "good". Three decisions worth the reasoning:

- **Special characters are "anything that is not a letter or a digit"**, not a list. The original
  policy listed about twenty symbols and omitted `+ % & ( ) < > "` and backslash, so a
  password-manager string could be refused while the person stared at the symbol they had typed. A
  list is how gaps appear. (It also showed a curly `’`, which no keyboard types.)
- **The maximum is 64, not 20.** A 20-character cap forbids `Correct-Horse-Battery-Staple-2026`
  while permitting `Password1!`. BCrypt takes 72 bytes, so nothing technical required the lower cap.
- **Character rules alone are not enough.** `Password1!` satisfies every one and sits near the top of
  every breach list, so `isGuessable` also rejects a common-password list, leet substitutions and a
  stripped trailing tail (`Password123!` → `password`). **That list is 24 entries** — enough for the
  obvious cases and nothing more; see _Open questions_.

**Strength is advisory and reads as progress**: under four rules met is weak, four is good, all five
is good below twelve characters and strong at or above. Nothing short of the full policy can read
strong, because a meter praising a password the form rejects contradicts itself.

**Enforced at register, never at login.** A rule at sign-in locks people out of their own accounts
with no way to fix it, and publishes the policy to anyone probing.

### Page metadata and SEO

**`metadata` sits directly after the imports.** Next reads it wherever it is; the placement is so
that a file found by its route rather than its filename announces which page it is.

**Titles never contain the brand.** The root layout owns `template: "%s - TasKlean"` and a `default`
of `TasKlean`, so changing the separator or the brand is a one-line edit. The homepage is the
deliberate exception, setting none — the template would make it `Home - TasKlean`.

**Real SEO applies to one page today: `/about`.** The root route is *not* in that set — `/` becomes
the task feed and sits behind the auth boundary, where Proxy redirects before a crawler sees HTML. A
marketing landing page would need its own route or a split on auth state; it is not something `/`
grows into.

**Public and indexable are different things.** `/login`, `/register` and `/verify-email` are in
`PUBLIC_PATHS` because they must be reachable, but have no business in search results — the
`(auth)` layout sets `robots: { index: false }` for all of them.

So protected routes get a title and description for the tab and nothing more. When `/about` and any
marketing routes get built, "SEO proper" means `metadataBase` and a canonical URL, Open Graph and
Twitter cards, and a `sitemap.ts` listing only the indexable set.

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

The Next.js **server** is the only thing that can ever _read_ a JWT. It is not the only thing that
holds one: **there is no server-side session store.** The tokens are sealed into the cookie, which
lives in the browser's cookie jar and rides along on every request; the server decrypts it, uses the
access token and discards it. Nothing persists between requests. Three consequences follow, and they
are easy to miss if you picture the tokens sitting on the server:

- **No per-session revocation.** Killing one session means rotating `SESSION_SECRET`, which kills
  every session at once. A server-side store (an opaque id in the cookie, tokens in Redis or a
  table) is the design that buys targeted revocation; we skipped it because it is infrastructure we
  do not have. Revisit it when "sign out my other devices" becomes a requirement.
- **Everything must fit a cookie.** Two tokens plus our own fields, inside the ~4KB limit.
- **The tokens do transit the browser**, on every request. Encrypted and unreadable, but present —
  not "never leaves the server".

With that correction in place, the pieces are:

- The browser gets an **httpOnly, SameSite=Lax** cookie (`Secure` in production; off locally so
  `http://localhost` works) holding an _encrypted_ session: access token, refresh token, user
  identity, active group.
- **`httpOnly` stops exfiltration, not abuse.** Browser JavaScript cannot read the token, so an XSS
  cannot steal it — but the browser attaches the cookie automatically, so an XSS can still call our
  Route Handlers as the user. It protects the credential, not the session.
- Browser→server calls go to our own Route Handlers or Server Actions. Client code has no knowledge
  of the Spring origin and couldn't reach it if it tried.
- **CSRF: designed, not built.** The intent is a double-submit token on every mutation, checked
  server-side, because `SameSite=Lax` alone isn't the whole defence. **None of it exists yet** —
  there is no code and nothing to grep for. Nothing is exposed today because there are no mutation
  endpoints at all, but this has to land with the first Route Handler or Server Action we write, not
  after.
- The cookie is persistent and tracks the refresh-token TTL (14 days). It is **rolling only where
  refresh actually fires**: each refresh rewrites the cookie and restarts the 14 days. Locally that
  never happens, because the dev profile issues 1-year access tokens, so the cookie is a flat
  14-day expiry there. `sealSession` also sets its own `exp` inside the encrypted payload, so expiry
  does not depend on the browser honouring `maxAge`.

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

### Session cookie implementation

**`jose` with `EncryptJWT` (JWE, `dir` + `A256GCM`)** — not `iron-session`, not hand-rolled.

Next provides the cookie layer (`cookies()`), so no library is needed for *that*. What Next does not
provide is encrypting the value, and its auth guide says so outright, recommending iron-session or
jose. Of the three ways:

- **`jose`** has **zero transitive dependencies**, so the dependency cost is about as low as a
  library gets; it genuinely encrypts; it enforces `exp`, which is the piece most easily botched by
  hand; and it leaves the cookie to Next, so every step stays visible.
- **`iron-session`** needs the least code but owns the cookie too, hiding the mechanics.
- **`node:crypto` AES-256-GCM** was the zero-dependency option and is defensible — it is a vetted
  primitive, not rolling our own crypto. Rejected only because we would then own IV generation, key
  derivation *and* expiry enforcement.

**It encrypts rather than signs, and that distinction is the point.** Next own auth example names its
helpers `encrypt`/`decrypt` but uses `SignJWT` — signing, whose payload is plain base64url and
readable by anyone holding the cookie. That is fine for its `{ userId }` payload; it would publish
our refresh token. A test asserts the sealed cookie contains neither token in any decodable form.

The key is derived with **WebCrypto** SHA-256 rather than `node:crypto`, so the module also works in
the Edge runtime where Proxy runs. A length guard rejects a short secret, which SHA-256 would
otherwise silently expand to 32 bytes.

Rotating `SESSION_SECRET` invalidates every session at once. That is the emergency revoke-all lever,
and the reason it must differ per environment.

### Refresh lives in Proxy, not in the API client

**Cookies cannot be written during a Server Component render.** Next is explicit that `.set` and
`.delete` require a Server Function or Route Handler. Combined with the backend refresh tokens being
single-use with rotation, the obvious design — refresh on a 401 inside the API client — is actively
destructive: the backend revokes the token presented, the replacement cannot be persisted, and the
session dies on the next request.

So refresh happens in `src/proxy.ts` before anything renders, and `serverApi()` deliberately does
**not** refresh. A 401 that reaches it means the session is genuinely over.

Next also advises keeping Proxy cheap and free of network calls, since it runs on every route
including prefetches. **We deviate knowingly**: the refresh fires only when the access token is
inside the skew window — roughly once per 15 minutes per session, not once per request. The
alternative caps every session at the access-token lifetime.

Single-flight de-duplication is **per-process and best-effort**. Two instances can still refresh
concurrently; solving that properly needs a shared lock, which is not worth it at this scale.

### Roles and access

Two role namespaces that behave completely differently:

| | Platform role | Group role |
| --- | --- | --- |
| Values | `USER`, `ADMIN`, `SUPER_ADMIN` | `GROUP_ADMIN`, `GROUP_MEMBER` |
| Where it lives | **in the access token** (`role` claim) | **not in the token** — per membership |
| Source | the JWT we already hold | `MyGroupResponse.myRole`, `GroupMemberResponse.role` |
| Scope | global | **per group** — admin of one, member of another |
| Spring enforces via | `ROLE_<role>` authority | service code, not annotations |

That last row is why the spec cannot express authorization and why a 403 is always a runtime
discovery.

**Platform role barely matters to this product.** Every real user is `USER`; listing all users is
ADMIN-only and changing a role is SUPER_ADMIN-only, neither of which belongs in the product UI.
**Group role is what gates anything.**

**Client-side role checks are UX, never authorization.** They decide what to render and enable, and
that is all they can be: anything in the browser is editable, duplicating Spring rules creates two
sources of truth that drift, and a cached role goes stale — a role change or deactivation only takes
effect at refresh, up to 15 minutes later. So the rule is **both, with different jobs**: gate the UI
optimistically so people are not shown controls that will fail, *and* still handle the 403 when the
optimistic guess is wrong. Exactly the pattern the last-admin case already needs — disable the
control *and* handle the 409.

The access token also carries `userId` and `uid` claims, so the numeric id is available without
storing it in the session or calling `/me` for it. Claims are decoded, never verified: only Spring
can verify its own signature, and we do not need to, because none of this is a security boundary.

**Not built yet.** When it arrives it should be capability predicates (`canManageMembers(role)`),
not `role === "GROUP_ADMIN"` scattered around, so the mapping sits in one place when the backend
rules shift. Group role needs a fetch, so it belongs with phase 3, where an active group first
exists.

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
   _local_. Every date bug in this app will be this bug. The write direction is the mirror: the
   DTOs are `LocalDateTime` with no Jackson config, so `ISO_LOCAL_DATE_TIME` applies and a trailing
   `Z` is a **parse failure**, not a tolerated extra. Both directions go through `src/lib/time/api-date.ts`.
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
12. **Next 16 renamed Middleware to Proxy.** The file is `src/proxy.ts`, not `middleware.ts`. A
    `middleware.ts` written from memory simply never runs — no error, no warning.
13. **Cookies cannot be set during a Server Component render.** `.set`/`.delete` need a Proxy,
    Route Handler or Server Action. This is what forces refresh into Proxy.
14. **No response headers are documented at all**, including the `Retry-After` the rate limiter
    actually sends on `429`. Read it defensively and tolerate its absence.
15. **No envelope field is marked `required`** in `openapi.json` — not even `success`. The declared
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
| **1** | **API layer and session** ✅ done | Envelope unwrapping, a typed API error, the UTC time module, the encrypted cookie session, single-flight refresh, the middleware that draws the auth boundary.     | Everything sits on this, and it's the part where a mistake looks like a backend bug. It's also where unit testing arrives — this is the code most worth testing.                                            |
| 2     | **Auth screens** ← _current_ | Register → verify → login, Google sign-in, logout.                                                                                                                 | The first flow that exercises phase 1 end to end against a real backend. Needs the staging URL, because refresh can't be tested locally. End-to-end testing and CI start making sense once this exists.     |
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

- **Staging API URL** — recorded nowhere in either repo. Blocks `.env.example`, `metadataBase` and
  any real refresh test.
- **Hosting** — Cloudflare is likely, but Next on Workers has real constraints. Nothing should assume
  a host yet.
- **A real breached-password check** — `isGuessable` carries 24 common passwords, which stops the
  obvious ones and nothing else. Pwned Passwords' range API is the normal answer (k-anonymity, so no
  password or full hash leaves our server) at the cost of a call inside register; a bundled top-10k
  list avoids the call and the dependency on someone else's uptime. Worth settling before launch.
- **Absolute session cap** — the session is rolling, so every refresh restarts the 14 days and an
  active session never ends. A cap needs a limit *and* a decision on where the clock lives: one the
  cookie reports is one the cookie can lie about, so it must be sealed at first login and carried
  through every rotation.
- **Active group** — a user is in several groups and nearly every list endpoint needs `?groupId=`, so
  this is app-level state. Session cookie, URL, or both — undecided.
- **Error tracking** — nothing exists, so a production bug is invisible. Worth doing early for one
  reason: the backend mints a `requestId` and echoes it as `X-Request-Id`, so forwarding it into
  error reports links a frontend error to the backend log line. Nearly free now, hard to retrofit.
- **End-to-end testing** — whether, with what, and where it runs. Async Server Components and the
  httpOnly session both fall outside Vitest's reach. Not urgent until a flow spans several pages.
- **Cache Components** — Next 16's newer rendering model (`cacheComponents: true`), under which
  reading `cookies()` no longer forces a route dynamic, so logged-in pages prerender a static shell
  and stream the per-user parts; `use cache: private` caches cookie-dependent reads per session.
  Better for us and stricter — explicit `<Suspense>` boundaries and more concepts. Left off at
  scaffold; revisit when the first real data screen makes the cost visible.
- **TypeScript 7** — **blocked, not deferred**: typescript-eslint throws on `versionMajor >= 7`, so
  lint dies. Its tracking issue (typescript-eslint#10940) targets TS >=7.1. Revisit with the
  `~6.0.3` pin.
- **UI primitives** — hand-rolled or headless (Radix / shadcn-style)? Learning focus management
  ourselves against accessible dialogs and menus for free.
- **Forms and validation** — React Hook Form + Zod, or stay plain. Currently plain, and the shared
  `validation/` modules have not yet hurt.
- **Canonical URL for `metadataBase`** — needs an absolute origin we do not have. Until then pages
  carry titles and descriptions but no link-preview metadata, since a relative OG image resolves
  against nothing and Next warns at build.
- **Offline behaviour** — read caching is straightforward; queuing mutations is a real
  distributed-systems problem (ordering, conflicts, auth expiry while queued) and shouldn't be waved
  at.

---

## Log

Newest first, one entry per change. The reasoning lives in the sections above — this is the dated
index of what moved and the surprises worth not rediscovering.

- **2026-10-09** — Compacted these two documents. CLAUDE.md became a reference (what exists, where,
  the rules) and this file took the reasoning, mirroring the backend's split. CLAUDE.md 437 → ~250
  lines; the Log alone had grown to 187 and was mostly restating the sections above it. Two stale
  claims surfaced while doing it: the auth screens' `robots` was written as future work when the
  `(auth)` layout already sets it, and Cache Components still said "decide at scaffold time".
- **2026-10-09** — `/register`, the shared form machinery and the password policy — see _The
  password policy_. Two things tests caught that thinking had not: a first scorer rated **`P@ssw0rd`
  "good"**, the exact failure it was written to avoid, and letting length alone reach "strong"
  produced a meter praising a password the form rejected. Also fixed: Testing Library registers
  `cleanup()` only when Vitest globals are on, so renders were stacking — one test saw a password
  field holding four copies of its input.
- **2026-10-09** — `/login` from the Stitch screens. `lucide-react` over the Material Symbols
  webfont; filled borderless inputs, overriding DESIGN.md's prose; the brand panel reduced to brand
  only, since a signed-out visitor cannot be shown real household data. **Three designed features
  have no backend**: password reset (no endpoint), "remember this device for 30 days" (the session
  is a fixed 14 days) and "log out" on the verify screen (there is no session until verification).
  The first is inert by request; the others are gone. **Stitch ships its own radius scale** — its
  `rounded-xl` is 0.75rem against our 1.5rem, so a copied class doubles every corner; it maps to our
  `rounded-md`. Added `safe-next.ts` because `?next=` is attacker-controlled.
- **2026-10-09** — Reorganised the tree: `src/lib` defined as non-UI logic with nothing directly in
  it, components split into `common/` and per-feature. Found while auditing: **`config/env.ts` and
  `api/client.ts` had no `server-only` guard**. Consolidated two copies of `AuthResponse` — the
  duplicate declared `uid: string`, which typecheck exposed as a lie the callers already worked
  around.
- **2026-10-09** — DESIGN.md adopted as the design authority, implemented as tokens — see _The
  design system_. Inter → Plus Jakarta Sans. `/` became a design preview and is temporarily public.
  Fixed a real hole found while adding it: `isPublic` matched prefixes, so `"/"` produced the prefix
  `"//"` and a request arriving as `//dashboard` would have been treated as public and skipped the
  auth check while Next still routed it to the protected page.
- **2026-10-08** — Corrected this document, which overstated three things: that the Next server "is
  the only thing that ever holds a JWT" (there is no server-side store at all), that a **CSRF token
  was part of the architecture** when none is implemented, and that the session is "rolling"
  unqualified. Added the absolute session cap as an open question.
- **2026-10-08** — File order fixed (imports, types, config, variables, content) and **types move out
  at two**. Wider gaps between sections were **rejected, not forgotten**: Prettier collapses
  consecutive blank lines with no option to disable it, verified by probe. Every function now takes
  TSDoc, exported or not — the old "obvious enough to skip" exemption had left eight uncommented.
- **2026-10-08** — Page metadata convention — see _Page metadata and SEO_. Separator `·` → `-`.
  Dropped `'use client'` from the about page: the directive **silently makes a `metadata` export
  dead**, which is the trap the convention records.
- **2026-10-08** — Dependencies current: Next 16.4.0, React 19.3, ESLint 10, jsdom 30, MSW 3.
  **MSW 3 renamed `onUnhandledRequest` to `onUnhandledFrame` and defaults to warning**, silently
  downgrading our "fail the test" guard to a pass-through; typecheck caught it. ESLint 10's invalid
  peer ranges were verified harmless by probe. TypeScript 5.9.3 → **6.0.3, not 7**: typescript-eslint
  throws on `versionMajor >= 7`. Pinned `~6.0.3`, since `^` would admit 6.1.0 and break lint.
- **2026-10-08** — Commenting standard adopted and applied. Moved this machine to **Node 26.8.1**: it
  had been on 22.19 against `engines.node: >=26`, with a global npm shadowing the bundled copy — the
  exact trap CLAUDE.md documents, caught by its own test. Denied `msw`'s postinstall.
- **2026-10-07** — Session, refresh and the auth boundary — see _Session cookie implementation_ and
  _Refresh lives in Proxy_. **Next 16 renamed Middleware to Proxy**; a `middleware.ts` written from
  memory would simply never run (gotcha 12). Dropped `userId` from the session: the access token
  already carries it. Role access designed but not built. Added the `/pre-commit` skill.
- **2026-10-07** — The UTC time module — see _Time_. The write format came from reading the backend,
  not guessing: `LocalDateTime` DTOs with no Jackson config mean `ISO_LOCAL_DATE_TIME`, so **no
  `Z`** — and `TaskRequest.nextDueDate` is the only writable date-time field in the API. The
  `Europe/Ljubljana` test pin was verified by flipping it to `America/New_York`. Display formatting
  deliberately deferred to the first screen that renders a date.
- **2026-10-07** — The API client — see _API client_. MSW arrived with it. Reading `openapi.json`
  directly turned up three things the summary docs didn't say, now gotchas 11–13: the documented
  status set omits `404`/`409` although both occur, no response headers are documented including
  `Retry-After`, and no envelope field is marked `required`.
- **2026-10-07** — Test harness and env validation. `node` as the default environment, jsdom per
  file, no globals (enabling them forces `tsconfig`'s `types` to enumerate every `@types` package).
  `config/env.ts` hand-rolled rather than Zod. `@types/node` `^20` → `^26`. Added `.gitattributes`
  pinning LF after a fresh Windows clone failed `format:check` repo-wide. The harness came before the
  code it guards, so everything later got tests alongside it.
- **2026-10-03** — Phase 0: Next 16.3.8 scaffolded with `--empty`, plus Prettier, the Node pin,
  `.env.example` and the token layer. React Compiler and Cache Components left off — both can be
  enabled later without rewriting code. Kept the generated `AGENTS.md`: reading `writeAgentFiles`
  showed that deleting it makes `next dev` inject its block into CLAUDE.md instead.
- **2026-10-03** — Data fetching settled (Server Components first load, React Query after), unit
  testing settled (Vitest + Testing Library + MSW), end-to-end left open. Node 26.7.0 from the signed
  MSI, no version manager; removed a global npm shadowing the bundled one.
- **2026-09-28** — Node 26 chosen over Active LTS 24, which goes LTS 2026-10-28 and would otherwise
  mean migrating a month in. Read the backend's bible and OpenAPI spec end to end: recorded the API
  consumption rules, the session architecture the backend forced, and six API gaps blocking MVP
  features. Decided against generating API types. Laid out the roadmap.
