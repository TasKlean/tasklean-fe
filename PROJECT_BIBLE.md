# TasKlean Frontend Bible

Why this app is built the way it is, and what we know about the API we consume. Operational rules
live in [CLAUDE.md](CLAUDE.md); what changed when lives in git.

A section appears when we decide something and says *why*, so the reasoning survives a reversal.
Undecided things stay under _Open questions_ rather than being guessed at.

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

## Architecture and patterns

Decisions that have no section of their own. Everything below gets one.

| Decision | Reasoning |
| --- | --- |
| **Next.js, App Router** | Server Components keep tokens and API calls off the client; Route Handlers give us the session layer in the same deployment. |
| **TypeScript, strict** | The whole job is consuming someone else's contract. Types are the cheapest correctness available. |
| **TailwindCSS** | Settled with the backend. Utility-first suits a mobile-first component set we write ourselves. |
| **Hand-written types, per feature** | Generating a client from `openapi.json` is instant and teaches nothing; writing an endpoint's types when you build against it means reading the contract. Cost: drift, caught when a feature touches the spec. |
| **No global state library** | React Query holds server data, the URL holds filters and sort, a cookie holds active group and theme. Adding Zustand later is cheap; unwinding a store full of server data is not. |
| **Design tokens before components** | Both tokens and the dark-mode mechanism are miserable to retrofit — every hard-coded value has to be hunted down, and dark mode changes how every colour is declared. |
| **Env validated by hand, not Zod** | Fifteen lines for three variables, reporting every missing one at once — a schema would be no shorter and would report the first. Still true now that Zod validates every form. Revisit if the set needs coercion or defaults. |
| **Node 26** | Becomes Active LTS 2026-10-28 (supported to 2029-04), so the project sits on one line for its whole life instead of migrating a month in. Next declares `node >=20.9.0` with no upper bound. |
| **No Node version manager** | Installed from the signed MSI via winget. With one JS project there is nothing to switch between, so a manager is added attack surface — nvm-windows' `src/web/web.go` verifies **no checksum or signature** on downloaded Node binaries, inverts `InsecureSkipVerify` on its proxy path, and falls back to `http://` for scheme-less mirrors. Revisit only if we need per-project versions. |
| **npm is whatever Node bundles** | Node's `npm` shim prefers a global npm over the bundled one, so a stale `install -g npm` silently pins it while Node moves on — which is what we found here (10.9.1 shadowing 11.19.0). |
| **Containerized on the standalone output** | The only way to exercise the real API was to run beside the backend and the database, so the frontend got a `Dockerfile`. `output: "standalone"` bundles a minimal server plus only the `node_modules` actually used, so the runtime stage copies two directories rather than installing anything. Build and runtime are separate stages because `NEXT_PUBLIC_*` has to exist at build time while the secrets must not. The compose file lives in the parent directory, outside both repos: it describes three services, so it belongs to neither. |
| **LF line endings pinned in the repo** | `.gitattributes`, so the rule travels to every machine. A CRLF checkout fails `format:check` on every file and reads as a formatting problem. |

### Data fetching

**Server Components fetch on first load; React Query owns everything after.** They hand off rather
than compete: the Server Component fetches, seeds React Query, and React Query holds it from then on.

Why the server for first load, given SEO is irrelevant behind a login: **the BFF makes a
browser-initiated fetch cost two hops** (browser → Next → Spring), and that hop cannot be removed
without putting a JWT in the browser. A Server Component pays one hop, server-to-server, before the
page is even sent. For "two taps from a cold start on a phone", client-first fetching buys a
guaranteed spinner. Tokens do *not* decide this — they stay server-side either way. The argument is
latency, not security.

**React Query is not installed yet, deliberately.** It adds nothing to a first render that already
happened on the server; it starts paying when a view is interactive against the server — filters
re-querying, optimistic completion with rollback, invalidation after a mutation, a polled unread
badge. Adding it when we meet that problem means its concepts land on something real rather than
being scaffolding adopted on faith.

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

### Continuous integration and deployment

**Two workflows by environment, matching the backend.** `main` is staging, `production` is
production, and a PR between them is the release gesture. Keeping the same shape in both repos means
one mental model for the pipeline rather than two.

**One `verify` job instead of the backend's compile, test and sonar split.** Maven is slow enough
that passing `target/` between jobs pays for itself; our gates are seconds each, so three extra
runner starts and three `npm ci` runs would cost more wall-clock than running them in sequence.
Sonar stays separate for a different reason: it holds `SONAR_TOKEN`, and a job that installs
dependencies is the wrong place to keep a token, since a malicious postinstall reads the whole
environment.

**Production promotes a digest, it never rebuilds.** The image is environment-agnostic, so
rebuilding on the production branch would ship a binary nobody has run. Staging pushes an immutable
`sha-<short>` tag; production resolves that tag for the released commit, falling back to `HEAD^2`
because merging `main` into `production` creates a new commit whose second parent is the tip that
was actually built, and retags the digest. A missing image fails the job loudly rather than
rebuilding quietly.

**Nothing is baked into the image.** Proven rather than assumed: a build with a sentinel client id
leaves that string nowhere in `.next`, not even in the server output, because the only reader is
`getEnv()` in a Server Component that passes the value down as a prop. Our own "a client component
never reads the environment" rule is what makes the image portable, so breaking that rule would also
break build-once-promote.

**Security choices that differ from the backend's workflows.** `permissions: contents: read` at the
top, with `contents: write` only on the two jobs that tag and release, because a workflow with
write access by default is one compromised action away from rewriting the repo.
`persist-credentials: false` on every checkout that does not push. The Render deploy hook travels
through `env:` rather than being interpolated into the command, and uses `curl -fsS`: the backend's
`curl -s "${{ secrets... }}"` puts a secret URL on the command line and, without `-f`, treats a dead
hook as success and then polls the previous deploy. Runners are pinned to `ubuntu-24.04` so a runner
image change cannot break a release on a day nobody touched the code.

**Actions are pinned to commit SHAs, and Dependabot watches `github-actions` too.** A pinned SHA
with nothing updating it is just a stale dependency, so the two halves only work together.

**No `npm audit` gate.** The five known devDependency findings have no non-destructive fix, so an
audit step would fail every run and teach everyone to ignore red. Dependabot covers the same ground
with a PR we can judge.

**The image repository has to be private.** The standalone bundle is our compiled source, so a
public image publishes the app. Render then needs registry credentials rather than pulling
anonymously.

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

**The spacing scale gained two steps above DESIGN.md's.** Its scale stops at `space-xl` (2.25rem),
which its own prose describes as the gap *between category sections inside a screen*, meaning a task
list and not a landing page. Marketing bands at 36px read as cramped, so `space-2xl` (3.5rem) and
`space-3xl` (5rem) continue the scale's roughly 1.5× ratio. Marked derived in `globals.css` like the
sage and coral tones; nothing inside the app uses them.

### Validation

**Every form is a `zod/mini` schema, the three auth validators included.** The first decision here
was the opposite — Zod for new forms only, because retrofitting a working validator saves few lines.
It was reversed for uniformity: two validation styles in one directory means every new form opens
with a choice that has no right answer, and the second style wins by accident of what was built
first. Both the cost and the consequences were measured rather than argued.

**It costs 8 KB gzipped** — 198,670 bytes against a 190,411 baseline. An isolated probe predicted
15 KB, and full `zod` measured +30 KB, so the figure quoted online is the mini one and even that
over-states what real usage pays. The weight lands on the first *client* import, because
`validation/` is deliberately client-importable. An unimported dependency reaches no bundle at all.

**A field shows only its first unmet rule.** Zod emits one issue per failed check, so `"choresaaa"`
yields three messages where the hand-written validator returned the single sentence "Add an
uppercase letter, a number and a special character." Keeping that sentence needs custom aggregation,
which cancels the saving; showing the first message needs none and asks for one fix at a time. The
order of the checks in `rules.ts` is therefore the order a user is asked to fix things.

