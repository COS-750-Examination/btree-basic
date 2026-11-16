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

> Look at my attached `plan.md` and then the initial scaffold of the front end and back end for our COS750 group project, a pre-lecture B-tree tutor for COS212 students.
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

> Please review the codebase to gain an understanding of the project, a web application that teaches B-trees to second-year computer science students before their B-tree lecture. Several items remain outstanding in `docs/TODO.md`, and I am responsible for the Backend section. Please review what remains on the to-do list and and in my `docs/BACKEND_PLAN.md` and modify my `BACKEND_PLAN.md` such that tasks are grouped with related sub-tasks and are ordered for the implementation phase.

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

## Entry 011: Look, reliability and learning support

| Field        | Detail                                                                                                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Date         | 14–15 November 2026                                                                                                                                                                                                            |
| Requested by | Taylor Sergel, frontend                                                                                                                                                                                                        |
| Tool         | Claude Code (Anthropic), model Claude Opus 5.5                                                                                                                                                                                 |
| Scope        | Fonts and tokens, `syncStore.ts`, `OfflineBanner.tsx`, `ErrorBoundary.tsx`, `progressStore.ts`, `routes/progress.ts`, `ReadyPage.tsx`, `lib/mastery.ts`, mini-lessons, `usePlayback.ts`, `useNarration.ts`, `speech.ts`, tests |
| Status       | Completed; committed on branch `feat/ui-updates`                                                                                                                                                                               |

### Request

> 1. Replace the Sniglet display font, because its rounded bubble letters are hard to read at smaller sizes.
> 2. Add an error boundary and an offline banner, so that a failed save is shown to the student instead of failing silently (FRONTEND_PLAN Task 5).
> 3. Fix the readiness percentage, which shows 0% after signing out and back in, and the Ready page, where some objectives at 80% say "Mastered" while others at 100% say "Getting there".
> 4. Write the "Need more?" mini-lessons for objectives O1–O8 (FRONTEND_PLAN Task 8), because the ID team does not have time.
> 5. In the lesson Watch tab and the Visualiser, Play moves on before the narrator finishes the sentence. Either remove Play or make it wait until she has finished.

### Clarifications provided

- **Font:** Spectral, Gravitas One, Sofia Sans, Hammersmith One, Luckiest Guy, Love Ya Like A Sister, Chango, DynaPuff and Coiny were tried in turn; **Coiny** was chosen. It is self-hosted through Fontsource and has a single 400 weight, so headings use `font-weight: 400`. The assistant noted that very heavy display fonts can be hard to read on small buttons and labels; the requester accepted Coiny after reviewing it.
- **Offline:** failed saves are retried rather than only reported, so the banner's promise that progress "will save when you reconnect" is true. The queue is kept in memory, and the browser warns before closing the tab while saves are waiting. A session that expired (401) shows **Sign in again**.
- **Readiness:** past answers were never loaded after sign-in, so the header worked from nothing. Mastery needs 80% or more from at least 3 first-try answers without hints, but the percentage was plain accuracy, so one right answer showed 100%. After an explanatory hint was tried, the requester asked for the percentages themselves to be rethought: the score became **progress toward mastery** (right answers out of at least 3). The mastery rule and badges are unchanged.
- **Mini-lessons:** the text follows the existing lessons' trees, wording and rules, and every worked example was checked against the B-tree engine. One wrong calculation in the O7 draft (a 1,000-key 2-3 tree is at most 9 levels, not 10) was fixed before checking in.
- **Narration:** the assistant recommended keeping Play but waiting for the speech to end, with a brief pause, a voice rate that follows the speed control, and a fallback timer. The requester agreed and asked that the pause stay short.

### Deliverables

- **Font:** `@fontsource/coiny` replaces `@fontsource/sniglet`; README and CHANGELOG updated.
- **Offline and errors:** `syncStore.ts` (queued, in-order retries; refused saves flagged; queue cleared on sign-out), `OfflineBanner.tsx`, `ErrorBoundary.tsx` around each screen and the whole app, and `useOnline.ts`.
- **Readiness:** `GET /api/attempts`, answers loaded on sign-in (which also stops leaves being paid twice across devices), `score = right / max(counted, 3)`, and a Ready page that explains the rule and what is left for each objective (`masteryHint`).
- **Mini-lessons:** 8 Markdown files in `content/mini-lessons/`, the `/mini-lessons/:objective` page with a hidden answer, and links from Quiz, Practice and Ready.
- **Narration:** Play waits for the sentence to end, then pauses 0.35 s. The fallback is about 140 words a minute plus 2 s. Timing with the voice off is unchanged. Speaking moved from `NarrationBar` into `useNarration`.
- **Tests:** `syncStore`, `OfflineBanner`, `attempts` (server), `mastery` (every combination of up to 6 answers), engine-checked mini-lesson content, `MiniLessonPage`, `TracePlayer` playback.

