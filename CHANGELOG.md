# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- **Design tokens now match Figma exactly.** Read through the Figma integration once file access was granted (Screens page, Day and Dusk frames).
  - Fonts: display text is **Sniglet ExtraBold** (H1 50px, H2 28px, H3 21px, buttons 18px). Body text is **Atkinson Hyperlegible** (body 17px, labels 15px, small 13.5px). Both are self-hosted through Fontsource. Bagel Fat One and Nunito are removed.
  - Colours: tokens are renamed to the Figma variable names (`--paper`, `--paper-back`, `--leaf`, `--leaf-dark`, `--highlight`, `--branch`, `--ink`, `--ink-muted`, `--sky-100`, `--sky-200`, …) with exact Day and Dusk values. Tailwind classes follow the same names (`bg-surface` is now `bg-paper`, `bg-primary` is `bg-leaf`, `bg-accent` is `bg-highlight`, `text-muted` is `text-ink-muted`, and so on).
  - Shadows: hard offset with no blur. `shadow-paper-stack` (6/7), `shadow-paper-stack-sm` (3/4), `shadow-press-leaf` (3/4), `shadow-lift` (2/3).
  - Radius: `rounded-sm` 6px, `rounded-md` 10px, `rounded-lg` 12px, `rounded-pill` 999px.
  - Everything lives in `client/src/styles/tokens.css`. Tailwind's default colour, type, radius and shadow scales are cleared, so only Figma values can be used.
  - Hard-coded wood and cloud colours in the grove SVGs, and the favicon colours, now use the tokens.
- **Each question pays leaves only once**, for its first correct answer (+10 on the first try, +5 after a retry or hint). Retakes pay nothing, but they still count toward mastery. Each hint pays +5 once per question and hint. The client's leaf count follows the same rules.
- **The server checks `firstAttempt` and `hintsUsed` itself** instead of trusting the client:
  - A new answer to a question still counts as a retry if the last answer to it was wrong and less than 30 minutes ago.
  - Any hint the server recorded for the question counts, even if the client reports none.
  - `POST /api/hints` now requires `{ itemId, hint }` and records each hint shown (new `HintView` table).
  - Limit: the server holds no answer keys, so a student who writes their own API requests can still fake a correct answer. The check only stops replaying an answer after a hint or a wrong try.
- **Streak days follow South African time** (`Africa/Johannesburg`) instead of UTC, so practice just after midnight counts for the right day.
- **Multiple-choice options are shuffled** once per page load. Before, 33 of the 34 questions had the correct answer first. The order stays fixed during a retry.

### Added

- **Grove art from Figma** (09 My grove, the Components page and the Dusk frames), replacing the placeholder SVG.
  - Scene: sky, sun, clouds and three hills redrawn from the Figma "Grove scene". In Dusk the sun becomes a moon and fireflies appear, using Figma's own tokens (transparent in Day), so no theme check is needed.
  - Tree: Seed, Sprout and Shrub are the Figma stage icons, scaled up on a soil mound. Sapling is the Figma scene tree exactly. Young tree and Full tree are the same tree, grown larger with extra canopy.
  - "How it grows": the six Figma stage icons. Past stages are filled, the current one is highlighted, and future ones are dashed outlines, as in Figma.
  - Decorations: the nine Figma `DecoIcon` icons in the craft drawer and on a friend's grove. In the scene, apples, blossoms, bunting, songbird and swing hang where Figma places them; lanterns, fairy lights, bird box and butterflies use the Figma icons in new positions.
  - Craft drawer tiles follow the Figma `DecorationTile` states (owned, buy, locked).
- **Decoration unlock stages** (`minStage` in `@btree/shared`). The tree swing needs a young tree, butterflies a sprout, and everything else a sapling. Locked decorations show as dashed tiles, and the swing's spot shows as a dashed outline with a "Swing spot · young tree" tag, as in the mockup. The API refuses to sell a decoration before its stage (409), with a test.
- Illustration colour tokens `--apple`, `--blossom`, `--coral` and `--bunting-blue`, with Day and Dusk values from Figma.
- **Server tests for the grove and friends routes** (`server/test/grove.test.ts`, `server/test/friends.test.ts`), 25 Supertest cases against Postgres:
  - Grove: leaves, the decoration catalogue, purchases (404, 409, 400, 201), placement and lecture questions.
  - Friends: friend requests, the friends list, friend groves and cheers.
  - Privacy: a friend's grove and the friends list expose only the `FriendGrove` and `FriendSummary` fields. No scores, hints, leaves, answers or email addresses appear, even when the friend has all of them.