**The schema parses `FormData`, so no reading helper survives.** An action hands
`Object.fromEntries(formData)` to its schema, which trims field by field — the password is the one
field never trimmed, because it must reach the backend exactly as typed. `readTrimmed`/`readRaw`
existed to make that distinction by hand and are gone.

**Modules are grouped by the question they answer**, not by symmetry: `rules.ts` holds the field
pieces, `parse.ts` runs a schema and keeps one message per field, `forms/<form>.schema.ts` is one
per screen, `password/` is the policy and its meter. Echoing back a rejected submission is a second,
lenient schema per form with every field optional — never the password.

**What stays custom**: `isGuessable`, the leet and stem checks, and `passwordRequirements` — the
strength meter needs per-rule booleans a schema does not expose.

**Where it pays next**: nested objects, arrays and coercion, and `z.infer` so a field cannot drift
between the type, the validator and the action. Task recurrence is the expected first case —
`recurrencePattern` is free-form JSON and `priority`/`status`/`recurrenceType` are plain strings
with no enum in the spec, which is what `z.enum` is for.

### The password policy

**The policy is pinned by a file neither repo owns alone.** Two implementations of the same rules
drift silently: the backend can tighten a threshold, or either side can reorder its checks, and
nothing fails until a user is told to fix the wrong thing. So the rules are expressed once as
vectors mapping a password to its first failing message, canonical in
`tasklean-be/src/test/resources/password-policy-vectors.json` and mirrored verbatim here at
`src/test/password-policy-vectors.json`. Both suites run it. The mirror is a copy rather than a
shared package because the alternative is publishing and versioning a package for one JSON file,
and the copy is checked by the test that reads it.

**The vectors pin the order, not just the messages.** A password failing several rules has one
right answer, the first unmet rule in `rules.ts`, because that is the order a user is asked to fix
things. Verified by loosening the minimum length and by swapping two checks: each breaks a vector.


**The frontend is the spec here, not the mirror.** `validation/password/policy.ts` holds it and the
backend is being changed to match, so that file is the thing to read and any disagreement is a
backend bug.

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

### The public home page

**Nothing on it is invented.** The Stitch design shipped with "trusted by over 12,000 peaceful
households", a named testimonial and a "100% free" badge. There are no users, no testimonial and no
pricing decision, so all three are gone. A launch page that lies is a liability, and the numbers
would have to be removed later anyway.

**It only claims what the MVP scope covers.** The design's "automatic fair distribution" is the
rotation and fairness work explicitly out of MVP scope, so the feature card became clear ownership
instead. The nine cards are all MVP features: invite code, assignment, recurrence, the nudge, photo
proof, priority and categories and tags, time estimates, multiple groups, list and calendar.

**Two of those nine run ahead of the API, and the page must not ship before they land.** There is no
endpoint that sends a nudge: `/api/notifications` is read-only, so notifications exist as records
but nobody can create one. And tags exist as group-scoped entities with their own CRUD, yet no task
field references them, so a tag cannot currently be put on a task. Both are in the backend's MVP
list, so the copy is a promise with a date rather than an invention, but it is still a promise.

**The copy uses the product's nouns: group and task, not household and chore.** The warmer words
read better on a landing page and worse everywhere after it, because the app says "group" and the
API says `Group`. "Household" and "home" survive only as human description, never as the name of a
thing you create or join.

**The product mock is built from tokens, not a screenshot.** A screenshot of a UI that does not
exist yet is a promise, and it goes stale the day the real screen changes. The mock is
`aria-hidden`, so it is decoration, and a screen reader reading a fake task list would be nonsense.
The photo it floats over is the opposite case: it shows a home rather than the product, so it claims
nothing and carries real `alt` text. No text sits on the photo, so it needs no scrim and no contrast
compromise.

**Images go through `next/image` from `src/assets/`, not `public/`.** A static import gives the
optimizer the intrinsic size, so no hand-written `width`/`height` can drift from the file, and it is
the only way to get a build-time `placeholder="blur"`. The hero is `priority` because it is the
largest paint on every screen; it is 1376×768 and serves at 37 KB on a phone, 55 KB on a laptop.

**The logo ships as two files, not one recoloured by CSS.** The mark is slate `#38576c`, which reads
as near-black on the dark canvas, so dark mode swaps in a variant drawn in `--primary`'s dark value
(`#a7cbe9`), which is the scheme's own answer to what the brand colour becomes. Both
are generated from the 1024px source by trimming its padding and lifting the white background to
alpha; the source was opaque white, which would have shown as a white box in dark mode. The favicon
at `app/icon.png` keeps a light tile instead, since browser chrome can be any colour.

**The header carries no JavaScript.** Section links are hidden on phones rather than folded into a
drawer, because a drawer makes the header a client component for two anchors that scrolling already
reaches. Revisit when the public site has more than two sections.

**`/` is public for real now, and the signed-in app will not live there.** The route was temporarily
public for the token preview, which is deleted. `DESIGN.md` and `globals.css` are the authority,
and a preview page only drifts from them. Once there is an app behind the session, an authenticated
visitor to `/` should be sent to it, and login's default redirect target changes with it. Today it
still lands on the marketing page.

**The greeting comes from the cookie, not from the API.** Every auth response already carries the
user's name, refresh included, so sealing it into the session costs nothing and spares a request on
every page just to render "Hello, Bob". It is display only and may be stale after a profile edit,
which is the right trade for chrome; anything that matters asks the backend. The field is optional
and tolerated as absent, so a session sealed before it existed keeps working rather than being
rejected as malformed.

**Session-aware chrome is what made `/` dynamic.** The marketing page was statically prerendered
until the header had to know whether to say "Log in" or "Go to app". That was a deliberate trade,
asked for and accepted: the page is small and the alternative, showing a signed-in visitor a "Log
in" button, reads as broken. If the static render is ever wanted back, the answer is PPR with the
chrome in a dynamic hole, not a client-side session check.

**The signed-in app lives at `/app`, not at a `/` that changes with the session.** One URL serving
two experiences costs the marketing page its static render, moves protection out of Proxy's
default-deny and into the page, and can be restored from the back/forward cache showing the
previous person's view on a shared device. Two URLs have none of those problems. `/` is deliberately
not redirected either: signed in or not, the marketing page stays readable, and only the auth
screens bounce, because only they have nothing to offer a session.

**Proxy bounces a signed-in visitor off the auth screens only, not off every public path.** The two
lists are separate for a reason: `PUBLIC_PATHS` is "reachable without a session" and `AUTH_PATHS` is
"pointless with one". Folding them together sent a signed-in visitor at `/` to `/`, which the
browser reports as `ERR_TOO_MANY_REDIRECTS`. Found only by logging in against a real backend,
because the test covered `/login` and never `/`.

**The page answers "what is it" before "how do I start".** Hero, then the three steps, then the
feature cards, then the comparison. The steps sit that high because "how do I get my flatmates in"
is the first real question after the promise, and all three map to endpoints that exist: register,
the invite code, task creation with an assignee and a recurrence. Nothing in them is aspirational.

**The hero watches the cursor, by five degrees.** The photo and the task card rotate together as
one 3D stage, with the card drifting ten pixels against the rotation so it reads as floating rather
than printed on. Five degrees is the whole budget: more turns a calm page into a toy. The transforms
are written straight to refs inside one `requestAnimationFrame`, never through state, because a
pointer move that re-rendered React sixty times a second would be the most expensive thing on the
page. It is off for touch (no hover to key off) and off under `prefers-reduced-motion`.

**Cards lift four pixels and gain one elevation step on hover.** The lift is `motion-safe:`, the
shadow is not: someone who asked for less motion still benefits from the surface responding, and a
shadow change is not motion. Both are inside Tailwind's `@media (hover: hover)`, so a phone tap
leaves nothing stuck in a hover state.

**No Privacy or Terms links.** Neither page exists; a dead legal link reads worse than a missing one.
They go in the footer when they are written.

### Page metadata and SEO

