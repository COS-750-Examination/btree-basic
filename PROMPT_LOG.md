# Prompt Log

This log records the generative AI prompts used during development of B-Tree Basic, in line with the module's GenAI acknowledgement requirements. Each entry gives the request as issued, the decisions made in response, and the resulting deliverables, so that AI-assisted work can be traced and reviewed.

---

## Entry 001: Project scaffold (front end and back end)

| Field        | Detail                                                               |
| ------------ | -------------------------------------------------------------------- |
| Date         | 9 November 2026                                                      |
| Requested by | Lonwabo Kwitshana, on behalf of the seven-member COS750 project team |
| Tool         | Claude Code (Anthropic), model Claude Opus 5.5                       |
| Scope        | Repository scaffold, documentation and onboarding material           |
| Status       | Completed; changes left uncommitted for team review                  |

### Request

> Please plan, and then implement, the initial scaffold of the front end and back end for our COS750 group project, a pre-lecture B-tree tutor for COS212 students.
>
> Use the attached Instructional Design document and Software Engineering document as the authoritative specification for learners, objectives, screens, assessment strategy, functional and non-functional requirements, and system architecture. Use the team's Figma file (COS750_GroupProject) as the visual reference for the intended front end, and use it to inform the choice of frameworks, libraries and plug-ins.
>
> On completion, please provide:
>
> 1. a changelog;
> 2. a local development guide; and
> 3. a concise but comprehensive README,
>
> so that any team member on macOS or on Windows (via WSL) can onboard with minimal effort.
>
> Please record this instruction formally in a prompt log. Under no circumstances should any changes be committed to the repository.

### Clarifications provided during planning

| Question raised                                                                                                                     | Decision                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The ID document limits the algorithm to insertion, while the SE document lists search, insertion and deletion. Which scope applies? | Implement **search, insertion and deletion**, as in SE document FR2.                                                                                          |
| Which package manager and monorepo approach?                                                                                        | **npm workspaces**, since it needs no extra tooling for the team.                                                                                             |
| Which styling approach?                                                                                                             | **Tailwind CSS v4**, with design tokens for the Day and Dusk themes.                                                                                          |
| The Figma file could not be read through the Figma integration (no edit access). How should the work proceed?                       | Screenshots of all ten screens (Day and Dusk) were supplied and used as the visual reference. Exact Figma variables are to be applied once access is granted. |

### Approach

1. **Plan:** reviewed both documents and the screenshots, confirmed open questions with the requester, and agreed a written implementation plan before any code was written.
2. **Implement:** built the shared contracts first, then the B-tree engine with tests, then the API and database, then the client screens. Faithfulness to the specification came first (SE doc §5 architecture, ID doc screens 01–10, objectives O1–O7, the assessment rules).
3. **Verify:** ran linting, type checking, unit, property, API and end-to-end tests, ran automated WCAG 2.1 AA checks in both themes, checked for horizontal overflow at 360 px, and reviewed screenshots against the mockups.

### Deliverables

- npm-workspaces monorepo: `client` (React 18, Vite, Tailwind CSS), `server` (Express 5, Prisma 7, PostgreSQL 16), `packages/btree-engine`, `packages/shared`.
- A B-tree engine producing step traces for search, insert and delete, with property-based tests.
- A REST API covering accounts, progress, mastery, readiness, leaves, decorations, lecture questions and friends.
- All ten screens from the design, in Day and Dusk themes, with guest mode and offline-tolerant behaviour.
- A CI workflow, Docker Compose database, and a cross-platform setup script.
- `README.md`, `docs/LOCAL_DEV.md`, `CHANGELOG.md` and this log.

### Verification summary

| Check                                                            | Result       |
| ---------------------------------------------------------------- | ------------ |
| ESLint, TypeScript (strict), Prettier                            | Pass         |
| Engine tests (unit and property-based)                           | 19 / 19 pass |
| Server tests (including database flow)                           | 11 / 11 pass |
| Client unit tests                                                | 10 / 10 pass |
| Playwright end-to-end and axe accessibility (desktop and mobile) | 22 / 22 pass |
| Production build (client and server)                             | Pass         |

### Human review required

- The lesson copy and quiz items are first drafts, for the Instructional Design lead to review.
- The design tokens are approximations from screenshots and must be reconciled with Figma.
- Items listed under _Unreleased → To do_ in `CHANGELOG.md` remain open.

---

## Entry 002: Align design tokens with the Figma specification

| Field        | Detail                                                             |
| ------------ | ------------------------------------------------------------------ |
| Date         | 10 November 2026                                                   |
| Requested by | Lonwabo Kwitshana, on behalf of the COS750 project team            |
| Tool         | Claude Code (Anthropic), model Claude Opus 5.5, with the Figma MCP |
| Scope        | `client/src/styles`, client components and pages, favicon, docs    |
| Status       | Completed; left uncommitted for team review                        |

### Request

> Once Figma access had been confirmed, the following was requested:
>
> Please update the application's design tokens and styles so that they match the Figma specification exactly, replacing the approximations made from screenshots.
>
> 1. **Fonts:** replace the display font with Sniglet ExtraBold (H1 50 px, H2 28 px, H3 21 px, button text 18 px) and the body font with Atkinson Hyperlegible (body 17 px, labels 15 px, small text 13.5 px). Load both through the project's existing font setup, give each a sensible fallback stack, and remove the previous fonts once nothing references them.
> 2. **Colours:** define named tokens for `--paper`, `--paper-back`, `--leaf`, `--leaf-dark`, `--highlight` and `--branch`, and replace every hard-coded occurrence of the previous values throughout the codebase.
> 3. **Shadows:** define hard offset shadow tokens with no blur or spread (card stack 6/7 px, small stack 3/4 px, button press 3/4 px, lift 2/3 px) and apply them in place of the approximate shadows.
> 4. **Corner radius:** define radius tokens (6, 10, 12 and 999 px) and map each existing radius to the nearest one.
>
> Please audit the codebase first, centralise all values in tokens, update the components, verify the build and lint checks, confirm by search that no old values remain, and summarise any mapping decisions that were uncertain. Thereafter, record the work in this log and the changelog, and update the to-do list.

### Approach

1. **Audit:** located the tokens (`tokens.css`, `index.css`, `main.tsx`) and listed every use of the previous fonts, colours, shadows and radii.
2. **Source of truth:** read the Figma variables directly for the Day and Dusk frames, so the Dusk theme also received exact values.
3. **Centralise:** moved every colour, type size, shadow and radius into `client/src/styles/tokens.css`, using the Figma variable names, and cleared Tailwind's default scales so that only design-system values can be used.
4. **Apply:** renamed utility classes and CSS variables across all components with a single scripted pass, then fixed the remaining cases by hand.
5. **Verify:** ran the checks below, compared a rendered screen against the Figma frame, and searched the repository for the previous values.