- Shared test helpers (`server/test/helpers.ts`). Students are created directly in the database with a session cookie, so the tests never hit the login rate limit.
- **3-day streak bonus (+15)**, paid once per streak. A streak that breaks and is rebuilt pays again.
- **Ready-check bonus (+60)**, paid once when 7 of the 8 ready-check questions (80%) are right on the first try without hints.
- `GET /api/streak` returns the student's current streak as `{ days }`.
- `POST /api/attempts` also returns `bonuses`, the streak and ready-check bonuses that answer earned.
- Payouts can be made once-only: a nullable `dedupeKey` on `LeafTransaction`, unique per user (migration `leaf_dedupe_key`).
- Tests: `days.test.ts`, `rewards.test.ts` and `attempts.test.ts` on the server; `progressStore.test.ts`, `QuestionCard.test.tsx` and `shuffle.test.ts` on the client; a check that the ready-check question ids match `READY_CHECK_ITEM_IDS`.
- **Badges**, awarded by the server and kept for good:
  - **Explorer:** the warm-up is done and module 1 is complete.
  - **Splitter:** the three latest answers on splitting a node (O5) are all correct.
  - **Root Raiser:** splits that reach the root (O6) are mastered.
  - **Lecture Ready:** the ready check is passed, with 7 of 8 right on the first try without hints.
  - Badges are checked after saving progress, answering a question and finishing the warm-up. Each is awarded once, even if two requests arrive at the same moment.
  - New `UserBadge` table, deleted along with the user (migration `badges`). The badge list (`BADGES`) and the `Badge` schema are in `@btree/shared`.
  - Friends never see each other's badges.
- `GET /api/badges` returns all four badges in order, with `awardedAt`, or null while a badge is locked.
- Tests: `badges.test.ts` (13 cases), and a privacy test that a friend's grove has no badges.
- **Friend request lifecycle:**
  - `POST /api/friends/requests/:id/decline`: the student who received a pending request declines it.
  - `DELETE /api/friends/requests/:id`: the student who sent a pending request cancels it.
  - `DELETE /api/friends/:id`: either friend ends the friendship. Afterwards neither can see the other's grove or cheer them, but cheers already sent stay in the history.
  - `GET /api/friends` also returns `outgoing`, the pending requests the student sent, with the email they typed. The response type is `FriendsList` in `@btree/shared`.
- **Per-student rate limits:** 10 friend requests and 20 cheers per hour. Limits count per student, not per IP address, so a class on one network doesn't share them. Going over returns 429 with "Slow down a little and try again later".
- Tests: 11 request-lifecycle cases in `friends.test.ts`, and `rateLimit.test.ts` (3 cases).
- **Data export (POPIA right of access):** `GET /api/account/export` downloads everything the app stores about the student as `btree-basic-data-<date>.json`:
  - their account details;
  - progress, attempts, mastery, leaves, decorations, lecture questions, warm-ups, hints and badges;
  - friendships and cheers, which show other students by display name only.
  - The file never includes the password hash, any user id, or another student's email or answers. It sits alongside the existing account deletion.
- Tests: `account.test.ts` (3 cases).

### Fixed

- **"Tap the nodes" questions can now be answered.** `QuestionCard` had no answer controls for `trace-path` questions, so tapping did nothing and Next stayed disabled. This blocked the module 3 and 5 quizzes and the ready check. Students now tap the path, then press Check or Clear.
- Completing a module in two requests at the same moment paid the +30 lesson leaves twice.
- `POST /api/hints` paid +5 on every call, so leaves could be farmed without limit.
- **Friend requests that cross now make the two students friends.** Before, if B had already asked A and A then asked B, a second pending request was created. A request between students who are already friends now does nothing.

### Content

- **Definitions follow Knuth's order m** (the largest number of children), as COS212 uses, aligned with the ACM/IEEE CS2023 curriculum's balanced-tree topics. The rules lesson now states the complete definition: the root's minimum, the child-count rule and the key ranges. It includes an order 3, 4 and 5 table and a note on the "minimum degree" definition some textbooks use instead.
- **New module 7, "Deleting a key"** (objective O8, _Delete a key and repair an underflow_), in five parts: leaf, internal key (predecessor), borrow, merge with root shrink, and a check. It matches the engine exactly. Former modules 7–9 are now 8–10, so there are 10 modules. Full tree now needs all 10. Module counts in the UI come from `MODULES`.
- **Quiz banks for every module** (1–10, 47 items; 42 new) with three-tier hints and misconception-tagged distractors. The ready check (module 10) asks one question per objective, O1–O8.
- **Corrections to existing lessons**, only where needed:
  - Search now covers keys before the first key and after the last.
  - The split lesson says which middle key moves up when m is even.
  - The height lesson gives the worst-case bound and corrects "3 levels" to about 4 for a million keys at m = 100.
  - The BST depth claim now says "even perfectly balanced".
  - The B+ tree is explained, and the file system examples are corrected.
- **Watch tab** for every lesson part that has a tree, with new `delete-leaf`, `delete-internal` and `wide-order-7` presets.
- `/quiz` opens the student's current module, and "Practise with new keys" after a low score now leads to the practice for that module.
- **Content tests** (`client/src/content/content.test.ts`) recompute every tree-based answer with the engine: search paths, promoted keys, the broken rule, and insert and delete results. They also check that every module has a lesson and a quiz.
- Narration and warm-up were reviewed and are accurate, so they are unchanged.

### To do (next iterations)