### Verification summary

| Check                                                                                           | Result               |
| ----------------------------------------------------------------------------------------------- | -------------------- |
| Client, server and engine tests after the last change                                           | 154, 128 and 23 pass |
| Manual: DevTools Offline shows the banner and the error card                                    | Pass                 |
| Browser check: quiz "Need more?" opens the right mini-lesson; **Show answer** and **Back** work | Pass                 |
| ESLint, TypeScript (strict), Prettier, build                                                    | Pass                 |

### Human review required

- **Readability:** check buttons, hint buttons and the key bubbles in Coiny at 360px wide. The Figma file still specifies Sniglet ExtraBold.
- **Offline queue:** waiting saves are lost if the tab is closed or reloaded. A save whose reply was lost may be recorded twice in the attempt history (leaves are protected by dedupe keys).
- **ID team:** review the eight mini-lessons for tone and level, and update the Assessment Strategy to describe the percentage as progress toward mastery.
- **Narration:** listen in Chrome, Safari and Edge; voices differ in speed, and the fallback is an estimate.

---

## Entry 012: Rewards, badges and the grove

| Field        | Detail                                                                                                                                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date         | 14–15 November 2026                                                                                                                                                                                                   |
| Requested by | Taylor Sergel, frontend                                                                                                                                                                                               |
| Tool         | Claude Code (Anthropic), model Claude Opus 5.5                                                                                                                                                                        |
| Scope        | `routes/grove.ts`, shared `Decoration`, `progressStore.ts`, `GrovePage.tsx`, `GroveTree.tsx`, `FriendGrovePage.tsx`, `RewardToast.tsx`, `StreakCard.tsx`, `BadgeCard.tsx`, `PracticePage.tsx`, `ReadyPage.tsx`, tests |
| Status       | Completed; committed on branch `feat/ui-updates`                                                                                                                                                                      |

### Request

> 1. The tree should start plain. Students buy decorations from the craft drawer with the leaves they earn, then choose which ones go on the tree and take off any they don't want. Implement this, backend and frontend.
> 2. Show the streak and ready-check bonuses as soon as they are earned, add a streak card, and correct the Practice streak text (FRONTEND_PLAN Task 1).
> 3. Show the four badges on the Ready and My grove screens (FRONTEND_PLAN Task 2).
> 4. Let students drag decorations into place on their grove, including the backend change (FRONTEND_PLAN Task 7).

### Clarifications provided

- **Decorations:** the Figma craft drawer, buying and the Owned, Buy and Locked tiles already existed behind **Decorate**; the missing piece was taking decorations off and putting them back. The requester chose to keep the drawer behind **Decorate** and asked for the backend change to be made here. Figma has no "owned but not on the tree" tile, so one was added in the same style.
- **Rewards:** the streak card sits on My grove under the leaf count. The bonus message is a small pop-up that closes by itself. The Practice "in a row" count follows the server's Splitter rule, so it matches when the badge is awarded.
- **Badges:** Figma has no badge layers, so they go in a two-column card under the objectives on Ready and a list under the streak card on My grove. The Splitter text says "earned" once the server has awarded it.
- **Dragging:** decorations only move while the craft drawer is open, so the scene can't be changed by accident and stays a plain picture for screen readers. Each decoration moves as one piece (for example all the apples together). The database already had `x` and `y` columns.

### Deliverables