### Mapping decisions

| Item                                                         | Decision                                                                                                                                                               |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Radius `rounded-lg` (8 px), equidistant from 6 and 10 px     | Mapped to `rounded-md` (10 px). The others map directly: 4 px and 6 px to `sm`, 12 px to `lg`, full to `pill`.                                                         |
| Previous text sizes                                          | Mapped to the nearest Figma style: 12 px to small, 14 px bold to label, 14 px regular to small, 16 to 18 px to body, 20 to 24 px to heading, 30 to 36 px to display-l. |
| Page titles on narrow screens                                | Display-l (28 px) on mobile and display-xl (50 px) from the `sm` breakpoint up, to avoid overflow at 360 px.                                                           |
| Shadow under highlight (yellow) buttons                      | Not defined in Figma. Given the button-press geometry (3/4 px) with an app token, `--highlight-dark`.                                                                  |
| Additional Figma colours (sky, ink, hills, sun, cloud, Dusk) | Applied as well, since the aim was an exact match.                                                                                                                     |
| Decoration art colours (apples, blossoms, bluebird)          | Left as illustration colours; they are not design-system tokens.                                                                                                       |

### Verification summary

| Check                                               | Result                                     |
| --------------------------------------------------- | ------------------------------------------ |
| ESLint, TypeScript (strict), Prettier               | Pass                                       |
| Client unit tests                                   | 10 / 10 pass                               |
| Playwright end-to-end and axe accessibility         | 22 / 22 pass                               |
| Client production build                             | Pass; all new utilities present in the CSS |
| Repository search for previous hex values and fonts | No matches                                 |

### Human review required

- Screen layout and spacing have not yet received a pixel-level comparison with each Figma frame (tracked in `docs/TODO.md`).
- The team should confirm the highlight-button shadow, which has no Figma equivalent.

---

## Entry 003: Grove illustrations from the Figma design

| Field        | Detail                                                                 |
| ------------ | ---------------------------------------------------------------------- |
| Date         | 11 November 2026                                                       |
| Requested by | Lonwabo Kwitshana, on behalf of the COS750 project team                |
| Tool         | Claude Code (Anthropic), model Claude Opus 5.5, with the Figma MCP     |
| Scope        | `client/src/components/grove`, grove pages, `@btree/shared`, grove API |
| Status       | Completed; left uncommitted for team review                            |

### Request

> Please complete the outstanding item in `docs/TODO.md`: replace the placeholder grove art (the six growth stages and the nine decorations) with the artwork from the team's Figma design.

### Approach

1. **Source:** exported the vector artwork from Figma as SVG: the grove scene in Day and Dusk, the "How it grows" stage icons, and the nine decoration icon components. Every colour was then mapped to a design token, so the art follows the Day and Dusk themes.
2. **Interpretation:** the mockup shows a sapling with the full scene tree, and a dashed "Swing spot · young tree". This was read as the rule that decorations unlock by growth stage.
3. **Build:** the scene backdrop and the tree share Figma's 832×480 frame, so they line up at any size. The stage icons, decoration icons and the craft drawer tiles follow the Figma components.
4. **Rule enforcement:** added decoration unlock stages to the shared package, used them in the client, and enforced them in the API.

### Design decisions

| Item                                                 | Decision                                                                                                                                  |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Young tree and Full tree have no filled art in Figma | Filled versions reuse the exact Figma outline geometry with the Sapling's colours. In the scene, the tree grows larger with extra canopy. |
| Decorations not placed in the Figma scene            | Lanterns, fairy lights, bird box and butterflies use the Figma icons, positioned to suit the tree.                                        |
| Unlock stages                                        | Swing at Young tree (from the mockup), butterflies at Sprout, all others at Sapling (the mockup shows four of them owned at Sapling).     |
| Illustration colours                                 | Added `--apple`, `--blossom`, `--coral` and `--bunting-blue`, taking the Day and Dusk values from the Figma frames.                       |

### Verification summary

| Check                                          | Result                                    |
| ---------------------------------------------- | ----------------------------------------- |
| ESLint, TypeScript (strict), Prettier          | Pass                                      |
| Engine, client and server unit tests           | 19, 10 and 12 pass (new unlock-rule test) |
| Playwright end-to-end and axe accessibility    | 22 / 22 pass                              |
| Visual check of all six stages in Day and Dusk | Matches the Figma scene and stage strip   |

### Human review required

- The design lead should confirm the art for Young tree and Full tree, and the positions of the four decorations Figma does not place.
- The team should confirm the unlock stage for each decoration.

---

## Entry 004: Lesson and assessment content

| Field        | Detail                                                                 |
| ------------ | ---------------------------------------------------------------------- |
| Date         | 11 November 2026                                                       |
| Requested by | Lonwabo Kwitshana, on behalf of the COS750 project team                |
| Tool         | Claude Code (Anthropic), model Claude Opus 5.5                         |
| Scope        | `client/src/content`, `@btree/shared` (objectives, modules), Quiz page |
| Status       | Completed; left uncommitted for team review                            |

### Request

> Please implement the outstanding content items in `docs/TODO.md`, revising the existing content only where necessary. All definitions should be consistent with the B-tree treatment in the ACM/IEEE CS2023 curriculum.

### Clarifications provided

| Question raised                                                                                                                        | Decision                                                                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "CS2023" could mean the ACM/IEEE curriculum, the 2023 COS212 notes, or a textbook. Textbooks define the order of a B-tree differently. | The **ACM/IEEE CS2023 curriculum**. It lists B-trees as a topic without a formal definition, so the content keeps Knuth's order m (largest number of children), as used in COS212 and the engine. |
| Where should the deletion lesson go?                                                                                                   | A **new module after module 6**, renumbering the later modules.                                                                                                                                   |

### Approach

1. **Review:** checked every lesson, the quiz, the narration and the warm-up against the definition and the engine's behaviour. Text was changed only where it was incomplete or inaccurate.
2. **Restructure:** added module 7, "Deleting a key", and objective O8. The later modules moved to 8–10, and hard-coded module counts were replaced with values derived from the module list.
3. **Write:** produced the deletion lesson, quiz banks for every module, and a ready check with one question per objective.
4. **Verify:** added automated tests that recompute every tree-based answer with the B-tree engine.

### Deliverables

- Corrected lessons:
  - **Rules:** now give the complete definition, with the root's minimum, the child-count rule and the key ranges.
  - **Search:** now covers keys outside a node's range.
  - **Split:** now states which middle key is promoted when m is even.
  - **Height:** now gives the worst-case bound and corrects a level count.
  - **Real world:** now explains the B+ tree.