**`metadata` sits directly after the imports.** Next reads it wherever it is; the placement is so
that a file found by its route rather than its filename announces which page it is.

**Titles never contain the brand.** The root layout owns `template: "%s - TasKlean"` and a `default`
of `TasKlean`, so changing the separator or the brand is a one-line edit. The homepage is the
deliberate exception, setting none — the template would make it `Home - TasKlean`.

**Real SEO applies to one page today: `/`.** It is the only indexable route left. The throwaway
`/about` is deleted rather than kept as a stub: an empty page in the sitemap is worse than no page,
and the home page already says what the product is. It comes back when there is something to say
about who builds this.

**Public and indexable are different things.** `/login`, `/register` and `/verify-email` are in
`PUBLIC_PATHS` because they must be reachable, but have no business in search results — the
`(auth)` layout sets `robots: { index: false }` for all of them.

So protected routes get a title and description for the tab and nothing more. When more public
routes get built, "SEO proper" means `metadataBase` and a canonical URL, Open Graph and
Twitter cards, and a `sitemap.ts` listing only the indexable set.

### Route boundaries and the ways out

**A failure now lands on our own page.** `app/error.tsx` and `app/not-found.tsx` sit at the app
root, so the boundary is below the root layout and catches a group layout's session read as well as
a page's own throw. Next replaces an error's message in production, so the page offers a retry, a
link home and `error.digest` as a reference rather than pretending to explain. It also logs the
error: a render that fails in the browser reaches no server log, so the screen would otherwise be
the only record of it.

**No `global-error.tsx`.** It catches only a throw in the root layout itself, which is a font and a
metadata object with no data access. A file for a case that cannot happen is a file that rots.

**Default deny means the 404 is mostly for signed-in visitors.** Every path outside `PUBLIC_PATHS`
is protected, so an anonymous visitor on a mistyped URL is redirected to `/login` before the 404 can
render; they reach it after signing in. Only a session, or an unmatched path under a public prefix
like `/login/x`, renders it directly. That is why its primary action points at `/app`.

**Every auth screen carries a back arrow except `/verify-email`.** Login and register point at the
marketing page, the two password-reset screens point at login, since that is where a reset both
starts and ends. Verification is the one exception: it is mid-flow with a code already emailed, and
an arrow out of it reads as "cancel" without saying so. It offers a link to log in instead, because
without one a visitor who is already verified has only "start again" and is pushed toward a second
account.

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

**Login** failures are all `401`, but **not all one message**. Unknown email and wrong password
share `"Invalid email or password"` — deliberate anti-enumeration. Deactivated, Google-only and
unverified each have their own wording, so the UI can act on them. We act on one: a message matching
unverified login carries **`code: "EMAIL_NOT_VERIFIED"`** in the envelope, which is what we branch
on: it sends a fresh code and redirects to `/verify-email`. The message match is kept only as a
fallback for a backend build without the code, and a code that *is* present wins over the text.

**A resend invalidates the earlier code.** The backend deletes a user's existing code before
issuing one, so the redirect from an unverified login carries `?resent=1` and the screen says so —
otherwise someone holding the first email would type a code that silently no longer works.

**Verification links must not verify on a GET.** The code arrives by email, and the link may carry
it as `?code=`. Mail scanners prefetch links to check them, so a page that auto-submitted would
spend the single-use code before the recipient clicked and leave them with the generic failure. The
link prefills and still requires a click; our verification is a POST from a Server Action, so a
prefetch changes nothing. `?code=` is stripped from the URL once read, and no countdown is shown
when a code arrives prefilled — the backend never says when it was sent.

**Google** — the _browser_ runs Google Identity Services and gets an **ID token**, posts it to our
server, which forwards it to `POST /api/auth/google`. Three config preconditions, all easy to get
wrong: our `NEXT_PUBLIC_GOOGLE_CLIENT_ID` must exactly equal the backend's `GOOGLE_CLIENT_ID`; our
deployed origin must be an Authorized JavaScript origin on that OAuth client; the consent screen
must be published or the tester whitelisted.

**One endpoint covers sign-up.** `POST /api/auth/google` matches the stable Google subject id,
falls back to the email, and provisions when neither hits. A password account with the same address
is **linked** and marked verified, because Google has verified that mailbox. So "log in with Google"
and "sign up with Google" are the same call: both screens share one Server Action at the `(auth)`
group root and differ only in the label Google renders.

**Google renders the button, we do not.** The ID-token flow has no supported custom-button path, and
their branding rules expect their widget, so it arrives as an iframe that cannot take our tokens.
Width is a constructor option rather than CSS, which is why the widget is re-rendered when the
container resizes, measured through a `ResizeObserver` and capped at the 400px Google rejects above.
The theme is fixed to `outline` rather than following the OS: `filled_black` disappears into our
dark card, `filled_blue` competes with our own primary button, and the bordered white pill stays
legible on both schemes while reading as the secondary option it is. The old node is cleared first: `renderButton` appends, so
re-rendering would otherwise stack a second button. The `text` option is honoured, but the
translation need not be distinct: Slovenian renders `signin_with` and `signup_with` identically,
while `continue_with` differs.

**The nonce is two values, and mixing them up is the whole vulnerability.** OIDC makes a nonce
required for the implicit flow, binding an ID token to the one login attempt it was minted for. We
mint a raw 32-byte secret, keep it in an httpOnly cookie, and give Google only its lowercase hex
SHA-256, which Google copies into the token's `nonce` claim. The backend receives the **raw** value
and rehashes it. Sending the hash instead would be pointless: the claim is already the hash, so an
attacker replaying a stolen token could just echo it back. Sending the raw value forces a SHA-256
preimage.

**Proxy mints it, because a render cannot.** Cookies are writable in Proxy, a Route Handler or a
Server Action only, and the page needs the hash at render time, so Proxy sets the cookie and
forwards the hash on the request as `x-tasklean-google-nonce`. The alternative, a route the client
fetches on mount, costs a round trip and a public endpoint for no gain. The nonce is **reused
across requests rather than rotated**, because a link prefetch is a request too: rotating there
would leave the visible page holding a hash the cookie no longer matches. Single use is enforced on
the attempt instead, where the action replaces the nonce on every outcome and hands the fresh hash
back in its state so the button rebuilds around it rather than needing a reload. Only the Google
action spends a nonce, so a password login would otherwise leave one behind until it expired: Proxy
drops it on the first signed-in request, keeping the whole lifecycle in the file that mints it.

**Script readiness is read from the global, never from `onLoad`.** next/script does not fire it
again for a script it already loaded, so after a client-side navigation between `/login` and
`/register` the widget waited for an event that never came and simply never appeared.
`useSyncExternalStore` over `window.google` reports the already-loaded case on mount, and the
script's `onLoad` only wakes the subscribers on the first load.

**Two consequences of the widget being Google's, not ours.** `initialize()` is page-level: a second
call replaces the first and Google logs a warning, so the module owns that call and each mounted
button only swaps the handler behind it, while `renderButton` runs as often as the theme or width
needs. And the credential arrives through Google's own `postMessage`, not a React event, so the
dispatch has to open its own `startTransition`: without it the action still runs, but `pending`
never flips and the button shows no progress.

**The code flow is not an option.** The backend verifies ID tokens only; an authorization code would
need a token exchange with our own client secret and an endpoint that does not exist. The dev
profile's `google.redirect-uri` is leftover config that nothing reads.

**Refresh** — access tokens live **15 minutes** in staging/prod, and a year in local dev, which is
why rotation is tested by overriding `JWT_EXPIRATION` in the compose environment rather than by
waiting. It's **single-use with rotation**: each refresh revokes
the old token and returns a new pair, so the new pair **must** be written back to the cookie or the
session is dead. Two consequences:

- **Serialize refreshes.** Two concurrent `401`s must not both refresh — the second would present an
  already-revoked token and kill the session. Single-flight it.
- Refresh is where a **deactivation or role change takes effect** — the backend re-reads `is_active`
  and `role` there. A deactivated user keeps working for up to 15 minutes, by design.