- **Server:** `GET /api/decorations` returns `placed`, `x` and `y`; a friend's grove returns `positions`; `PUT /api/grove/placement` accepts `null` to reset and rejects positions outside the scene.
- **Store:** hidden and placed decorations and their positions, saved for signed-in students and kept for the session for guests. Bonuses from `AttemptResult` are added to leaves and shown, including after an offline retry.
- **Screens:** Take off / Add to tree tiles; drag with the pointer or move with the arrow keys (Shift for bigger steps) and **Move back**; `RewardToast.tsx`; `StreakCard.tsx`; `BadgeCard.tsx` (earned date or Locked, "n of 4 earned", guest prompt); Splitter progress on Split it yourself.
- **Tests:** grove server cases, store cases, `rewards`, `RewardToast`, `BadgeCard`, `GroveTree`.

### Verification summary

| Check                                                                                                        | Result |
| ------------------------------------------------------------------------------------------------------------ | ------ |
| Client and server tests at the time of each change                                                           | Pass   |
| Browser check: a 2-day streak plus one answer paid +15, showed the message and updated the header and card   | Pass   |
| Browser check: a guest sees 4 locked badges; 3 right splits show Splitter earned on My grove and Practice    | Pass   |
| Browser check: drag the songbird with the mouse, move the apples with Shift+arrows, positions kept on reload | Pass   |
| ESLint, TypeScript (strict), Prettier, build                                                                 | Pass   |

### Human review required

- **Figma:** add the "in your drawer" tile state, and frames for the streak card, bonus message, badge card and moving controls. The design team may want to check the badge icons.

---

## Entry 013: Friends

| Field        | Detail                                                                                                                                                                                                                                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date         | 14–15 November 2026                                                                                                                                                                                                                                                                                            |
| Requested by | Taylor Sergel, frontend                                                                                                                                                                                                                                                                                        |
| Tool         | Claude Code (Anthropic), model Claude Opus 5.5                                                                                                                                                                                                                                                                 |
| Scope        | Prisma schema and migrations, `routes/friends.ts`, `routes/invites.ts`, `lib/export.ts`, shared friend, cheer and invite schemas, `FriendsCard.tsx`, `InviteLink.tsx`, `AddFriendPage.tsx`, `CheersCard.tsx`, `cheersStore.ts`, `Header.tsx`, `GrovePage.tsx`, `FriendGrovePage.tsx`, `AccountPage.tsx`, tests |
| Status       | Completed; committed on branch `feat/ui-updates`                                                                                                                                                                                                                                                               |

### Request

> 1. Friends: decline, cancel and unfriend, pending requests shown outside the Account page, the 429 message, and a clear page after unfriending (FRONTEND_PLAN Task 3).
> 2. Make it possible to find friends while typing, like Instagram's search dropdown.
> 3. Place the invite link below the "Add by email" form.
> 4. A friend gets no notification when they are cheered; add one, and on My grove place Friends' groves above Badges.
> 5. Show a small counter on the account (initials) button for new friend requests. It should only clear when the Account page is opened, stay cleared after signing out and back in, and later count only requests that arrived since.

### Clarifications provided

- **Pending requests:** Figma has no frame for them, so they appear as a notice on the Friends' groves card on My grove. Unfriending is confirmed inline (**Remove** / **Keep**) rather than with a browser pop-up.
- **Search:** not built, because listing every student's name and email to anyone signed in goes against the app's POPIA design. Of the options offered (opt-in name search, invite links, or both), the requester chose **invite links**. Opening a link sends a request rather than adding the friend at once, and **Make a new link** stops an old link working.
- **Cheers:** a count on **My grove** in the header (a dot on the phone menu) and a **Cheers for you** card. "Seen" is stored on the device per account, so no database change was needed.
- **Request counter:** the seen time is stored on the account in the database, so it holds across sign-out, cleared site data and other devices. It shows up to "9+".
- The requester asked for no code comments and for all work to stay on `feat/ui-updates`.

### Deliverables

- **Server:** `User.inviteCode` and `User.requestsSeenAt` (two migrations), four `/api/invites` routes with rate limits, `POST /api/friends/requests/seen`, `sentAt` and `requestsSeenAt` in `GET /api/friends`, `fromId` and `toId` on cheers, and both new fields in the data export.
- **Client:** `FriendsCard.tsx` (send, accept, decline, cancel, unfriend; "Add by email" then the invite link), the `/add/:code` page with `?next=` on sign-in and register, the pending-request notice, "You're no longer friends" on a removed friend's grove, `cheersStore.ts` and `CheersCard.tsx`, the header counts, and friends and cheers re-checked every minute.
- **Tests:** server invite, friend and cheer cases; `FriendsCard`, `AddFriendPage`, `CheersCard`, `RequestNotifications`, and helper cases.