- The deletion module in five parts, following the engine: predecessor replacement, borrowing from the left sibling first, then merging, and shrinking the root.
- 42 new quiz items across nine quiz files. Each has three tiered hints and misconception-tagged distractors.
- Watch-tab presets for every lesson part that has a tree.

### Verification summary

| Check                                                            | Result             |
| ---------------------------------------------------------------- | ------------------ |
| Content tests (engine-checked answers, coverage, item integrity) | 18 / 18 pass       |
| Engine, client and server unit tests                             | 19, 28 and 12 pass |
| Playwright end-to-end and axe accessibility                      | 22 / 22 pass       |
| ESLint, TypeScript (strict), Prettier, production build          | Pass               |

### Human review required

- **Assessment design (ID lead):** O8 now counts toward the 80% readiness threshold. Confirm that deletion should be assessed before the lecture.
- **Full tree threshold:** the Full tree stage now needs 10 modules.
- **Wording:** the lesson copy and quiz wording should be reviewed by the ID lead.
- **Stored progress:** existing guest or seeded progress uses the old module numbers.

---

## Entry 005: Backend implementation plan

| Field        | Detail                                         |
| ------------ | ---------------------------------------------- |
| Date         | 13 November 2026                               |
| Requested by | Kyle Liebenberg, backend owner                 |
| Tool         | Claude Code (Anthropic), model Claude Opus 5.5 |
| Scope        | `docs/BACKEND_PLAN.md` (new)                   |
| Status       | Completed; plan left uncommitted for review    |

### Request

> Please review the codebase to gain an understanding of the project, a web application that teaches B-trees to second-year computer science students before their B-tree lecture. Several items remain outstanding in `docs/TODO.md`, and I am responsible for the Backend section. Please review what remains on the to-do list and produce an ordered plan for implementing all of it.

### Clarifications provided

The first draft was reviewed against the COS750 Examination Specification. The team judged it too heavy for a prototype, and these changes were made:

| Question raised                                         | Decision                                                                                                                |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Should password reset by email be supported?            | **No.** Out of scope for the prototype.                                                                                 |
| Should the production database be backed up?            | **No.** Out of scope for the prototype.                                                                                 |
| Where should deployment sit in the plan?                | **Last, and optional.** The demonstration can run locally.                                                              |
| Cross-site cookies or one shared domain for deployment? | No separate decision needed. The optional deployment task uses a Vercel rewrite (one origin).                           |
| Badge rules (Explorer, Splitter, Root Raiser)?          | Use the proposed rules: warm-up plus module 1, three correct O5 answers in a row, O6 mastered.                          |
| Should sessions be made revocable?                      | **No.** The 14-day JWT cookie is acceptable for a prototype.                                                            |
| How should the work be delivered?                       | **One branch and pull request per task**, with related sub-tasks grouped as commits, and one prompt log entry per task. |

### Deliverables

- `docs/BACKEND_PLAN.md`, with six tasks, each on its own branch:
  1. Test coverage.
  2. Rewards: idempotent leaf payouts, a 3-day streak bonus, server-side checks of first attempts and hints, and a ready-check bonus.
  3. Badges.
  4. Friends and privacy: decline, cancel and unfriend; rate limits; data export.
  5. Account settings.
  6. Optional deployment.
- Each task lists:
  - its files;
  - the function signatures it introduces;
  - named tests with their expected results;
  - commits;
  - a pre-merge checklist (TODO, CHANGELOG, prompt log).
- Backend work that needs client changes is marked `frontend change required` and summarised in a hand-off table.
- Five risks found in the existing code are listed under Review Focus, each with the test that addresses it:
  - lesson leaves paid twice on parallel requests;
  - unlimited leaves from `POST /hints`;
  - streak days counted in UTC rather than South African time;
  - crossing friend requests;
  - rate limits behind proxies (deployment only).

### Verification summary

| Check                                                 | Result                                 |
| ----------------------------------------------------- | -------------------------------------- |
| Every Backend item in `docs/TODO.md` mapped to a task | Done, or marked "won't do (prototype)" |
| Prettier on the plan                                  | Pass                                   |

### Human review required

- **Badge rules (ID lead):** confirm the proposed rules for Explorer, Splitter and Root Raiser.
- **Answer integrity:** the server holds no answer keys, so the server-side check only stops a replayed answer, not a hand-crafted request.

---

## Entry 006: Backend test scaffolding (BACKEND_PLAN Task 1)

| Field        | Detail                                                                               |
| ------------ | ------------------------------------------------------------------------------------ |
| Date         | 13 November 2026                                                                     |
| Requested by | Kyle Liebenberg, backend owner                                                       |
| Tool         | Claude Code (Anthropic), model Claude Opus 5.5                                       |
| Scope        | `server/test/helpers.ts`, `server/test/grove.test.ts`, `server/test/friends.test.ts` |
| Status       | Completed; left uncommitted on branch `test/backend-coverage` for review             |

### Request

> Please refer to Task 1 in `docs/BACKEND_PLAN.md` and create all the necessary files (`helpers.ts`, `grove.test.ts` and `friends.test.ts`), together with the test signatures. The test bodies are to be left empty, as I will implement them myself.

### Clarifications provided

None were needed. The shared helpers are implemented in full, since every test depends on them. Only the test bodies are left empty.

### Deliverables

- `server/test/helpers.ts`:
  - `hasDb`, `makeApp`, `getPrisma` and `closeDb`.
  - `student`: creates a signed-in student directly in the database, which avoids the IP-based auth rate limit.
  - `befriend`, `removeStudents`, `ensureCatalogue`, `giveLeaves` and `completeModules`.
  - Source modules are imported lazily, so test runs without a database still work.
- `server/test/grove.test.ts`: 13 empty tests covering leaves, the decoration catalogue, purchases, placement and lecture questions. Set-up and clean-up of two students are included.
- `server/test/friends.test.ts`: 12 empty tests covering friend requests, the friends list, friend groves, cheers and privacy. Set-up and clean-up of two friends-to-be and a stranger are included.

### Verification summary

| Check                                                  | Result                                        |
| ------------------------------------------------------ | --------------------------------------------- |
| Server tests against local PostgreSQL                  | 37 / 37 pass (25 new tests with empty bodies) |
| Test users left in the database after the run          | 0                                             |
| ESLint, TypeScript (strict), Prettier on the new files | Pass                                          |

### Human review required

- **Empty tests pass:** a test with an empty body reports as passing, so the 25 new tests show green until they are written. Fill them in before merging.
- **Placeholder password:** students made with `student()` cannot log in with a password. Tests that need password login must register through `/api/auth/register` instead.