**Logout** currently revokes **all** of the user's refresh tokens — it signs them out everywhere.
The backend plans per-device logout later. Until then, don't word the button as "sign out of this
device".

**Password reset is two screens and never a session.** `POST /api/auth/forgot-password` emails a
single-use token that lives 15 minutes, and `POST /api/auth/reset-password` spends it, verifies the
email as a side effect (holding the token proves control of the mailbox) and returns **no tokens**.
So the flow ends at `/login?reset=1` with a notice, not in the app.

**The forgot screen must stay silent about who has an account.** The endpoint answers `200` for an
address it has never seen, and a Google-only account is emailed a "there is nothing to reset"
notice instead of a link, so the response is identical in all three cases. That is why the screen
keeps its notice on the page rather than redirecting: a redirect to "check your inbox" would read
as confirmation. The copy is "if that address has an account", and the Google case is covered by a
static line pointing at the Google button rather than by anything the response told us.

**The reset link is the frontend's URL, and the route name is not ours to choose.** The backend
builds `${APP_BASE_URL}/reset-password?token=<raw>`, so `/reset-password` and that parameter name
are fixed by the email. A link an email client wraps arrives truncated or bare, which is
indistinguishable from a spent one, so the page renders an "ask for a new link" state instead of a
form when the token is missing and leaves the rest to the backend's one 401.

**Finishing a reset clears our own cookie.** The backend revokes every refresh token the user holds,
so a session sealed before the reset is already dead; clearing it in the action saves a pointless
bounce through Proxy's refusal path. For the same reason `/reset-password` is public but **not** in
`AUTH_PATHS`: bouncing a signed-in visitor off it would make an emailed link unusable on the one
browser they are most likely to open it in. `/forgot-password` is in both lists, because a session
really does make asking for a link pointless.

**Two-factor** - `login` and `google` stop returning tokens for an account that has a second
factor. They answer `{ twoFactorRequired: true, challengeToken }` with `token`, `refreshToken`,
`uid`, `email` and `name` all null, and the client posts that challenge with a code to
`POST /api/auth/2fa/verify`, which answers the ordinary `AuthResponse`. The challenge lives five
minutes, allows five wrong codes, dies on the first success, and is replaced whenever the user signs
in again. `code` takes a six-digit authenticator code or one of the ten recovery codes. Refresh is
**not** gated, so the prompt appears on a real sign-in rather than on every visit, and nothing
changes for a user who never enrolls.

**A 400 from reset means the two policies have drifted.** The frontend is the spec and the backend
matches it, so a rejected password should never reach the endpoint. If one does, the message is
shown against the password field rather than swallowed, since that is the only place it could be
acted on.

### The second factor is a cookie between two requests

A gated login hands back a challenge token, and the screen that answers it is a separate request. So
the token has to live somewhere in between, and the handoff suggested component state because it
assumed a single-page app. Here the login Server Action runs on the server and can write a cookie,
which is strictly better: `tasklean_2fa_challenge` is httpOnly with a five-minute `maxAge` mirroring
the backend's own window, so the credential never enters the DOM, never rides a hidden field, never
reaches page scripts, and a reload leaves the screen usable instead of dumping the visitor back at
sign-in. The verify action reads the cookie and ignores a `challengeToken` posted with the form, so
a crafted field cannot substitute one. It is the Google nonce pattern a second time, and Proxy
cleans up a leftover challenge on the first signed-in request the same way.

**`signInOutcome` is the only reader of a login response.** `AuthResponse` now carries both shapes,
and reading `token` before checking `twoFactorRequired` silently yields `null`: a user who looks
signed in with no session. One narrowing function returns a session-or-challenge union, which makes
the compiler refuse any caller that forgets to branch. It throws on a gated response with no
challenge token, and still throws on the old failure of a 2xx with no pair, so neither can pass as
success.

**The verify call carries the device headers.** The backend creates the device row and sends the
new-sign-in email at that step now, not at login, so a verify without `X-Device-Id` costs this
browser its identity in the devices list and the account its alert. `/two-factor` is therefore in
`AUTH_PATHS`, which is what makes Proxy mint the id for a visitor who does not have one yet.

**A 401 here is not the session.** Two error codes end the attempt and nothing else does:
`TWO_FACTOR_CHALLENGE_INVALID` means expired, spent or out of attempts, so the cookie is cleared and
the visitor restarts at `/login?expired=2fa`, with one line covering both causes because the backend
deliberately says only whether the tries ran out. `ACCOUNT_DEACTIVATED` reuses the notice login
already renders. Everything else a 401 says is shown against the code field, which keeps a mistyped
digit from looking like a dead end, and a 429 goes through `rateLimitMessage` like every other auth
call.

**`enabled` and `pendingSetup` are different states, and the card says so.** A setup nobody
confirmed leaves a stored secret behind but does **not** gate a sign-in, so showing it as on would
tell the reader their account is protected when it is not. The card reads it as a third state,
Unfinished, and says plainly that nothing extra is asked for yet. It also treats an unreadable
`recoveryCodesRemaining` as none left rather than as a number, warns at three or fewer, and gives
zero its own sentence: with no codes and no phone there is no way back into the account, and the
backend has no admin reset.

**One field, both kinds of code.** The endpoint takes an authenticator code or a recovery code in
the same field, so the client keeps no mode of its own: `twoFactorCodeRule` accepts six digits or
eight recovery characters and normalises the way the backend matches, stripping spaces and the
hyphen and upcasing. The screen still offers a toggle, because six boxes and a hyphenated word are
nothing alike to type, and it says a recovery code works here, since someone who lost their phone
will otherwise assume they are locked out. **Confirming a setup is the exception**: `/2fa/enable`
has no recovery codes to fall back on yet, so that one form takes the plain six digits.

**The QR code is encoded on the server, and travels as a path.** `otpauthUri` has to become a
picture somewhere. Doing it in the browser puts an encoder in the client bundle for a screen most
people visit once; doing it in a Server Component is impossible, because the secret only exists
after a Server Action has run. So the action encodes it and hands the client `{ size, path }`: one
SVG path with horizontal runs merged, rather than a few thousand booleans over the wire, and
`uqr` stays server side. The component draws it with `fill-qr-ink` on `bg-qr-paper`, two tokens
deliberately not redeclared under `dark` for the same reason the picker's swatches are not: a
scanner expects dark modules on a light field, and an inverted code is read less reliably. A test
rasterises the path back into a grid and compares it against the encoder's own matrix, so a run
merged one module short fails rather than producing a code that merely looks right.

**Nothing that is shown once may depend on a render surviving.** `enable` returns the recovery codes
and the backend keeps only their hashes, so they exist in exactly one place: the action's answer. It
would be natural to `revalidatePath` after turning the factor on, and that is precisely what must
not happen, because the page would re-render with the factor enabled, the conditional around the
enrollment component would evaluate false, React would unmount it, and the codes would be gone
before they were read. This was not caught by reasoning but by testing: sealing the new session
writes a cookie, and **writing a cookie in a Server Action re-renders the route just as
`revalidatePath` does**. The component therefore stays mounted whatever the status says, as long as
it is holding codes, and the page no longer decides for it. Dismissing them is separate state, and
"I have saved them" calls `router.refresh()` rather than linking to the page it is already on, which
the App Router treats as a no-op. The `href` stays on the anchor as the no-script path.

**A pending setup can be resumed, and a resume is not a restart.** The status says `pendingSetup`
but no endpoint hands the secret back, so the obvious reading is that the only way on is to start
again. It is not: the pending secret still verifies, so if the entry is still in the app a code from
it finishes the job with no new QR code. The screen offers that first and keeps "start again" as the
escape, saying what it costs, since re-running `setup` replaces the stored secret and kills the
entry already in the app.