### Verification summary

| Check                                                                                                                                   | Result |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Client and server tests at the time of each change                                                                                      | Pass   |
| Browser check (two accounts): send, cancel, decline, accept, unfriend; the old grove link then says "You're no longer friends"          | Pass   |
| Browser check: a guest opens an invite link, registers, comes back and sends the request; after **Make a new link** the old link fails  | Pass   |
| Browser check: a cheer shows "My grove 1"; 2 requests show "2" and stay cleared after visiting Account, signing out and signing back in | Pass   |
| ESLint, TypeScript (strict), Prettier, build                                                                                            | Pass   |

### Human review required

- **Privacy:** "Requests you sent" reveals which emails have an account, because the server only stores a request for a registered email. Fixing it needs a backend change. It is listed under Known issues in the CHANGELOG.
- **Backend owner:** two new `User` columns and four routes. Teammates need `npm run db:migrate` after pulling.
- **Figma:** the request lists, invite section, add-friend page and cheers card have no Figma frame.

---

## Entry 014: Account settings

| Field        | Detail                                                                                                                                                |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date         | 14–15 November 2026                                                                                                                                   |
| Requested by | Taylor Sergel, frontend                                                                                                                               |
| Tool         | Claude Code (Anthropic), model Claude Opus 5.5                                                                                                        |
| Scope        | `ProfileCard.tsx`, `AppearanceCard.tsx`, `AccountPage.tsx`, `AppShell.tsx`, `themeStore.ts`, `api/client.ts`, `api/hooks.ts`, `lib/account.ts`, tests |
| Status       | Completed; committed on branch `feat/ui-updates`                                                                                                      |

### Request

> 1. Change display name and password, save the Day/Dusk theme per account, and add a "Download my data" link (FRONTEND_PLAN Task 4).
> 2. Make the Account page show the student's details by default, with a small round pen button that switches the Profile card to the editing form, and **Cancel** and **Save changes** buttons that return to the details view.

### Clarifications provided