---

## Entry 007: Rewards scaffolding (BACKEND_PLAN Task 2)

| Field        | Detail                                                                                  |
| ------------ | --------------------------------------------------------------------------------------- |
| Date         | 13 November 2026                                                                        |
| Requested by | Kyle Liebenberg, backend owner                                                          |
| Tool         | Claude Code (Anthropic), model Claude Opus 5.5                                          |
| Scope        | Prisma schema and migrations, `@btree/shared`, `server/src/lib`, progress routes, tests |
| Status       | Completed; left uncommitted on branch `feat/rewards` for review                         |

### Request

> Please implement the scaffolding for Task 2 (rewards). All files are to be created and all method signatures defined; I will implement the method bodies myself.

### Clarifications provided

None were asked. The request was interpreted as follows:

- **Declarations in full:** constants, Zod schemas and Prisma models declare what Task 2 uses rather than how it works, so they are defined in full and the migrations are applied.
- **Bodies left empty:** new functions throw `Not implemented`, and tests have empty bodies, as in Task 1.
- **Existing behaviour kept:** `awardLeaves`, `streakDays` and the existing routes keep working unchanged. Their new parameters and the changes still to make are marked with `TODO(Task 2.x)` comments.

### Deliverables

- **Database:**
  - migration `leaf_dedupe_key`: `LeafTransaction.dedupeKey`, unique with `userId`;
  - migration `hint_views`: a new `HintView` table, cascading on user deletion;
  - the regenerated Prisma client.
- **`@btree/shared`:**
  - constants `DAY_TIMEZONE`, `STREAK_BONUS_DAYS`, `RUN_GAP_MINUTES`, `READY_CHECK_ITEM_IDS` and `READY_CHECK_PASS`;
  - schemas `HintBody`, `LeafBonus`, `AttemptResult` and `StreakSummary`.
- **New server modules (stubs):**
  - `lib/days.ts`: `dayKey` and `addDays`;
  - `lib/rewards.ts`: `awardStreakBonus`, `passedReadyCheck` and `awardReadyCheckBonus`;
  - `lib/attempts.ts`: `trustedAttempt` and `TrustedAttemptFields`.
- **Changed signatures:**
  - `awardLeaves(userId, reason, dedupeKey?)` now returns `Promise<boolean>`;
  - `streakDays(userId, now?)`.
- **Routes:**
  - new `GET /api/streak`, which returns 501 until implemented;
  - `TODO` markers on `PUT /progress`, `POST /attempts` and `POST /hints`.
- **Tests with empty bodies:**
  - `days.test.ts` (4);
  - `rewards.test.ts` (9);
  - `attempts.test.ts` (6);
  - one ready-check id test in `client/src/content/content.test.ts`.

### Verification summary

| Check                                               | Result                                        |
| --------------------------------------------------- | --------------------------------------------- |
| Server tests against local PostgreSQL               | 56 / 56 pass (19 new tests with empty bodies) |
| Client tests                                        | 29 / 29 pass (1 new test with an empty body)  |
| Schema drift between migrations and `schema.prisma` | None                                          |
| ESLint, TypeScript (strict), Prettier               | Pass                                          |

### Human review required

- **Migrations were written with `prisma migrate diff`:** `prisma migrate dev` refuses to run in a non-interactive shell when a unique index is added, so the SQL was generated by diffing and applied with `prisma migrate deploy`. Check the two `migration.sql` files.
- **Scaffolding markers:** remove each `void …; // scaffolding` line when its function is implemented. TypeScript's `noUnusedParameters` setting needs them until then.
- **Empty tests pass:** fill in the 20 new tests before merging.

---

## Entry 008: Badges scaffolding (BACKEND_PLAN Task 3)

| Field        | Detail                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------ |
| Date         | 14 November 2026                                                                                 |
| Requested by | Kyle Liebenberg, backend owner                                                                   |
| Tool         | Claude Code (Anthropic), model Claude Opus 5.5                                                   |
| Scope        | Prisma schema and migration, `@btree/shared`, `server/src/lib/badges.ts`, progress routes, tests |
| Status       | Completed; left uncommitted on branch `feat/badges` for review                                   |

### Request

> Please refer to Task 3 in `docs/BACKEND_PLAN.md` and implement the scaffolding for Task 3 in the same way as for Task 2. I will implement the method bodies myself.

### Clarifications provided

None were needed. The badge rules are the ones agreed in the plan (decision D2):

| Badge         | Rule                                                       |
| ------------- | ---------------------------------------------------------- |
| Explorer      | warm-up done and module 1 complete                         |
| Splitter      | the three latest O5 answers all correct                    |
| Root Raiser   | O6 mastered                                                |
| Lecture Ready | ready check passed, reusing `passedReadyCheck` from Task 2 |

As in Task 2, declarations are defined in full, new functions throw `Not implemented`, and tests have empty bodies.

### Deliverables

- **Database:** migration `badges`, with a `BadgeId` enum and a `UserBadge` table. Each badge is unique per user and deleted along with the user. The Prisma client was regenerated.
- **`@btree/shared`:**
  - `BADGES`: the id, label and description of each badge;
  - `BadgeId`, `BADGE_IDS` and `SPLITTER_RUN` (3);
  - the `BadgeIdSchema` and `Badge` schemas.
- **New server module (stubs):** `lib/badges.ts`, with:
  - `earnedExplorer`, `earnedSplitter` and `earnedRootRaiser`;
  - `BADGE_RULES`, with Lecture Ready wired to `passedReadyCheck`;
  - `checkBadges` and `badgesFor`.
- **Routes:**
  - new `GET /api/badges`, which returns 501 until implemented;
  - `TODO(Task 3.2)` markers where `checkBadges` runs: `PUT /progress`, `POST /attempts` and `POST /warmup`.
- **Tests with empty bodies:**
  - `server/test/badges.test.ts` (13): an earned and a not-yet case for each badge, once-only awarding, and `GET /api/badges`;
  - one privacy test in `friends.test.ts`: the friend grove never includes badges.

### Verification summary

| Check                                               | Result                                        |
| --------------------------------------------------- | --------------------------------------------- |
| Server tests against local PostgreSQL               | 73 / 73 pass (14 new tests with empty bodies) |
| Client tests                                        | 43 / 43 pass                                  |
| Schema drift between migrations and `schema.prisma` | None                                          |
| ESLint, TypeScript (strict), Prettier               | Pass                                          |

### Human review required

- **Badge wording:** the descriptions in `BADGES` are student-facing. The ID lead should check them.
- **Scaffolding markers:** remove each `void …; // scaffolding` line, the doc comments and the `TODO(Task 3.x)` markers when implementing.
- **Empty tests pass:** fill in the 14 new tests before merging.