**The methods are a list, and only one of them exists.** The backend's `TwoFactorProviderType` has a
single value, `LOCAL`, so Email and Text message are listed with a dead "Coming soon" button rather
than built or hidden. Listing them answers "what else can I use" without anyone having to ask, and
the shared `TwoFactorMethod` shell is what makes adding a real one a matter of listing it. The shell
refuses to render children for a method marked unavailable, so a form cannot appear behind one by
accident. The authenticator entry owns its own enrollment, collapsed behind a button, which keeps
the page a set of choices rather than one open form between two headings.

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

### `uqr` for the QR code, not `qrcode`

QR encoding is Reed-Solomon plus mask selection, so it is the rare case where a dependency beats
writing it. `qrcode` is the obvious pick by downloads and was the one the plan named, but it brings
`pngjs`, `dijkstrajs` and **`yargs`** as runtime dependencies, for a web app that needs none of
them, and its types live in a separate `@types` package. `uqr` has **zero dependencies**, ships its
own types, and exposes exactly the one function we want: text in, module matrix out, with the
drawing left to us. Same reasoning as `jose`: in a seven-dependency project, transitive cost is the
deciding factor. It is pinned loosely like everything else, and the one call is wrapped in
`lib/qr/qr-code.ts`, so replacing it touches a single file.

Error correction is left at **L**, the lowest. Measured on a real `otpauth://` URI, L needs a 49
module grid where M needs 57: the same picture on screen means smaller modules for a camera to
resolve. Redundancy is for a printed code that gets creased, and this one is read off a screen.

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

### Device identity lives in a cookie, not in browser storage

The backend binds each refresh token to a device, resolved from an `X-Device-Id` header it expects
us to keep stable per browser. The obvious implementation is a UUID in `localStorage`, and it is the
one the backend's own notes suggest. **It cannot work here.** Refresh does not happen in the
browser; it happens in Proxy, on the server, which has no access to `localStorage` at all. A rotation
would therefore arrive with no device, and the session would lose the identity the whole feature
exists to give it.

So Proxy mints the id into `tasklean_device`, an httpOnly cookie, exactly as it already mints the
Google nonce, and for the same underlying reason: a cookie is the only client state the server can
read on every request, and Proxy is one of the three places allowed to write one. `localStorage`
also loses on browser policy: Safari wipes script-writable storage after 7 days of inactivity, so an
id kept there would churn weekly on that browser, while a server-set httpOnly cookie does not.

**The id is rolled, not just minted.** Its life is 400 days, the ceiling Chrome has enforced since
104, and Proxy re-writes it whenever it rotates the session, which is already a cookie write. A
browser in regular use therefore keeps its identity indefinitely; only a dormant one ages out.

Losing the cookie means a new device, with no way around it: `resolveLoginDevice` matches on the
client id alone, with no fallback on user agent, so an unseen id always takes the `isNew` branch.
That costs a fresh device row, a new-sign-in email, and an old row left listed with no live session
until the user removes it. Clearing site data, a private window and a second browser profile all do
the same thing. A user-agent fallback would hide the duplicates at the price of merging two profiles
on one machine into one device, which is the worse error.

Two consequences worth stating. The **user agent must be forwarded explicitly** as
`X-Device-User-Agent`, because on the BFF-to-backend hop the ordinary `User-Agent` is Node's, so a
device would otherwise be named after our server rather than the browser. And the id is minted
**only on the auth screens and for signed-in requests**: stamping a stable identifier on an anonymous
reader of the marketing page would be a tracking cookie that no sign-in ever needs.

The headers are built in one place, `auth/device.ts`, and passed as a parameter rather than looked up
inside each call, mirroring `client.ts`'s rule that auth is a parameter and not a session lookup.
Proxy reads them off the `NextRequest`; a Server Action reads them through `next/headers`.

### The avatar costs one call at sign-in, not one per page

The chrome shows a profile photo, and `AuthResponse` does not carry one: it has `token`,
`refreshToken`, `uid`, `email`, `name` and `message`, nothing more. Only `GET /api/users/me` knows
the `photoUrl`, which the backend fills from Google's `picture` claim.

Three ways to get it to the chrome, and the cheap one wins. Fetching the profile in both layouts
would put a backend call on every signed-in page render, including the marketing page. Asking the
backend to add the field is the cleanest answer and the one to take if it ever becomes easy, since
`name` is already there for exactly this reason. Until then `startSession` reads the profile once,
right after a credential exchange, and seals the photo into the cookie beside the name.

It inherits the same contract as the name: **display only, and allowed to be stale.** A photo
changed elsewhere shows up at the next sign-in. The call is best effort and its failure swallowed,
because an avatar is never worth failing a login over.

The consequence worth remembering: **every sign-in path must go through `startSession`**. Calling
`setSession` directly still works and still signs the user in, which is exactly why a path that
skipped it would lose the avatar quietly rather than loudly.

Remote photos also break the project's image rule, which assumes a static import with a build-time
size. `next.config.ts` therefore allowlists the hosts the optimizer may fetch, currently only
Google's, and `Avatar` checks the host before drawing: an unlisted one falls back to initials.
Without that check `next/image` throws on an unconfigured host and takes the whole page down, and
allowlisting every host instead would turn our optimizer into an open image proxy.

### What the devices screen offers, and what it refuses to

Three operations exist on the backend and all three are worth exposing: end one device's session,
remove a device, and end every session. There is **no bulk delete**, and the screen does not fake
one by looping requests: a half-failed loop leaves a mess nobody can see, and "sign out everywhere"
already covers the case that matters, losing a device.

A dead session dims its row but **keeps its Remove button at full strength**, since that is exactly
when removal is the useful action. Its sign-out button disappears instead, because ending a session
that has already ended does nothing.

**Ending this browser's own session has to clear the cookie.** The backend revokes refresh tokens
and nothing else, so the access token sealed in our cookie keeps working until it expires, which in
dev is a **year**. Without clearing it the screen would cheerfully report you were still signed in.
The action therefore asks the backend which row is the current device, and if it is the one being
ended, clears the session and redirects to `/login`. Asking the backend rather than trusting a
hidden form field means a tampered field cannot sign anyone out, and an unreadable answer is treated
as "not ours", because wrongly logging someone out is worse than wrongly leaving them in. The same
check covers removal, which also answers "what if the list empties": the only device you can remove
last is your own.

Unlike ordinary logout, which swallows a failed revoke, **sign-out-everywhere reports failure**.
Someone pressing it believes every other session is gone, and a silent failure would leave them
believing it wrongly.

### Settings is grouped, and each section is a route

The sections are grouped rather than listed flat, because they already split along a real line:
**Preferences** holds appearance, language and notifications, **Security** holds the password, the
connected accounts and the devices, and **Account** holds what ends the account. One list in `sections.ts`
feeds both the desktop rail and the mobile index, so the two cannot drift, and each section stays a
real route that deep links.

Preferences sits **first**: it is the harmless group, the one people come back to, and settings
should not open on a lock. Account sits **after** Security while deactivation is the only thing in
it. A group with one
destructive link in it has no business being the first thing settings offers; it fills out when a
profile section exists. Nothing is called "Security" at page level, since that word now names the
group: the pages are **Password**, **Connected accounts**, **Devices and sessions** and **Deactivate
account**.

### Changing a password without losing the session

`POST /api/account/change-password` verifies the current password, and the backend answers a wrong
one with **401**, the same status an expired token gets, with no code to tell them apart. Our rule
is that a 401 ends the session, so as written it would have signed someone out for a typo.
`serverApi` therefore takes `credentialCheck: true`, which keeps the 401 an `ApiError` for the
handful of endpoints that verify something from the request body. It is opt-in rather than a
general relaxation: everywhere else, a 401 really is the session.

Changing or setting a password **revokes every refresh token the account holds**, this browser's
included, and the backend then issues a fresh pair for the device the `X-Device-Id` header names.
Two consequences the UI cannot skip. The pair has to be sealed into our cookie, or the session we
are standing in is already dead. And the device headers have to ride along, or the backend resolves
a device it has never seen, writes a new row, and emails a new-sign-in notice for the browser the
person is sitting at.