- Pixel pass of each screen against its Figma frame (layout and spacing; tokens are done).
- Practice activity 4, **Build the tree** (objective O6), is a stub.
- The ID lead should review the new lessons and quiz items (see the prompt log, Entry 004).
- The client doesn't show badges yet. The server awards them and `GET /api/badges` lists them.
- The client has no decline, cancel or unfriend buttons yet, no "Download my data" link, and doesn't show the 429 message. The server endpoints are ready.
- The client doesn't show reward bonuses (streak +15, ready check +60) until the page reloads, and the streak card doesn't use `GET /api/streak` yet.
- Deployment (Vercel for the client, Render for the API and database) is not configured.

## [0.1.0] - 2026-11-09

Initial scaffold of the full stack.

### Added

- **Monorepo** on npm workspaces: `client`, `server`, `packages/btree-engine` and `packages/shared`. Strict TypeScript base config, ESLint 9 flat config (typescript-eslint, react-hooks, jsx-a11y), Prettier with the Tailwind plugin, EditorConfig, LF line endings enforced through `.gitattributes`, and recommended VS Code settings and extensions.
- **B-tree engine** (`@btree/engine`): pure TypeScript search, bottom-up insertion (split at m keys, median promotion, root growth) and deletion (predecessor replacement, borrow, merge, root shrink) for orders 3 to 7. Each operation returns an immutable step trace with snapshots, pseudocode line numbers (Plain and Java, aligned) and narration keys. Also includes `validate()` for every B-tree rule, `fromSpec`/`toSpec` helpers, and a seeded random tree generator.
- **Engine tests:** 16 worked-example unit tests and 3 fast-check property suites, which check that the tree stays valid and sorted after random insert and delete sequences for every order.
- **Shared package** (`@btree/shared`): Zod 4 schemas for every API body and content file, learning objectives O1–O7, the 9 modules (now O1–O8 and 10 modules; see Unreleased), leaf rewards, growth stages, the decoration catalogue, and the readiness and mastery scoring (only first-attempt, no-hint answers count; ready at 80%, remediation below 60%).
- **API server** (Express 5): register, login, logout, session, me and account deletion; progress, quiz attempts, hints, mastery, readiness and warm-up; leaves ledger, decorations shop, grove placement and lecture questions; friends, friend requests, friend grove (visit-only, private scores) and cheers. Security: bcrypt (bcryptjs, 12 rounds), JWT in an httpOnly SameSite=Lax cookie, helmet, CORS allow-list, rate limiting on auth routes, Zod validation on every body, and pino logs with cookies redacted.
- **Database:** Prisma 7 schema for PostgreSQL 16 (users, module progress, attempts, mastery, leaf transactions, decorations, lecture questions, warm-up results, friendships, cheers), with cascade deletes for POPIA-compliant account removal, the initial migration, and an idempotent seed with demo users that match the mockups.
- **Server tests:** Supertest for health, validation, auth guard, 404s, the guest session, and a full register → progress → attempts → login → delete flow against Postgres.
- **Client** (React 18, Vite 8, Tailwind 4): all ten screens from the Figma file and the ID document, in Day and Dusk themes. Welcome, Warm-up, Lessons hub, Lesson (Read/Watch/Listen), Visualiser, Practice, Quiz with tiered hints, Ready for lecture, My grove, Friend's grove, plus Sign in, Register, Account and 404.
- **Visualiser:** insert, search and delete on any order from 3 to 7. Includes presets, a random tree, "Cut out a BST too", the golden-yarn search path, callouts, play/pause/step/back/restart, speed control, the highlighted pseudocode panel (Plain/Java), the Steps panel and spoken narration.
- **Practice:** engine-generated items for _Predict the search path_, _Where does it go?_, _Split it yourself_ (drag-and-drop or tap-to-place, keyboard accessible) and _Valid or not?_.
- **Assessment:** misconception-tagged distractors, a three-tier hint ladder (Hint 3 unlocks after another try), a confidence picker, and a remediation route below 60%.
- **Guest mode:** progress is kept in sessionStorage. Signed-in progress is saved to the API and restored on sign-in. The app stays fully usable when the API is down.
- **Accessibility:** skip link, keyboard-operable tree nodes, colour never the only cue, `prefers-reduced-motion` respected, and print styles for "Save as PDF".
- **Client tests:** Vitest and React Testing Library (answer marking, step-to-view mapping, routing and offline visualiser), plus Playwright smoke tests with axe WCAG 2.1 AA checks on desktop and mobile.
- **Tooling:** `docker-compose.yml` (PostgreSQL 16), the cross-platform `npm run setup` script, a GitHub Actions CI workflow (format, lint, typecheck, migrate, test, build, e2e), and route-level code splitting.
- **Documentation:** README, local development guide for macOS and Windows/WSL, this changelog, and the prompt log.

### Notes

- Figma could not be read via the Figma MCP integration (no edit access on the file), so the UI was built from the screenshots the team supplied.
- React is pinned to 18.3 (per SE doc §5.2) through root `overrides`, so peer dependencies do not pull in React 19.
- `npm audit` reports 7 moderate advisories in `minimatch`, through `typescript-eslint`. They affect only the lint tooling, not shipped code. The only available fix is a major version that typescript-eslint does not support yet.