---

## Entry 009: Friends and privacy scaffolding (BACKEND_PLAN Task 4)

| Field        | Detail                                                                  |
| ------------ | ----------------------------------------------------------------------- |
| Date         | 14 November 2026                                                        |
| Requested by | Kyle Liebenberg, backend owner                                          |
| Tool         | Claude Code (Anthropic), model Claude Opus 5.5                          |
| Scope        | `@btree/shared`, `server/src/lib/rateLimit.ts`, friends routes, tests   |
| Status       | Completed; left uncommitted on branch `feat/friends-privacy` for review |

### Request

> Please implement the scaffolding for Task 4. Task 4.3, the data export (POPIA right of access), is to be ignored, as it falls outside the project's scope.

### Clarifications provided

None were needed. Task 4.3 was left out as instructed, and no database change was required. As in Tasks 2 and 3:

- declarations are defined in full;
- new endpoints return 501 until implemented;
- tests have empty bodies.

The one exception is `perUserLimiter`. Routes create it when the app starts, so a version that threw an error would stop the server. Its scaffold therefore lets every request through until it is implemented.

### Deliverables

- **`@btree/shared`:**
  - schemas `IncomingFriendRequest`, `OutgoingFriendRequest` and `FriendsList`;
  - constants `FRIEND_REQUESTS_PER_HOUR` (10) and `CHEERS_PER_HOUR` (20).
- **New server module (stub):** `lib/rateLimit.ts`, with `perUserLimiter`, `PerUserLimit` and `RATE_LIMIT_MESSAGE`.
- **Routes in `friends.ts`:**
  - per-student limiters mounted on `POST /friends/requests` and `POST /friends/:id/cheers`;
  - new endpoints, each returning 501 until implemented:
    - `POST /friends/requests/:id/decline`;
    - `DELETE /friends/requests/:id`;
    - `DELETE /friends/:id`;
  - `TODO(Task 4.1)` markers on `GET /friends` (the outgoing list) and `POST /friends/requests` (crossing requests and existing friends).
- **Tests with empty bodies:**
  - 11 request-lifecycle tests in `friends.test.ts`;
  - 3 rate-limit tests in a new `rateLimit.test.ts`.

### Verification summary

| Check                                 | Result                                        |
| ------------------------------------- | --------------------------------------------- |
| Server tests against local PostgreSQL | 87 / 87 pass (14 new tests with empty bodies) |
| Client tests                          | 43 / 43 pass                                  |
| ESLint, TypeScript (strict), Prettier | Pass                                          |

### Human review required

- **Outgoing requests reveal accounts:** a request row exists only when the email belongs to an account, so the outgoing list tells the sender whether an address is registered. The rate limit slows this down but does not prevent it.
- **Scaffolding markers:** remove each `void …; // scaffolding` line, the doc comments and the `TODO(Task 4.x)` markers when implementing.
- **Empty tests pass:** fill in the 14 new tests before merging.

---

## Entry 010: Account settings scaffolding (BACKEND_PLAN Task 5)

| Field        | Detail                                                                                                    |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| Date         | 14 November 2026                                                                                          |
| Requested by | Kyle Liebenberg, backend owner                                                                            |
| Tool         | Claude Code (Anthropic), model Claude Opus 5.5                                                            |
| Scope        | Prisma schema and migration, `@btree/shared`, `server/src/lib/account.ts`, account and auth routes, tests |
| Status       | Completed; left uncommitted on branch `feat/account-settings` for review                                  |

### Request

> Please implement the scaffolding for Task 5 (account settings). I will implement the core logic myself.

### Clarifications provided

None were needed. As in the earlier tasks:

- declarations are defined in full;
- the core logic is a stub that returns 501;
- tests have empty bodies.

The one exception is `toPublicUser`, which now returns the user's `theme`. The client checks every sign-in and session response against `PublicUser`, so adding the field to the schema without sending it would have broken signing in.

Task 5.2 only marks items in `docs/TODO.md` as out of scope. It is left for when the task is completed.

### Deliverables

- **Database:** migration `user_theme`, adding a `Theme` enum (`day`, `dusk`) and a nullable `User.theme` column. The Prisma client was regenerated.
- **`@btree/shared`:**
  - `THEMES`, `Theme` and `ThemeSchema`;
  - `PublicUser.theme`, which is null until the student picks a theme;
  - `AccountPatchBody`:
    - fields: display name (1–40 characters), theme, current password, and new password (8–128 characters);
    - at least one setting must change;
    - a new password needs the current one.
- **New server module (stub):** `lib/account.ts`, with `updateAccount` and `WRONG_PASSWORD_MESSAGE`. The rules are in its doc comment.
- **Routes:**
  - `PATCH /api/account`, with sign-in, the auth rate limit and body validation already in place;
  - `authLimiter` is now exported from `routes/auth.ts`;
  - a `TODO(Task 5.1)` marker in `lib/export.ts` to add the theme to the data export.
- **Tests with empty bodies:**
  - 10 in a new `settings.test.ts`, covering the display name, theme, password and validation;
  - 1 in `account.test.ts`: the export includes the theme.

### Verification summary

| Check                                               | Result                                          |
| --------------------------------------------------- | ----------------------------------------------- |
| Server tests against local PostgreSQL               | 101 / 101 pass (11 new tests with empty bodies) |
| Client tests                                        | 43 / 43 pass                                    |
| Playwright end-to-end and axe accessibility         | 24 / 24 pass                                    |
| Schema drift between migrations and `schema.prisma` | None                                            |
| ESLint, TypeScript (strict), Prettier               | Pass                                            |

### Human review required

- **Sessions after a password change:** other signed-in devices stay signed in. Revocable sessions were ruled out of scope for the prototype.
- **Scaffolding markers:** remove each `void …; // scaffolding` line, the doc comment and the `TODO(Task 5.1)` marker when implementing.
- **Empty tests pass:** fill in the 11 new tests before merging.

---

## Entry 011: Display font change (Sniglet to Coiny)

| Field        | Detail                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| Date         | 14 November 2026                                                                                        |
| Requested by | Taylor Sergel, frontend                                                                                 |
| Tool         | Claude Code (Anthropic), model Claude Opus 5.5                                                          |
| Scope        | `client/src/main.tsx`, `client/src/styles/tokens.css`, `client/src/styles/index.css`, README, CHANGELOG |
| Status       | Completed; committed on branch `feat/ui-updates`                                                        |

### Request

> Please replace the Sniglet display font with Spectral, because its rounded bubble letters are hard to read at smaller sizes.

### Clarifications provided