- **Download my data** sits in its own "Your data" card just above "Delete account".
- If saving the theme to the account fails, the theme still changes on the device and a short message says so.
- The details view shows the name, the email (which can't be changed) and a hidden password. Name and password save in one request; the password fields are optional, but filling any of them requires all three.
- After saving or cancelling, focus returns to the pen button; opening the form focuses the name field.

### Deliverables

- **`ProfileCard.tsx`:** a details view with a round **Edit profile** button, and an edit form validated with the shared `AccountPatchBody`.
- **`AppearanceCard.tsx`:** saves the theme to the account when signed in. `AppShell.tsx` applies the saved theme on sign-in.
- **Account page:** "Your data" card with **Download my data**.
- **`api.patch`, `useUpdateAccount`, `lib/account.ts`** (error text).
- **Tests:** `ProfileCard` (both modes) and account helper cases.

### Verification summary

| Check                                                                                                       | Result |
| ----------------------------------------------------------------------------------------------------------- | ------ |
| Client tests at the time of each change                                                                     | Pass   |
| Browser check: rename, wrong current password message, password change; view, edit, save and cancel         | Pass   |
| Browser check: pick Dusk, sign in from a fresh browser with a light system theme, and the app opens in Dusk | Pass   |
| Browser check: **Download my data** saves a JSON file with account, progress, badges and friends            | Pass   |
| ESLint, TypeScript (strict), Prettier, build                                                                | Pass   |

### Human review required

- **Figma:** the Profile and Your data cards have no Figma frame.
- A guest who picked a theme and then signs in to an account with no saved theme keeps the guest's choice on that device until they pick one again.

---

## Entry 015: Daily b-tree

| Field        | Detail                                                                                                                                                                                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date         | 15 November 2026                                                                                                                                                                                                                                                                      |
| Requested by | Taylor Sergel, frontend                                                                                                                                                                                                                                                               |
| Tool         | Claude Code (Anthropic), model Claude Opus 5.5                                                                                                                                                                                                                                        |
| Scope        | `DailyPage.tsx`, `DailyBoard.tsx`, `dailyHints.ts`, `Header.tsx`, `App.tsx`, `PracticePage.tsx`, `BTreeView.tsx`, `layout.ts`, `api/hooks.ts`, `routes/daily.ts`, `lib/daily.ts`, `lib/export.ts`, Prisma schema and migrations, `engine/daily.ts`, shared schemas and scoring, tests |
| Status       | Completed on branch `feat/ui-updates`; the latest board changes are uncommitted for review                                                                                                                                                                                            |

### Request

> Replace the Build the tree placeholder on Practice with its own tab, "Daily b-tree", between Quiz and My grove. Based on the Puzzlit app: new keys every day, build the correct tree as fast as possible, one go per account per day, then a leaderboard for that day with a podium for the top three and a list from 4th onwards. Only friends appear on the leaderboard (POPIA).
>
> Follow-ups after trying it:
>
> 1. Tap the key that moves up in the tree itself, make a wrong move cost a penalty and be retried, and add a hint for each step with a bigger penalty.
> 2. Build the tree from the first key, don't show which node is full (no red node or "too full" text) unless a hint is taken, keep hints short, and make it drag and drop.
> 3. Drop the Next key button: drag the numbers from a row at the top (a used number turns into a blank circle), start with a root node already there, and show the free space in each node.
> 4. Delete the test runs so the game can be replayed after each change.
> 5. Make scores out of 100 with two decimals, give time more weight, start with the first number already in the root, remove the empty placeholder spots, and add a **Split and move up** button as another way to move a key up.
> 6. Remove the New root block: dragging a root key up out of the root (or using **Split and move up**) makes it the new root, but only when it's the right key.

### Clarifications provided

- **Gameplay:** insert key by key rather than drawing the final tree. The current version: the next number is dragged from the row onto its leaf; a node with too many keys is fixed by dragging the key that moves up into the node above (a root key dragged up out of the root becomes the new root). Dragging the next number while a node is still too full is a mistake. Tapping works as a fallback for keyboards and small screens. The Next key step in the second version was removed because it felt worse than the first.
- **Scoring:** a wrong move adds 10 s and must be retried (the same wrong move is only charged once); a hint adds 30 s, once per step. Points-based penalties were offered and not chosen. The score was later changed to be out of 100 with two decimals, with time weighted more: 100 minus 0.3 points per second of final time (clock plus penalties).
- **Rules:** guests don't see the tab, and `/daily` shows a sign-in prompt. The clock keeps running from the first Start if the student leaves, and the game picks up where it left off. The keys come from an HMAC of the day with the server secret, so they can't be worked out before pressing Start.
- **Split and move up:** the student taps the key to move, then presses the button. Tapping a node to split it automatically was not used, because choosing the middle key is the point of the step.
- **Test data:** at the requester's request, Daily b-tree runs were deleted from the local database several times (including two runs saved in an older format), and only those runs; progress, leaves and friends were kept.

### Deliverables

- **Server:** `GET /api/daily`, `POST /api/daily/start`, `POST /api/daily/finish`; the `DailyRun` table (three migrations; `score` is a decimal), included in the data export. The server re-checks every step's tries and hints and works out the time, penalties and score itself.
- **Engine:** `dailyMoves` (a place step per key, plus a split step per level that overflows) and `dailyTally`.
- **Client:** the Daily b-tree tab and page (intro, timed game, results, the day's finished tree, friends-only podium and list), the drag board with the number row, the first key already in the root, and the **Split and move up** button, short hints and mistake messages, and Build the tree removed from Practice.
- **Tests:** engine `daily`, server `daily` (scoring, penalties, one go a day, friends-only ranking), `DailyPage`, `dailyHints`.

### Verification summary

| Check                                        | Result               |
| -------------------------------------------- | -------------------- |
| Engine, client and server tests              | 23, 154 and 129 pass |
| ESLint, TypeScript (strict), Prettier, build | Pass                 |

### Human review required

- Play it in a browser on desktop and phone to check the drop targets line up with the nodes.
- **Scoring:** the 10 s and 30 s penalties and 2 points per second are a first guess.
- **ID team:** check the hint and mistake wording in `client/src/lib/dailyHints.ts`.
- **Figma:** the Daily b-tree page, drag board and podium have no Figma frame.

---

## Entry 016: Animations and playback pacing

| Field        | Detail                                                                                                                                                                                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date         | 15 November 2026                                                                                                                                                                                                                                                                      |
| Requested by | Lonwabo Kwitshana                                                                                                                                                                                                                                                                     |
| Tool         | Claude Code (Anthropic), model Claude Opus 5.5                                                                                                                                                                                                                                        |
| Scope        | `styles/index.css`, `ui/stagger.ts`, `AppShell.tsx`, `Header.tsx`, `RewardToast.tsx`, `SceneBackdrop.tsx`, `GroveTree.tsx`, `BTreeView.tsx`, `KeyBead.tsx`, `layout.ts`, `usePlayback.ts`, `NarrationBar.tsx`, `TracePlayer.tsx`, quiz, daily and page components, unit and e2e tests |
| Status       | Completed on branch `enhancement/animations`; changes left uncommitted for team review                                                                                                                                                                                                |

### Request

> Review the application and add appropriate animations to make it feel more lively.
>
> Follow-ups after trying it:
>
> 1. The page shifts up slightly when the notes appear on the tree in the visualiser. This happens on most, if not all, pages that show a B-tree.
> 2. Slow down the time between steps during playback, and make the transitions smoother.
> 3. Slower still: make each step last 5 seconds.
> 4. Fix the end-to-end tests that now fail in CI (colour-contrast violations on every screen).
> 5. Record these prompts in the prompt log.

### Clarifications provided

- **Approach:** a small set of reusable CSS animations (`rise`, `pop`, `bump`, `wiggle`, `sway`, `drift`, `twinkle`, `bob`, `sprout`, `fill-in`, `fade-in`) plus the existing `motion` library for the reward toast and the tree. A `stagger(i)` helper delays list items so they cascade in. Entrance animations leave no transform behind once finished, so they cannot break fixed-position elements such as drag overlays.
- **Accessibility (NFR4):** the existing reduced-motion rule was extended to cancel animation delays and looping animations, and `MotionConfig reducedMotion="user"` still applies. The tree stops swaying while decorations are being arranged, so dragging stays accurate.
- **Page shift:** the cause was already there before this work. The tree drawing only made room for a note while one was showing, so it changed height from step to step. A `calloutSpace` option now keeps that room on every step in the visualiser, the lesson "Watch" tab and practice help.
- **Pacing:** with the voice off, each step lasts 5 s at 1x speed (previously 1.4 s); the speed slider still scales this (10 s at 0.5x, 2.5 s at 2x). With the voice on, playback waits for the narration and then pauses 1 s (previously 0.35 s). The tree uses a softer spring, and colour changes (highlight, overflow, yarn) fade instead of switching.
- **E2E failures:** the app's colours were fine. Axe scanned while text was still fading in, so it measured low contrast. The smoke test now waits for entrance animations to finish before scanning; looping background animations are ignored because they never change text visibility.

### Deliverables

- **Animations:** page fade-in on navigation; cascading entrances on the welcome, lessons, ready, grove and practice pages; hover lift on buttons, nav pills and cards; leaf counter bump and logo wiggle in the header; spring-in reward toast; living grove scene (swaying tree, drifting clouds, twinkling fireflies); quiz answers that pop when right and shake when wrong; hints and finish cards that pop in; progress bars that fill and slide.
- **Visualiser:** fixed tree height while stepping, slower playback, softer movement, fading notes, narration and colour changes.
- **Tests:** `MotionGlobalConfig.skipAnimations` in the unit test setup; the reward toast test waits for the exit animation; playback tests read the timing constants from `usePlayback.ts`; `settleAnimations()` added to `e2e/smoke.spec.ts`.

### Verification summary

| Check                                        | Result                                                            |
| -------------------------------------------- | ----------------------------------------------------------------- |
| Client unit tests                            | 170 pass                                                          |
| End-to-end tests (Chromium and mobile)       | 24 pass locally                                                   |
| ESLint, TypeScript (strict), Prettier, build | Pass                                                              |
| Browser check                                | Welcome, lessons and visualiser pages screenshotted mid-animation |

### Human review required

- Try it on a phone and a slower laptop to check the animations feel smooth and not distracting.
- **Pacing:** 5 s per step and the 1 s pause after narration are the requester's choice; ID team to confirm they suit the lesson length.
- **Lesson tabs:** switching between read, watch and listen now rebuilds the panel, so narration partway through restarts.
- **CI:** push the branch and confirm the end-to-end job passes.
- **Figma:** none of the motion has a Figma reference.

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
