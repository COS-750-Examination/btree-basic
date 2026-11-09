# B-Tree Basic

**Learn B-trees one branch at a time.** A pre-lecture web app that prepares COS212 students for the B-tree lecture. It teaches the structure and its search, insertion and deletion algorithms through short lessons, an animated step-by-step visualiser, guided practice and quizzes with tiered hints. A personal "grove" grows as the student masters each objective.

COS750 group project. The design rationale is in the team's Instructional Design (ID) and Software Engineering (SE) documents. The UI follows the team's Figma file (Day and Dusk themes).

---

## Quick start

You need **Node.js 22** (or 20.19+), **npm 10+**, **Docker Desktop** and **Git**. On Windows, use **WSL 2** (see the [local development guide](docs/LOCAL_DEV.md)).

```bash
git clone <repo-url> cos-750-examination && cd cos-750-examination
npm install          # installs every workspace and generates the Prisma client
npm run setup        # creates server/.env with a generated JWT secret
npm run db:up        # starts PostgreSQL 16 in Docker
npm run db:migrate   # creates the tables
npm run db:seed      # demo accounts and grove decorations
npm run dev          # web on http://localhost:5173, API on http://localhost:4000
```

Sign in as `demo@btree.local` with the password `btree-demo-123`, or use the app as a guest. Lessons, the visualiser, practice and quizzes all work **without the API**. Only saving needs it (NFR7).

Step-by-step setup for macOS and Windows/WSL, plus troubleshooting, is in **[docs/LOCAL_DEV.md](docs/LOCAL_DEV.md)**.

---

## Repository layout

```
.
├── client/                  React SPA (Vite): screens 01–10 from the ID document
│   ├── src/pages/           One file per screen (Welcome, Warm-up, Lessons, Lesson, Visualiser, …)
│   ├── src/components/      ui/ primitives · tree/ SVG B-tree · visualiser/ · quiz/ · grove/ · layout/
│   ├── src/content/         Lesson Markdown, quizzes, warm-up, narration, presets (owned by the ID lead)
│   ├── src/stores/          Zustand stores: progress (guest + synced), visualiser, theme
│   ├── src/styles/tokens.css  Day/Dusk design tokens: the single place to change colours
│   └── e2e/                 Playwright smoke and accessibility tests
├── server/                  Express REST API + Prisma (PostgreSQL)
│   ├── prisma/              schema.prisma, migrations, seed.ts
│   └── src/routes/          auth, account, progress, grove, friends
├── packages/
│   ├── btree-engine/        Pure TypeScript B-tree: search / insert / delete → step traces
│   └── shared/              Zod schemas, constants and scoring shared by client and server
├── docs/LOCAL_DEV.md        Onboarding and troubleshooting
├── CHANGELOG.md · PROMPT_LOG.md
└── docker-compose.yml       Local PostgreSQL
```

**Key design decision (SE doc §5):** all B-tree logic, lessons and quizzes run in the browser. The engine never draws anything. It returns a _trace_ of steps, each with a tree snapshot, the pseudocode line and a narration key. The visualiser, lessons and quiz marking all replay the same traces, so the animation and the answers can never disagree.

---

## Tech stack

| Layer       | Choice                                                                        |
| ----------- | ----------------------------------------------------------------------------- |
| Language    | TypeScript 6 (strict) everywhere                                              |
| Client      | React 18, Vite 8, React Router 7, Tailwind CSS 4                              |
| State/data  | Zustand 5 (guest progress in sessionStorage), TanStack Query 5                |
| Animation   | SVG + Motion (honours _reduce motion_), Web Speech API for narration          |
| Interaction | dnd-kit (drag-and-drop with keyboard support), html-to-image ("Snap a photo") |
| Server      | Node 22, Express 5, Zod 4 validation, helmet, rate limiting, pino logging     |
| Database    | PostgreSQL 16, Prisma 7 (pg driver adapter)                                   |
| Auth        | bcrypt (bcryptjs) hashes, JWT in an httpOnly SameSite cookie                  |
| Testing     | Vitest 5, fast-check, React Testing Library, Supertest, Playwright, axe       |
| Tooling     | ESLint 9, Prettier, GitHub Actions CI                                         |

---

## Scripts (run from the repo root)

| Command                                      | What it does                                                          |
| -------------------------------------------- | --------------------------------------------------------------------- |
| `npm run dev`                                | API and web app together, with hot reload                             |
| `npm run dev:client`                         | Web app only (fine for content and UI work: no DB needed)             |
| `npm test`                                   | Unit tests for engine, client and server                              |
| `npm run test:e2e`                           | Playwright smoke and accessibility tests (starts Vite)                |
| `npm run lint` / `typecheck` / `format`      | Code quality                                                          |
| `npm run build`                              | Production build of server (`server/dist`) and client (`client/dist`) |
| `npm run db:up` / `db:down`                  | Start or stop the PostgreSQL container                                |
| `npm run db:migrate`                         | Apply or create migrations (dev)                                      |
| `npm run db:seed` / `db:studio` / `db:reset` | Seed data, browse data, wipe and re-seed                              |

---

## Working on the project

- **Content (ID team):** edit files in `client/src/content/`. Lessons are Markdown, quizzes are JSON validated against `packages/shared/src/content.ts`. A bad file fails loudly when the app starts.
- **Design (Figma):** colours live only in `client/src/styles/tokens.css`. Fonts are set in `client/src/styles/index.css`. The current values are approximated from screenshots, so swap in the exact Figma variables when they are available.
- **Algorithms:** change `packages/btree-engine`, then run `npm run test:engine`. Property tests check every B-tree rule after thousands of random operations.
- **API:** add a Zod schema to `packages/shared`, a route in `server/src/routes`, and a Supertest case in `server/test`.
- **Branches and PRs:** branch from `main` (`feat/…`, `fix/…`, `content/…`), and open a PR. CI runs format, lint, typecheck, tests, build and e2e.

See [CHANGELOG.md](CHANGELOG.md) for what exists today and what is still a stub.