Several fonts were tried in turn at the requester's direction: Spectral, Gravitas One, Sofia Sans, Hammersmith One, Luckiest Guy, Love Ya Like A Sister, Chango, DynaPuff and Coiny. **Coiny** was chosen.

- Each font was self-hosted through Fontsource, as before, and the previous package was removed each time.
- Coiny has a single 400 weight, so headings use `font-weight: 400` to avoid the browser faking a bold.
- The assistant pointed out that very heavy display fonts can still be hard to read at small sizes, because the same font is used for buttons and labels. The requester accepted Coiny after reviewing it in the app.

### Deliverables

- `@fontsource/coiny` replaces `@fontsource/sniglet`.
- `--font-display` is `'Coiny', 'Arial Rounded MT Bold', 'Trebuchet MS', system-ui, sans-serif`.
- README tech-stack table and CHANGELOG updated.

### Verification summary

| Check                                 | Result       |
| ------------------------------------- | ------------ |
| Client tests                          | 43 / 43 pass |
| Production build                      | Pass         |
| ESLint, TypeScript (strict), Prettier | Pass         |

### Human review required

- **Readability at small sizes:** check buttons, hint buttons, lesson numbers and the key bubbles in the tree diagrams at 360px wide.
- **Figma:** the Figma file still specifies Sniglet ExtraBold. Update it if the team keeps Coiny.

---

## Entry 012: Error boundary and offline banner (FRONTEND_PLAN Task 5)

| Field        | Detail                                                                                                                       |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Date         | 14 November 2026                                                                                                             |
| Requested by | Taylor Sergel, frontend                                                                                                      |
| Tool         | Claude Code (Anthropic), model Claude Opus 5.5                                                                               |
| Scope        | `client/src/stores/syncStore.ts`, `progressStore.ts`, `components/layout/` (banner, error boundary, shell), `App.tsx`, tests |
| Status       | Completed; on branch `feat/ui-updates`                                                                                       |

### Request

> Please add an error boundary and an offline banner, so that a failed save is shown to the student instead of failing silently, and explain how to check that it works.

### Clarifications provided

- The task was taken from `docs/TODO.md` before the backend handover (`docs/FRONTEND_PLAN.md`) arrived. It was later checked against the plan's Task 5.
- Failed saves are retried rather than only reported, so the banner's promise that progress "will save when you reconnect" is true.
- The retry queue is kept in memory only. The banner asks students to keep the tab open, and the browser warns before the tab is closed while saves are waiting.
- A follow-up added the plan's **Sign in again** link for saves refused because the session expired (401).

### Deliverables

- **`syncStore.ts` (new):** every progress save goes through it.
  - Saves that fail because of the network, a timeout, rate limiting or a server error are queued in order and resent when the connection returns.
  - A refused save (other 4xx) isn't retried. It is flagged as `expired` (401) or `refused`.
  - Signing out clears the queue, so saves never reach another account.
- **`OfflineBanner.tsx` (new):** offline, unsaved changes with **Try again**, session expired with **Sign in again**, and refused saves with **Dismiss**. It is a `role="status"` live region.
- **`ErrorBoundary.tsx` (new):** wraps each screen (reset on route change) and the whole app. A crash shows a friendly card with **Reload the page**; a page that couldn't download offline says to check the connection.
- **`useOnline.ts` (new):** the browser's online state as a hook.
- **Tests:** `syncStore.test.ts` and `OfflineBanner.test.tsx`.

### Verification summary

| Check                                 | Result                      |
| ------------------------------------- | --------------------------- |
| Client tests                          | 65 / 65 pass                |
| Manual: DevTools Offline              | Banner and error card shown |
| ESLint, TypeScript (strict), Prettier | Pass                        |

### Human review required

- **Lost queue on reload:** waiting saves are lost if the tab is closed or reloaded. The browser warning reduces this but doesn't prevent it.
- **Duplicate attempts:** if a save reached the server but its reply was lost, the retry records the answer twice. Leaves are protected by the server's dedupe keys, but the attempt history may contain the duplicate.

---

## Entry 013: Take decorations off the tree and put them back

| Field        | Detail                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| Date         | 14 November 2026                                                                                         |
| Requested by | Taylor Sergel, frontend                                                                                  |
| Tool         | Claude Code (Anthropic), model Claude Opus 5.5                                                           |
| Scope        | `server/src/routes/grove.ts`, `@btree/shared` (`Decoration`), `progressStore.ts`, `GrovePage.tsx`, tests |
| Status       | Completed; committed on branch `feat/ui-updates`                                                         |

### Request

> The Figma design has a craft drawer that holds all the decorations for the tree. The tree should start plain; students buy decorations with the leaves they earn, and after buying they should be able to choose which decorations are added to the tree and remove any they don't want, to personalise it. Please implement this, backend and frontend.

### Clarifications provided

- The assistant reviewed the Figma file (screen "09 My grove" and the `DecorationTile` component). The craft drawer, buying and the Owned, Buy and Locked tiles already existed behind the **Decorate** button. The demo account looked decorated because the seed gives it four decorations; new accounts start plain.
- The missing piece was taking decorations off and putting them back. The requester chose to keep the drawer behind **Decorate** rather than always showing it.
- The requester asked for the backend change to be made here rather than handed to the backend owner. The database already stored `placed` and `PUT /api/grove/placement` already saved it; only reading it back was missing.
- Figma has no tile for "owned but not on the tree", so one was added in the same style.

### Deliverables

- **Backend:** `GET /api/decorations` returns `placed` (false when not owned). The shared `Decoration` schema has the field.
- **Store:** `hiddenDecorations`, `toggleDecoration` and `placedDecorations`. Guests keep the choice in the session; signed-in students save it with `PUT /api/grove/placement` and load it on sign-in.
- **Grove page:** owned tiles show "in your tree" with **Take off**, or "in your drawer" with **Add to tree**. The tree shows only placed decorations.
- **Tests:** 2 server cases in `grove.test.ts`, 5 store cases in `progressStore.test.ts`.

### Verification summary

| Check                                        | Result         |
| -------------------------------------------- | -------------- |
| Server tests against local PostgreSQL        | 103 / 103 pass |
| Client tests                                 | 57 / 57 pass   |
| ESLint, TypeScript (strict), Prettier, build | Pass           |

### Human review required

- **Figma:** add the "in your drawer" tile state to the `DecorationTile` component.
- **Drag to place (Task 7):** still needs `x` and `y` returned by the API.

---

## Entry 014: Readiness after sign-in and mastery percentages