**Linking Google needs a nonce on a page you reach while signed in.** Proxy minted one only on
`/login` and `/register`, and deleted any leftover on every signed-in request, so the connected
accounts page is now the one signed-in response that keeps its nonce. Nothing else about the exchange changes: the
page still gets only the hash, and the action still sends the raw value.

The backend verifies the Google token, the nonce and that Google says the mailbox is verified. It
does **not** check that the Google address matches the account's, so the copy does not claim it
does. Unlinking is refused when no password is set, because Google would be the only way back in.
The UI does not offer the attempt and then relay the refusal: it says to set a password first, which
is the thing that would make unlinking possible.

**Deactivation asks for the password in place**, in the same confirm-in-place pattern as removing a
device, because that password is also what the backend re-authenticates with. A Google-only account
has none to give and is confirmed by the session alone. Afterwards every session is gone, so the
action clears our cookie and lands on `/login?deactivated=1` rather than leaving a cookie that
authenticates nothing.

Editing the profile is still **not built**: `PUT /api/users/{uid}` is a full replace that requires
`email`, so a name change would be a rewrite of the record with whatever fields the form happened to
carry.

### The theme is the account's, and the cookie is this browser's copy of it

`GET`/`PUT /api/user-settings` store a theme and a language per user, so the choice follows the
person to any browser they sign in from. That is the right place for it, and it creates the one
problem worth solving carefully: a render cannot wait for an API call before the first paint, and a
theme applied after the paint is a flash of the wrong one.

So the theme is **cached in a cookie**, `tasklean_theme`, and the root layout reads it and writes
`data-theme` on `<html>`. No client JavaScript is involved, so the scheme is correct in the first
byte of HTML and correct with scripting off. `startSession` fills the cookie from the API at every
sign-in, beside the profile call that fetches the avatar, and always writes it, even when the read
failed, so a shared browser never keeps painting the previous account's theme. The API stays the
authority; the cookie is a cache, rewritten whenever the picker saves. The honest cost: a change
made on another device does not reach this one until the next sign-in. For a colour scheme that is
a fair trade against an API call on every render.

**The dark palette is still written once.** `globals.css` declares the condition as a
`@custom-variant dark` with two branches, the OS preference unless `data-theme="light"` overrides
it, and the explicit `data-theme="dark"`. The token block then sits inside `:root` under
`@variant dark`, and Tailwind emits both branches from that one source; every `dark:` utility
resolves through the same variant, so the logo swap follows a chosen theme too. Duplicating fifty
token values to support an override would have broken the rule that each colour is defined once.

Four `swatch-*` tokens are deliberately **not** redeclared in the dark branch. The picker's squares
have to show what light and dark look like while wearing whichever one is active, so those four are
fixed in both schemes.

**The picker is three submit buttons, not a radio group with a save.** A `name`/`value` pair on a
submit button is ordinary HTML, so one click saves with or without JavaScript and there is no second
control to explain. The repaint happens in the click handler rather than waiting for the answer,
because `data-theme` lives on `<html>`, above this route, where a Server Action's re-render cannot
reach it; a refused save puts the saved theme back. `generateViewport` reads the same cookie, or an
explicit choice would leave the browser chrome painted by the OS while the page disagreed.

**The PUT replaces both fields.** Appearance and language are separate pages editing one field each,
so each action reads the current pair and sends the other value back unchanged. Reading before
writing costs one call and is always right; a hidden field carrying the other value would silently
overwrite a change made elsewhere.

**Language is stored, and nothing is translated yet.** The backend offers `EN`, `DE` and `SL`, the
page saves the choice, and `<html lang>` stays `en` on purpose: a `lang` the copy does not match
tells a screen reader to pronounce English in German. The page says plainly that English is the only
one so far, so the control is honest rather than decorative. Translating the interface is its own
phase, and the saved preference is what it will read.

### Notification channels are saved long before anything is sent

`GET /api/notification-settings` and `PUT /api/notification-settings/batch` store, per user, which
of four events reach them in the app and by email. **Nothing delivers them yet**: no mail goes out,
no in-app row is written, and there is no push channel in the contract even though the device table
holds push tokens. The page says so in a line of its own, because a switch that silently does
nothing is worse than no switch at all.

**The page edits a draft and saves it in one press.** Every switch is a real checkbox holding its
own state, Save posts one list of type names per channel, and the action writes only the types that
differ. The first design saved on each press, which was one call per switch and up to four for a
column: cheap to write, expensive to use, and impossible to change your mind in. A reminder appears
the moment the draft differs from what is saved, and a refused save keeps the draft so it can be
sent again rather than being thrown away.

**The batch endpoint exists because of atomicity, not request count.** Writing a type at a time
meant a save could stop half way, leaving the account in a state neither the page nor the person
chose. `PUT /batch` runs the whole list in one transaction, so a refused save has applied nothing
and the page on screen is still true: the action reports the message and leaves the page alone. Its
two 400s cannot reach us: the list is never **empty**, since every type is sent, and a **duplicate
type** is impossible in a matrix keyed by type.

**The response is a re-read, not an echo**, so what comes back includes a type another device wrote
while this save was in flight. That is what the page then shows, which is why the form takes the
answer over its own draft.

**Revalidating is for pages whose truth only the server holds.** A device row disappears, a
password flips the card from "set" to "change", a Google account shows as linked: none of that is in
the action's answer, so those three actions call `revalidatePath` and the re-render is what the
person sees. The three preference pages are the opposite. They render the value the action already
returned, so the call added a fetch and nothing else, and all three now skip it.

**The save reads nothing, before or after, and revalidates nothing.** The form carries every type,
so there is no missing value a read could supply, and the batch answers with the backend's own
re-read, so there is nothing to fetch afterwards either. `revalidatePath` was there at first and did
nothing measurable: the route is dynamic because it reads the session cookie, `request()` sends
`cache: "no-store"`, and a dynamic segment is stale in the client router cache the moment it lands,
so every visit refetches anyway. One request per save. Appearance and language still read first because
their endpoint replaces a pair while each page edits one half of it; here the page holds the whole
thing. The price is that the matrix is written whole: a type changed on another device since this
page loaded is replaced by what the person in front of it chose, which is the behaviour a Save
button promises anyway.

**The column switches are the same control as the rows.** Each sits at the head of its channel, is
on while anything in that column is on, and turning it off empties the column in the draft. They are
the one control that needs JavaScript: everything else works with scripting off, because checkboxes
and a submit button are what the form actually is.

**Sections are collapsed until they are opened.** Each group is a `<details>` card, so hiding and
showing costs no state and works without scripting, and a closed one still reports how many of its
types are on per channel. Every type names its section in a `Record`, so a type added later fails to
compile until it has one rather than quietly falling off the page.

**The matrix is keyed by our own list of types, not by the response.** The backend promises all four
entries, but no field in the spec is `required`, so the four rows are built from our enum and each
one takes the entry that matches or the backend's own default. A missing row is then impossible
rather than handled, and a type we do not offer is ignored instead of rendered blank.

### A form action resets the DOM, and a controlled value does not come back

React resets a form once its action answers. For an uncontrolled field that is the point. For a
controlled one it is a trap: the reset puts the DOM back to what the page loaded with, and React
never rewrites a value its own render did not change, so the control keeps showing the old choice
while state holds the new one. It looked like a stale read from the API, and it was not: the data
was right and only the DOM was wrong.

Remounting the field does not fix it, because the reset lands after the commit. The fix is to cancel
the reset, `onReset={(event) => event.preventDefault()}`, on any form whose values live in React
state. The language select and the notification switches both carry it. A form that wants its fields
emptied on success, like the password form, still does that from state, where it can be read.

**It is not every controlled field, and the two-factor form proved it.** A reset restores each
control's default, and React writes a text input's value into the `value` attribute, which is that
default, so a text field comes back unchanged. A `select` has no `selected` option written and falls
back to the first one; a checkbox has no `checked` attribute written and falls back to unchecked.
That is the whole difference, and it is why the code prompt keeps a refused code on screen with
nothing added, while the language picker could not.

