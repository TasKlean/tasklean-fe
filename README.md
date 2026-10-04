# tasklean-fe

Frontend for **TasKlean** — household task management for families, roommates and couples.
_Clean tasks, clear minds._

A Next.js + TailwindCSS web app (also installable as a PWA) that consumes the TasKlean REST API.
The backend lives in a sibling repo, `../tasklean-be`.

## Getting started

Requires **Node 26** (`.nvmrc`).

```bash
npm install
cp .env.example .env.local   # then fill it in
npm run dev                  # http://localhost:3000
```

The app needs the API running. For a local backend, in `../tasklean-be`:

```bash
docker-compose up -d
./mvnw spring-boot:run       # http://localhost:8080
```

## Scripts

| Command                | What it does               |
| ---------------------- | -------------------------- |
| `npm run dev`          | Dev server on :3000        |
| `npm run build`        | Production build           |
| `npm run start`        | Serve the production build |
| `npm run lint`         | ESLint                     |
| `npm run typecheck`    | `tsc --noEmit`             |
| `npm run format`       | Prettier, write            |
| `npm run format:check` | Prettier, check only       |

## Documentation

- **[CLAUDE.md](CLAUDE.md)** — how to work in this repo: commands, the rules for consuming the API,
  and conventions.
- **[PROJECT_BIBLE.md](PROJECT_BIBLE.md)** — what we're building and why: architecture decisions and
  their reasoning, known API gaps, the roadmap, and open questions.

`AGENTS.md` is generated and maintained by `next dev` — it points coding agents at the Next.js docs
bundled in `node_modules`. Leave it in place; deleting it makes Next write its block into CLAUDE.md
instead.