| Field        | Detail                                                                                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date         | 14 November 2026                                                                                                                                                |
| Requested by | Taylor Sergel, frontend                                                                                                                                         |
| Tool         | Claude Code (Anthropic), model Claude Opus 5.5                                                                                                                  |
| Scope        | `server/src/routes/progress.ts`, `@btree/shared` (`AttemptRecord`, `objectiveMastery`), `progressStore.ts`, `ReadyPage.tsx`, `client/src/lib/mastery.ts`, tests |
| Status       | Completed; committed on branch `feat/ui-updates`                                                                                                                |

### Request

> The readiness percentage in the header shows 0% after signing out and back in instead of the actual percentage. On the Ready for lecture page, some objectives at 80% say "Mastered" while others at 100% say "Getting there", which doesn't make sense. Please fix both.

### Clarifications provided

- **0% after sign-in:** past answers were never loaded from the server, so the header worked out readiness from nothing. The Ready page asked the server separately, so the two disagreed.
- **"Getting there" at 100%:** an objective is mastered at 80% or more from at least 3 first-try answers without hints. The percentage was plain accuracy, so one right answer showed 100%. An explanatory hint was tried first; the requester asked for the percentages themselves to be rethought.
- The score was redefined as **progress toward mastery**: right answers out of at least 3. The mastery rule itself is unchanged, so badges are unaffected.

### Deliverables

- **Backend:** `GET /api/attempts` returns the student's saved answers, oldest first (shared `AttemptRecord`).
- **Store:** answers load on sign-in, so the header and Ready page agree. This also stops an answer already paid on another device paying +10 leaves again.
- **Scoring:** `score = right / max(counted, 3)`. An objective is mastered exactly when its score reaches 80%.
- **Ready page:** explains the rule, and each objective in progress says what's left (`masteryHint` in `client/src/lib/mastery.ts`).
- **Tests:** 2 server cases in `attempts.test.ts`, a store case, and `mastery.test.ts`, which checks every combination of up to 6 answers.

### Verification summary

| Check                                        | Result         |
| -------------------------------------------- | -------------- |
| Server tests against local PostgreSQL        | 105 / 105 pass |
| Client tests                                 | 63 / 63 pass   |
| Engine tests                                 | 19 / 19 pass   |
| ESLint, TypeScript (strict), Prettier, build | Pass           |

### Human review required

- **ID document:** the Assessment Strategy should describe the percentage as progress toward mastery (right answers out of at least 3).
- **Stored scores:** `Mastery.score` rows written before this change keep the old value until the student next answers a question for that objective. Readiness is calculated from answers, not from that table, so screens are unaffected.

---

## Entry 015: Reward feedback (FRONTEND_PLAN Task 1)

| Field        | Detail                                                                                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date         | 14 November 2026                                                                                                                                            |
| Requested by | Taylor Sergel, frontend                                                                                                                                     |
| Tool         | Claude Code (Anthropic), model Claude Opus 5.5                                                                                                              |
| Scope        | `progressStore.ts`, `api/queryClient.ts`, `api/hooks.ts`, `RewardToast.tsx`, `StreakCard.tsx`, `GrovePage.tsx`, `PracticePage.tsx`, `lib/rewards.ts`, tests |
| Status       | Completed; left uncommitted on branch `feat/rewards-ui` for review                                                                                          |

### Request

> Please implement step 1 of the frontend plan (rewards feedback: show the streak and ready-check bonuses as soon as they are earned, add a streak card, and correct the Practice streak text), and explain how to check that it works before committing.

### Clarifications provided

- The streak card goes on the My grove page under the leaf count, as agreed earlier with the requester.
- The bonus message is a small pop-up at the bottom of the screen that closes by itself, so it doesn't push the page down.
- The Practice "in a row" count now follows the server's Splitter rule (the latest O5 answers, including quiz answers) rather than a counter that reset on page load, so the number shown matches when the badge is awarded.
- The branch was created from `feat/ui-updates`, whose pull request wasn't merged yet.

### Deliverables

- **Bonuses:** `recordAttempt` parses the `AttemptResult` reply and adds each bonus to `leaves` and `ledger`, and stores it in `lastBonus` (not saved). Bonuses also apply when a queued save is retried after reconnecting.
- **`RewardToast.tsx` (new):** "+15 leaves: 3-day practice streak!" or "+60 leaves: You're ready for the lecture!", as a live region, closing after 6 seconds or on **Close**.
- **`StreakCard.tsx` (new)** and `useStreak` (query key `['streak']`, invalidated after each saved answer).
- **Practice:** "n of 3 splits right in a row" toward the Splitter badge, only on **Split it yourself**.
- **`api/queryClient.ts` (new):** the query client, shared by `main.tsx` and the stores.
- **Tests:** 3 store cases, `lib/rewards.test.ts`, `RewardToast.test.tsx`.

### Verification summary

| Check                                                                                                                      | Result       |
| -------------------------------------------------------------------------------------------------------------------------- | ------------ |
| Client tests                                                                                                               | 77 / 77 pass |
| Browser check (Chrome): a 2-day streak plus one answer paid +15, showed the message and updated the header and streak card | Pass         |
| ESLint, TypeScript (strict), Prettier, build                                                                               | Pass         |

### Human review required

- **Splitter text after the badge:** once earned, the badge is kept, but the Practice card counts the current run. After a wrong split it says "3 more in a row earns the Splitter badge" even if the student already has it. Task 2 (badges) can show "earned" from `GET /api/badges`.
- **Figma:** the streak card and bonus message have no Figma frame yet.

---

## Entry 016: Badges on Ready and My grove (FRONTEND_PLAN Task 2)

| Field        | Detail                                                                                                                            |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Date         | 14 November 2026                                                                                                                  |
| Requested by | Taylor Sergel, frontend                                                                                                           |
| Tool         | Claude Code (Anthropic), model Claude Opus 5.5                                                                                    |
| Scope        | `BadgeCard.tsx`, `api/hooks.ts`, `progressStore.ts`, `lib/badges.ts`, `ReadyPage.tsx`, `GrovePage.tsx`, `PracticePage.tsx`, tests |
| Status       | Completed; left uncommitted on branch `feat/badges-ui` for review                                                                 |

### Request

> Please implement step 2 of the frontend plan (show the four badges on the Ready and My grove screens), and explain how to check that it works before committing.

### Clarifications provided

- The Figma file has no badge layers, so placement was chosen to fit the existing layout: a two-column card under the objectives on Ready, and a one-column list under the streak card on My grove.
- The Splitter text on Split it yourself, flagged in Entry 015, now says the badge is earned once the server has awarded it.
- The branch was created from `feat/rewards-ui`, whose pull request wasn't merged yet.

### Deliverables