### A finished code submits itself

Six digits and then a press is a press nobody means to withhold, so `CodeInput` submits its own form
once the last box is filled, on every screen that uses it: sign-in, verify-email and enrollment. Two
details decide whether it works.

**It submits from an effect, not from the keystroke.** The value that travels is the hidden input's,
and at keystroke time React has not written the last digit into it yet, so submitting there posts
five digits. The effect runs after that commit. It goes through `requestSubmit()` rather than
`submit()`, which is what keeps each form's own `onSubmit` validation and its action in play, and a
ref guards against submitting twice for one completion while still re-arming when a digit is
corrected.

**A code that arrived with the component does not count as typed.** The verify-email link carries
the code in the URL and prefills it, and a test has always asserted that nothing fires on mount: the
address may be wrong and a page that posts the moment it loads gives nobody a chance to look. So the
guard starts spent whenever the initial value is already complete, and a typed or pasted code is the
only thing that triggers a submit. The press remains for the no-script path and for a retry.

The boxes are also **centred rather than spread**. `justify-between` is fine on the narrow auth
column it was written for, but a settings card is wide, and six boxes a hand apart stop reading as
one field.

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
| Auth              | `/api/auth/*`                  | Public. `register` returns no tokens. `login`, `verify-email`, `refresh`, `google` return the pair, except that `login` and `google` return a **challenge** instead for an account with a second factor. `POST /2fa/verify` takes `{ challengeToken, code }` and answers the ordinary pair; it is capped at 10 requests a minute per IP. `logout` and `refresh` take `{ refreshToken }` in the body.                                                                                   |
| Account           | `/api/account`                 | The caller's own security. `POST /change-password` and `/set-password` return a **fresh pair** and revoke every other session. `GET /connected-accounts` reports `{ passwordSet, googleLinked }`. `POST`/`DELETE /connected-accounts/google` link and unlink. `POST /deactivate` takes `{ password }`, required only where one is set. |
| Two-factor        | `/api/account/2fa`             | The caller's own second factor. **`GET`, `POST /setup` and `POST /enable` have callers**; `GET` reports `{ enabled, pendingSetup, confirmedAt, recoveryCodesRemaining }`. `POST /setup` takes `{ password }` and returns `{ secret, otpauthUri }`; `POST /enable` takes `{ code }` and returns ten recovery codes **plus a fresh pair**, having revoked every other session. `POST /disable` and `POST /recovery-codes` both take `{ password, code }`, and only `disable` reissues the pair. The password is ignored for a Google-only account. A state mismatch is a `409` with no code, so the client refetches status. |
| Users             | `/api/users`                   | `GET /me` is the caller's own profile — **the source of the caller's numeric `id`**, needed for `?userId=` filters. `GET /api/users` (list all) is platform-ADMIN only. `PUT /{uid}/role` is SUPER_ADMIN only and has no place in the product UI. |
| Groups            | `/api/groups`                  | `GET /mine` is the one to build on — it returns `myRole` and `dateJoined` per group. `POST /join` takes `{ inviteCode }`. `POST /{uid}/invite-code` rotates and **invalidates every outstanding invite** — warn before the click.                 |
| Group members     | `/api/group-members`           | `GET` needs `?groupId=`. Role change is `PATCH /{id}/role?role=GROUP_ADMIN` — a **query parameter**, not a body.                                                                                                                                  |
| Tasks             | `/api/tasks`                   | `GET` needs `?groupId=`. Addressed by `uid`. Creating one requires `groupId`, `createdById` (a GroupMember id), `name`, `priority`, `status`.                                                                                                     |
| Task completions  | `/api/task-completions`        | `GET` needs `?taskId=`, or `/member/{groupMemberId}`. Append-only — there's no delete, so "undo a completion" isn't available.                                                                                                                    |
| Categories / Tags | `/api/categories`, `/api/tags` | Group-scoped, `?groupId=`, numeric ids. Duplicate name in a group → `409`.                                                                                                                                                                        |
| Notifications     | `/api/notifications`           | Read-only plus `PATCH /{id}/read`. All GETs need `?userId=`. `/unread/count` is cheap enough to poll for a badge.                                                                                                                                 |
| User settings     | `/api/user-settings`           | The caller's own theme and language. `GET` answers the defaults (`SYSTEM`, `EN`) when nothing was ever saved, so there is no empty state. `PUT` is a **full replace** and `@NotNull` on both fields, so a screen editing one sends the other back unchanged.                                                            |
| Notification settings | `/api/notification-settings` | The caller's own channels. `GET` always answers one entry per type, defaults included, so there is no empty state. `PUT /batch` replaces the types it is sent, in one transaction, and answers with the whole matrix **re-read** after the writes; an empty list or a duplicate type is a `400`. `PUT /{type}` does one type and we no longer call it. Nothing reads these yet. |
| Devices           | `/api/devices`                 | `GET` is the caller's own devices, scoped by the token, and `POST` is push-token registration, not a settings call. `POST /{id}/logout` ends that device's sessions, `DELETE /{id}` removes it.                                                   |
| Audit logs        | `/api/audit-logs`              | `?groupId=`, or `/entity?entityType=&entityId=`, or `/member/{id}`. Could power a group activity feed.                                                                                                                                            |

### Status codes and what the UI does

| Code | Meaning                                                                 | UI                                                                                 |
| ---- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 2xx  | Success                                                                 | POSTs really return 201 though the spec says 200 — never branch on the exact code  |
| 400  | Validation, malformed body, bad enum/param type                         | Render against the field; `message` joins the field errors                         |
| 401  | Missing/expired/invalid token, bad credentials, deactivated, unverified | Refresh once, then log out. On the login form, one generic message. On `/api/account` and the two-factor endpoints it is the credential in the body being refused, so it shows against the field; `TWO_FACTOR_CODE_INVALID`, `TWO_FACTOR_CHALLENGE_INVALID`, `PASSWORD_INVALID` and `ACCOUNT_DEACTIVATED` tell those cases apart. |
| 403  | Authenticated but not permitted                                         | Permission message. **Never** log out, never retry. Not predictable from the spec. |
| 404  | Not found, or unknown route                                             | Not-found state for the resource                                                   |
| 409  | Duplicate, or a violated rule (last admin, already a member)            | Show the server's `message` verbatim — it's written for humans                     |
| 429  | Rate limited                                                            | Message plus the `Retry-After` window. No auto-retry loop.                         |
| 500  | Unhandled                                                               | Generic message; the server never leaks detail                                     |

**The retry window is composed in one place.** `api/retry-phrase.ts` exports `rateLimitMessage`,
which takes the `ApiError` rather than the seconds, because every call site wants the same sentence:
the backend's own prose plus the window. Login and Google sign-in were missing it entirely, which
the backend's catch-all `auth` tier makes easy to hit at ten requests a minute per IP: a mistyped
password a few times, or a household behind one address. The header is optional, so a missing one
degrades to "shortly" rather than inventing a number.

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
6. **The dev profile's access token lasts a year and can't be shortened.**
   `application-dev.properties` hardcodes `jwt.expiration=31536000000` with no `${JWT_EXPIRATION:...}`
   placeholder, so `accessTokenExpiresWithin` never returns true against a local backend and the
   single-flight refresh in Proxy has never run outside MSW. That is the most dangerous code we
   have: refresh tokens are single-use, so losing the rotated pair kills the session silently. Needs
   one line on the backend to make it overridable; then compose can set it to a minute for one test.
7. **No "leave group" distinct from removal.** `DELETE /api/group-members/{id}` exists, but whether a
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
7. **Only unknown-email and wrong-password share a message.** Both are `401` with
   `"Invalid email or password"` — anti-enumeration. Deactivated, Google-only and unverified each
   have their own. Only the unverified one carries a `code`; the rest are told apart by text or not
   at all. Verify-email's failures *are* all one message, and resend is always `200`. Copy must not
   imply knowledge the API withheld.
8. **`docs/openapi.json` is regenerated on every backend dev start.** A noisy diff there is normal; a
   _shape_ change in it is an API change we need to follow.
