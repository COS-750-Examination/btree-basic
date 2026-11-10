# Local development guide

This guide gets a new team member from a clean machine to a running app. Follow the section for your operating system, then continue from [First run](#first-run).

---

## 1. Prerequisites

| Tool                  | Version          | Check with                                 |
| --------------------- | ---------------- | ------------------------------------------ |
| Node.js               | 22 LTS (≥ 20.19) | `node -v`                                  |
| npm                   | 10+              | `npm -v`                                   |
| Git                   | any recent       | `git --version`                            |
| Docker Desktop        | any recent       | `docker info`                              |
| VS Code (recommended) | latest           | the repo suggests extensions on first open |

Docker only runs PostgreSQL. If you cannot use Docker, see [Using a local PostgreSQL instead](#using-a-local-postgresql-instead).

### macOS

```bash
# Homebrew (skip if installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node via nvm, so the repo's .nvmrc picks the right version
brew install nvm git
mkdir -p ~/.nvm
echo 'export NVM_DIR="$HOME/.nvm"; . "$(brew --prefix nvm)/nvm.sh"' >> ~/.zshrc
source ~/.zshrc
nvm install        # reads .nvmrc (22)

# Docker Desktop
brew install --cask docker
open -a Docker     # wait until the whale icon says "running"
```

### Windows (WSL 2)

Run the project **inside WSL 2 (Ubuntu)**, not in PowerShell. File watching, line endings and native tools all behave as they do on macOS and Linux.

1. In an **administrator PowerShell**: `wsl --install -d Ubuntu`, then reboot and create your Linux user.
2. Install **Docker Desktop for Windows**. In _Settings → Resources → WSL integration_, enable **Ubuntu**.
3. In the **Ubuntu** terminal:

   ```bash
   sudo apt update && sudo apt install -y git curl build-essential
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
   source ~/.bashrc
   ```

4. **Clone into your Linux home directory** (`~/…`), _not_ under `/mnt/c/…`. Windows-mounted folders are slow and break hot reload.
5. Open the folder from Ubuntu with `code .`. VS Code installs the WSL extension and reopens the project inside WSL.
6. Configure Git once so it never converts line endings (the repo enforces LF through `.gitattributes`):

   ```bash
   git config --global core.autocrlf input
   ```

---

## 2. First run

```bash
git clone <repo-url> cos-750-examination
cd cos-750-examination
nvm use              # Node 22 from .nvmrc
npm install          # all workspaces; also runs `prisma generate`
npm run setup        # creates server/.env with a random JWT_SECRET
npm run db:up        # PostgreSQL 16 on localhost:5432 (user/pass/db: btree)
npm run db:migrate   # applies prisma/migrations
npm run db:seed      # decorations + demo users
npm run dev
```

Open **http://localhost:5173**. The API runs on **http://localhost:4000**, and Vite proxies `/api` to it, so cookies just work.

- Demo login: `demo@btree.local` / `btree-demo-123` (friends: anele@, jordan@, kea@, sam@ — same password).
- Health check: `curl http://localhost:4000/api/health`

> **Front-end or content work only?** Run `npm run dev:client`. Everything except sign-in and saving works without the API or database.

---

## 3. Everyday commands

| Task                       | Command                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| Start everything           | `npm run dev`                                                                                  |
| Unit tests (all)           | `npm test`                                                                                     |
| Engine tests in watch mode | `npm run test:watch -w packages/btree-engine`                                                  |
| Client tests in watch mode | `npm run test:watch -w client`                                                                 |
| End-to-end + accessibility | `npx playwright install chromium` (once), then `npm run test:e2e`                              |
| Lint / fix                 | `npm run lint` / `npm run lint:fix`                                                            |
| Format                     | `npm run format`                                                                               |
| Type check                 | `npm run typecheck`                                                                            |
| Browse the database        | `npm run db:studio`                                                                            |
| Change the schema          | edit `server/prisma/schema.prisma`, then `npm run db:migrate -w server -- --name what_changed` |
| Wipe and re-seed           | `npm run db:reset`                                                                             |
| Stop the database          | `npm run db:down` (data is kept in a Docker volume)                                            |
| Add a dependency           | `npm install <pkg> -w client` (or `-w server`, `-w packages/shared`)                           |

---

## 4. Where things live

| I want to…                     | Go to                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| Edit lesson text               | `client/src/content/lessons/*.md` (+ `index.json` for parts)                          |
| Add or fix a quiz question     | `client/src/content/quizzes/module-N.json` (schema: `packages/shared/src/content.ts`) |
| Change narration sentences     | `client/src/content/narration.json`                                                   |
| Add a visualiser example       | `client/src/content/presets.json`                                                     |
| Change colours, fonts, shadows | `client/src/styles/tokens.css` (names match the Figma variables)                      |
| Change a screen                | `client/src/pages/*Page.tsx`                                                          |
| Change the algorithm           | `packages/btree-engine/src/{search,insert,delete}.ts`                                 |
| Change scoring or leaf rewards | `packages/shared/src/{scoring,constants}.ts`                                          |
| Add an API route               | `server/src/routes/*.ts` + schema in `packages/shared/src/api.ts`                     |

---

## 5. Environment variables (`server/.env`)

| Variable       | Default                                                       | Notes                            |
| -------------- | ------------------------------------------------------------- | -------------------------------- |
| `DATABASE_URL` | `postgresql://btree:btree@localhost:5432/btree?schema=public` | Matches `docker-compose.yml`     |
| `JWT_SECRET`   | generated by `npm run setup`                                  | ≥ 32 characters; never commit it |
| `PORT`         | `4000`                                                        |                                  |
| `CORS_ORIGIN`  | `http://localhost:5173`                                       | Comma-separated list             |
| `NODE_ENV`     | `development`                                                 |                                  |

`.env` files are git-ignored. Only `.env.example` is committed.

---

## Using a local PostgreSQL instead

If you do not want Docker, install PostgreSQL 16 (`brew install postgresql@16`, or `sudo apt install postgresql` on WSL), then:

```bash
createuser -s btree && psql -c "ALTER USER btree PASSWORD 'btree';" && createdb -O btree btree
```

Keep the `DATABASE_URL` in `server/.env` as it is, then run `npm run db:migrate`.

---

## Troubleshooting

| Symptom                                             | Fix                                                                                                         |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `Invalid environment variables` when the API starts | Run `npm run setup`, or check `server/.env` against `.env.example`.                                         |
| `Can't reach database server at localhost:5432`     | Start Docker Desktop, then `npm run db:up`. Check with `docker ps`.                                         |
| Port 5432 / 4000 / 5173 already in use              | Stop the other process (`lsof -i :5432` on macOS/WSL), or change the port in `docker-compose.yml` / `.env`. |
| `Cannot find module '../generated/prisma/client'`   | `npm run db:generate -w server` (runs automatically on `npm install`).                                      |
| Hot reload not working on Windows                   | The repo is under `/mnt/c`. Move it to `~/` inside WSL.                                                     |
| Every file shows as changed on Windows              | `git config --global core.autocrlf input`, then `git checkout -- .`                                         |
| `EACCES` errors from npm on WSL/Linux               | Do not use `sudo npm`. Install Node with nvm (see above).                                                   |
| Playwright says the browser is missing              | `cd client && npx playwright install --with-deps chromium`                                                  |
| Stuck in an old guest session                       | Guest progress is in _sessionStorage_: close the tab or clear site data.                                    |
| `npm audit` shows moderate `minimatch` warnings     | Known, dev-only (ESLint's TypeScript parser). It does not ship to users. See CHANGELOG.                     |