- **`BadgeCard.tsx` (new):** all four badges with description, earned date or "Locked" (dashed outline and lock icon), an "n of 4 earned" count, a guest sign-in prompt and an error message.
- **`useBadges`** (query key `['badges']`), reloaded by the progress store after a saved answer, module or warm-up.
- **`lib/badges.ts` (new):** the locked list for guests and the date format.
- **Tests:** `BadgeCard.test.tsx` (3 cases) and 3 store cases.

### Verification summary

| Check                                                                                                                                                       | Result       |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| Client tests                                                                                                                                                | 83 / 83 pass |
| Browser check (Chrome): guest sees 4 locked; a test account with 3 right splits sees Splitter earned on My grove, and Practice says "Splitter badge earned" | Pass         |
| No sideways scroll on Ready at 375px wide                                                                                                                   | Pass         |
| ESLint, TypeScript (strict), Prettier, build                                                                                                                | Pass         |

### Human review required

- **Figma:** the badge card has no Figma frame. The ID or design team may want to check the icons (compass, scissors, sprout, graduation cap) and placement.

---

## Entry 017: Friends (FRONTEND_PLAN Task 3)

| Field        | Detail                                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Date         | 14 November 2026                                                                                                                      |
| Requested by | Taylor Sergel, frontend                                                                                                               |
| Tool         | Claude Code (Anthropic), model Claude Opus 5.5                                                                                        |
| Scope        | `FriendsCard.tsx`, `api/hooks.ts`, `lib/friends.ts`, `AccountPage.tsx`, `GrovePage.tsx`, `FriendGrovePage.tsx`, `AppShell.tsx`, tests |
| Status       | Completed; left uncommitted on branch `feat/friends-ui` for review                                                                    |

### Request

> Please implement step 3 of the frontend plan (friends: decline, cancel and unfriend, pending requests outside the Account page, the 429 message, and a clear page after unfriending), and explain how to check that it works before committing.

### Clarifications provided

- The Figma file has no frame for pending requests, so they appear as a notice on the Friends' groves card on My grove, linking to the Account page, rather than as a header count.
- Unfriending is confirmed inline (**Remove** / **Keep**) rather than with a browser pop-up, so it is keyboard- and screen-reader-friendly and can be tested.
- The branch was created from `feat/badges-ui`.

### Deliverables

- **`FriendsCard.tsx` (new):** send, accept, decline, cancel and unfriend, with the 429 message as an alert.
- **Hooks:** five friend mutations that reload `['friends']`; `useFriends` checks the reply with `FriendsList`.
- **My grove:** pending request notice with **Review →**. `AppShell` no longer scrolls to the top when a link targets a section, so the Friends card can scroll itself into view.
- **Friend's grove:** "You're no longer friends" on 404, and the cheer 429 message.
- **Tests:** 5 card cases, 2 helper cases, 1 page case.

### Verification summary

| Check                                                                                                                                                                 | Result       |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| Client tests                                                                                                                                                          | 91 / 91 pass |
| Browser check (Chrome, two accounts): send, cancel, re-send, decline, re-send, accept, unfriend with confirm, then the old grove link says "You're no longer friends" | Pass         |
| Browser check: the 11th request in an hour shows "Slow down a little and try again later"                                                                             | Pass         |
| No sideways scroll on Account at 375px wide                                                                                                                           | Pass         |
| ESLint, TypeScript (strict), Prettier, build                                                                                                                          | Pass         |

### Human review required

- **Privacy:** the server only stores a request when the email has an account, so "Requests you sent" shows real accounts and never shows made-up emails. That reveals which emails are registered, which the neutral "If that email has an account…" message was meant to hide. Fixing it needs a backend change (store requests by email, and match them when that email registers). Listed under Known issues in the changelog.
- **Figma:** the request lists and the grove notice have no Figma frame.

---

## Entry 018: Account settings (FRONTEND_PLAN Task 4)

| Field        | Detail                                                                                                                                                |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date         | 14 November 2026                                                                                                                                      |
| Requested by | Taylor Sergel, frontend                                                                                                                               |
| Tool         | Claude Code (Anthropic), model Claude Opus 5.5                                                                                                        |
| Scope        | `ProfileCard.tsx`, `AppearanceCard.tsx`, `AccountPage.tsx`, `AppShell.tsx`, `themeStore.ts`, `api/client.ts`, `api/hooks.ts`, `lib/account.ts`, tests |
| Status       | Completed; left uncommitted on branch `feat/account-settings-ui` for review                                                                           |

### Request

> Please implement step 4 of the frontend plan (change display name and password, save the Day/Dusk theme per account, and a "Download my data" link), and explain how to check that it works before committing.

### Clarifications provided

- Name and password are two forms in one Profile card, each with its own Save button and messages, so a wrong password never blocks a name change.
- The "Download my data" link sits in its own "Your data" card just above "Delete account".
- If saving the theme to the account fails, the theme still changes on the device and a short message says so.
- The branch was created from `feat/friends-ui`.

### Deliverables

- **`ProfileCard.tsx` (new):** display name and change password, validated with the shared `AccountPatchBody` before sending.
- **`AppearanceCard.tsx` (moved and extended):** saves the theme to the account when signed in.
- **`AppShell.tsx`:** applies `me.theme` on sign-in when it isn't null.
- **Account page:** "Your data" card with **Download my data**.
- **`api.patch`, `useUpdateAccount`, `lib/account.ts`** (error text).
- **Tests:** 8 card cases and 3 helper cases.

### Verification summary

| Check                                                                                                                           | Result         |
| ------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| Client tests                                                                                                                    | 101 / 101 pass |
| Browser check (Chrome): rename updates the page and the server; wrong current password shows the message; password change works | Pass           |
| Browser check: pick Dusk, then sign in from a fresh browser with a light system theme, and the app opens in Dusk                | Pass           |
| Browser check: **Download my data** saves `btree-basic-data-2026-11-14.json` with account, progress, badges and friends         | Pass           |
| No sideways scroll on Account at 375px wide                                                                                     | Pass           |
| ESLint, TypeScript (strict), Prettier, build                                                                                    | Pass           |

### Human review required

- **Figma:** the Profile and Your data cards have no Figma frame.
- A guest who picked a theme and then signs in to an account with no saved theme keeps the guest's choice on that device; it is saved to the account the next time they pick one.

---

## Entry template

```markdown
## Entry NNN: <short title>

| Field        | Detail                            |
| ------------ | --------------------------------- |
| Date         | <day month year>                  |
| Requested by | <name / role>                     |
| Tool         | <tool and model>                  |
| Scope        | <files or features affected>      |
| Status       | <completed / partial / abandoned> |

### Request

> <the prompt, written formally>

### Clarifications provided

<questions asked and decisions made>

### Deliverables

<what was produced>

### Verification summary

<tests and checks run, with results>

### Human review required

<what a team member must check before relying on the output>
```