9. **`priority`, `status` and `recurrenceType` are plain strings with no enum in the schema** —
   CHECK-constrained in SQL only. `recurrencePattern` is free-form JSON. Define the unions ourselves
   and validate at the boundary; a typo is a `400` at runtime, not a compile error.
10. **Notifications reference `userId`, not group membership**, and carry denormalized `taskId` and
    `groupId`. One can arrive for a group the user isn't a member of.
11. **A `NEXT_PUBLIC_*` variable that `config/env.ts` validates must be set at runtime too.** Next
    inlines `process.env.NEXT_PUBLIC_X` only at a literal reference, and `readEnv` reads it in a
    loop, so a built server bundle sees `undefined` unless the container is given the value. In
    Docker that means both a build arg (for the browser bundle) and a runtime env (for the server
    check). Missing it throws inside the Server Action, where the catch turns it into
    "Something went wrong".
12. **The spec's status-code list is incomplete.** Every one of the 56 operations documents
    200/401/429/500 (most also 400/403) and _nothing else_ — `404` and `409` appear nowhere in
    `openapi.json`, though both demonstrably occur (duplicate name → `409`, unknown invite code →
    `404`). Never treat the documented set as exhaustive.
13. **Next 16 renamed Middleware to Proxy.** The file is `src/proxy.ts`, not `middleware.ts`. A
    `middleware.ts` written from memory simply never runs — no error, no warning.
14. **Cookies cannot be set during a Server Component render.** `.set`/`.delete` need a Proxy,
    Route Handler or Server Action. This is what forces refresh into Proxy.
15. **No response headers are documented at all**, including the `Retry-After` the rate limiter
    actually sends on `429`. Read it defensively and tolerate its absence.
16. **Stitch screens ship their own Tailwind scale.** Each pasted page carries a `tailwind.config`
    whose radii differ from ours — its `rounded-xl` is 0.75rem against our 1.5rem, so a copied class
    doubles every corner. Its `rounded-xl` maps to our `rounded-md`. Check the pasted config before
    trusting any class name.
17. **An MSW major can silently disarm the test network guard.** MSW 3 renamed
    `onUnhandledRequest` to `onUnhandledFrame` *and* defaults to warning, so the old option name
    became a no-op and unhandled requests started reaching the real network while the suite stayed
    green. `typecheck` caught it; nothing else would have.
18. **No envelope field is marked `required`** in `openapi.json`, not even `success`. The declared
    `ErrorResponse` schema is the same envelope with `success: false`, and is referenced by zero
    responses. Narrow at the boundary rather than trusting the shape.
19. **Google's sign-in button is a cross-origin iframe that declares no `color-scheme`**, so it is a
    light document. Under our dark `:root` the schemes disagree, the browser stops treating the
    iframe canvas as transparent and paints it opaque, and a square white slab appears around a
    button that is still a perfect pill inside it. Only a *rebuilt* widget is affected, and
    `renderButton` is rebuilt on every width change because width is a constructor option, so the
    first paint always looks right and a later resize is what breaks it. The slot pins the iframe to
    `color-scheme: light`. Reproducing it needs a real browser at two widths; jsdom and a single
    screenshot both show a clean pill.

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
| **2** | **Auth screens** ✅ done | Register → verify → login, Google sign-in, password reset, logout, and the error and 404 boundaries. | The first flow that exercises phase 1 end to end against a real backend. Refresh was proved against Docker with a shortened token lifetime rather than against staging. CI is the cross-cutting item this phase unblocks. |
| 3     | **Account and settings** ← _current_ | `/app/account`, the avatar menu, the grouped settings shell, devices and sessions, password, connected accounts, deactivation, and the appearance, language and notification preferences. | The backend binds sessions to devices, which only pays off once someone can see and revoke them. It also settles the `/app/*` prefix and the account chrome every later screen hangs off. |
| 4     | **Group onboarding** | `/app/groups`, create a group, join by invite code, the no-group empty state, the active-group switcher in the shell.                                                  | A user with no group has nothing to do — no tasks, no categories, no tags. Nothing after this works without it. It's also where "which group am I looking at" gets decided.                                 |
| 5     | **Tasks, the core loop**  | List with client-side filters, detail, create, edit, complete.                                                                                                     | This is the product. The app is genuinely useful at the end of this phase and not before. Likely where React Query earns its place — filters re-querying and optimistic completion are exactly its problem. |
| 6     | **Members and roles**      | Member list, invite, role change, remove, last-admin handling.                                                                                                     | _Blocked on API gap 1_ — a member's display name can't be resolved yet.                                                                                                                                     |
| 7     | **Categories and tags**    | Management screens for both.                                                                                                                                       | Task-tagging within it is _blocked on API gap 2_.                                                                                                                                                           |
| 8     | **Calendar view**          | Tasks over `nextDueDate`.                                                                                                                                          | A second view on data phase 5 already fetches — cheap once tasks exist, pointless before.                                                                                                                   |
| 9     | **Notifications**          | Inbox, unread badge, mark read.                                                                                                                                    | Pinging a member is _blocked on API gap 4_.                                                                                                                                                                 |
| 10    | **PWA**                    | Manifest, icons, service worker, install prompt, offline shell.                                                                                                    | Deliberately late: it's a capability layered onto a working app, and an offline shell for screens that don't exist yet is wasted work.                                                                      |
| 11    | **Push notifications**     | Device registration and the permission flow. The device list itself landed in phase 3.                                                                                                    | Needs the PWA service worker from phase 9.                                                                                                                                                                  |
| 12    | **Photos**                 | Task photos and completion photo proof.                                                                                                                            | _Blocked on API gap 3_ — there's no upload endpoint on the backend.                                                                                                                                         |

**Cross-cutting work**, slotted where it earns its place rather than done up front:

- **Testing** — Vitest + Testing Library + MSW arrive in phase 1, on the API and session layer, which
  is pure logic with high consequence and exactly what unit tests are good at. End-to-end testing is
  a later, separate decision. See _Testing_ under the decisions above.
- **CI** — landed after phase 2. Two workflows, one `verify` job, Sonar with a coverage gate, and a
  production pipeline that promotes the staging image rather than rebuilding. Reasoning under
  _Continuous integration and deployment_.
- **Two-factor authentication** - the backend shipped it during phase 3, so it is being matched in
  pieces rather than as a phase of its own. The **gated sign-in landed first**, because an account
  that enabled a second factor anywhere else could not get into the app at all until it did.
  The settings card that reports the state came next, then enrollment. Disabling and reissuing
  recovery codes follow in the same section.
  Reasoning under _The second factor is a cookie between two requests_.
- **Hosting and deployment**: Render, deploying the Docker image the pipeline pushes, the same way
  the backend deploys. The `Dockerfile` written in phase 2 as a local test harness is now also the
  deployment artifact, which is why it takes no build arguments.

---

## Open questions

Unanswered on purpose. Each gets decided when the work reaches it.

- **Staging API URL** — recorded nowhere in either repo. Blocks `.env.example`'s staging row and
  `metadataBase`. No longer blocks refresh: rotation was proved in Docker by shortening
  `JWT_EXPIRATION`.
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
- **Translating the interface**: the backend stores `EN`, `DE` and `SL` per user and the language
  page saves the choice, but every string in the app is still English in the component that renders
  it. The decision is the library and the shape: `next-intl` with message catalogs and a locale
  read from the saved preference rather than from the URL, since the preference is account state and
  the routes are already decided. Until then `<html lang>` stays `en`, because a `lang` the copy
  does not match is worse than none.
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
- **Canonical URL for `metadataBase`** — needs an absolute origin we do not have. Until then pages
  carry titles and descriptions but no link-preview metadata, since a relative OG image resolves
  against nothing and Next warns at build.
- **Offline behaviour** — read caching is straightforward; queuing mutations is a real
  distributed-systems problem (ordering, conflicts, auth expiry while queued) and shouldn't be waved
  at.
