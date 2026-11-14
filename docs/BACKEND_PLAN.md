# Backend Remaining Work: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the Backend section of [TODO.md](TODO.md) to prototype level for the COS750 demo (16–17 November 2026): rewards, badges, friends and privacy, account settings and test coverage. Deployment is optional and comes last.

**Architecture:** Same Express 5 + Prisma 7 + PostgreSQL 16 stack. New business rules go in small modules under `server/src/lib/`, routes stay thin, and every new request or response shape is a Zod schema in `packages/shared/src/api.ts` so the client can use it.

**Tech Stack:** Express 5, Prisma 7 (generated client committed in `server/src/generated/`), Zod 4, express-rate-limit 8, Vitest + Supertest.

**Spec:** [docs/TODO.md](TODO.md) (Backend section), the [COS750 Examination Specification](../../COS750_ExaminationSpecification_V1.pdf) (a prototype with assessment and scaffolding before the lecture), and the ID/SE documents the CHANGELOG cites (only first-try, no-hint answers count; ready at 80%).

**Marker:** Work tagged **`frontend change required`** needs matching client work before students can see it. The [Frontend hand-off](#frontend-hand-off) table lists all of it.

## Scope

This is a prototype, so the following are **out of scope** and should be ticked off in `TODO.md` as "won't do (prototype)":

- Password reset by email.
- Production database backups.
- Revocable sessions. The 14-day JWT cookie is fine for a prototype.

Deployment is **optional** (Task 6). Only start it once Tasks 1–5 are merged.

## Workflow: one branch per task

Each task below is **one branch and one pull request** into `main`, following the repo's existing `feat/...` naming. The numbered sub-tasks inside a task are commits on that branch.

For every task:

1. `git switch main && git pull && git switch -c <branch>`
2. Work through the sub-tasks, committing after each one.
3. Before opening the PR:
   - Tick the task's items in `docs/TODO.md`.
   - Add the changes under `## [Unreleased]` in `CHANGELOG.md`.
   - Add the task's **PROMPT_LOG entry**. Use the next free `Entry NNN` number and the template at the bottom of `PROMPT_LOG.md`. **Kyle supplies the content of each entry; do not write one without it.**
4. CI must be green (`format:check`, `lint`, `typecheck`, `test`, `build`), then merge.

## Global Constraints

- Node `>=20.19` (`.nvmrc`).
- Request bodies are validated with `validateBody(<shared schema>)`. Errors are thrown as `HttpError(status, message)`.
- Every new table has `userId` with `onDelete: Cascade`, so `DELETE /api/account` still removes everything (POPIA, FR10).
- A friend never sees quiz answers, scores, mastery, hints, leaves or badges. `FriendSummary` and `FriendGrove` keep their current fields.
- Migrations: `npm run db:migrate -w server -- --name <name>`. Commit the migration folder **and** the regenerated `server/src/generated/prisma/` files.
- Database tests use `describe.skipIf(!hasDb)`, like `server/test/auth.test.ts`, and clean up the users they create.

## Review Focus

1. **Duplicate requests paying twice.** Two parallel `PUT /progress` calls that both complete module 1 currently pay +30 twice. The new streak and ready-check bonuses would race the same way. Expected: each payout happens once. _Pinned in 2.1._
2. **Free leaves from hints.** `POST /hints` pays +5 on every call and takes no body, so a loop earns unlimited leaves. Expected: a hint pays once. _Pinned in 2.3._
3. **South African day boundaries.** `streakDays` uses UTC dates, so practice at 00:30 SAST counts as the day before. Expected: days follow `Africa/Johannesburg`. _Pinned in 2.1._
4. **Friend requests that cross.** If B already asked A and A then asks B, a second pending row is created instead of making them friends. Expected: the crossing request accepts the existing one. _Pinned in 4.1._
5. **Rate limits behind proxies (only if deploying).** Behind Render or Vercel, `req.ip` can be the proxy's IP, so the whole class would share one 20-per-15-minute login bucket. Expected: one bucket per student. _Pinned in 6.2._

---

## Order

| Task         | Branch                  | TODO items                                | Frontend? |
| ------------ | ----------------------- | ----------------------------------------- | --------- |
| 1            | `test/backend-coverage` | Quality 1 and 2                           | –         |
| 2            | `feat/rewards`          | Rewards 1, 2, 4                           | **yes**   |
| 3            | `feat/badges`           | Rewards 3                                 | **yes**   |
| 4            | `feat/friends-privacy`  | Friends 1, 2, 3                           | **yes**   |
| 5            | `feat/account-settings` | Account 1, (Account 2, 3 marked won't do) | **yes**   |
| 6 (optional) | `chore/deployment`      | Ops 1, 2, 3 (Ops 4 marked won't do)       | **yes**   |

Task 1 comes first so the routes changed in Tasks 2–5 already have tests. Task 3 needs `passedReadyCheck` from Task 2. Tasks 4 and 5 don't depend on 2 or 3; they can run in parallel with them on separate branches if someone else picks one up.

With the demo on 16–17 November, Tasks 1–3 show best in the demo (bonuses and badges on screen). Tasks 4–5 come next.

---

## Task 1: Backend test coverage

**Branch:** `test/backend-coverage`

**Status:** done. Merged into `main` on 13 November 2026 (PR #10).

These tests describe existing behaviour, so they should pass straight away. Any failure is a real bug: fix it on this branch and note it in the CHANGELOG.

### 1.1 Test helpers

**Files:** Create `server/test/helpers.ts`

**Produces:**

- `makeApp(): Promise<Express>`: sets the test env vars, then dynamically imports `createApp`.
- `student(app, name?): Promise<{ agent: TestAgent; id: string; email: string }>`: creates the user directly with Prisma and sets `Cookie: btree_session=<signSession(id)>` on a `request.agent(app)`. This skips HTTP register, so the IP-based `authLimiter` (20 per 15 minutes) is never hit.
- `befriend(a, b): Promise<void>`: makes two students friends through the API.
- `removeStudents(ids: string[]): Promise<void>`
- `ensureCatalogue(): Promise<void>`: upserts every `DECORATIONS` row.
- `giveLeaves(userId, amount)` and `completeModules(userId, n)`

- [x] Commit `test(server): shared helpers for database tests`

### 1.2 Grove, decorations and lecture questions

**Files:** Create `server/test/grove.test.ts`

- [x] Write these tests:
  - `GET /leaves returns balance and newest-first transactions`
  - `GET /decorations lists the catalogue with owned flags`
  - Purchase:
    - unknown id → 404
    - already owned → 409
    - too few leaves → 400 `'Not enough leaves yet'`
    - success → 201, the balance drops by exactly `cost`, and a `purchase` row with `-cost` exists
  - `PUT /grove/placement only updates the caller's rows`, and 51 items → 400
  - Lecture questions:
    - create → 201
    - list in creation order
    - delete your own → 204
    - delete someone else's → 404
    - more than 280 characters → 400
- [x] Run `npm test -w server -- test/grove.test.ts`. Expected: PASS.
- [x] Commit `test(server): cover grove, decorations and lecture questions`

### 1.3 Friends, cheers and privacy

**Files:** Create `server/test/friends.test.ts`

- [x] Write these tests:
  - Friend requests:
    - to an unknown email → 202, no row created
    - to yourself → 202, no row created
    - only the addressee can accept
  - `GET /friends` lists accepted friends and incoming requests
  - Friend grove: friend → 200, stranger → 404
  - Cheers:
    - to a friend → 201
    - to a stranger → 403
    - message over 140 characters → 400
    - `GET /cheers` returns them newest first
  - **Privacy:** give B quiz attempts, mastery, hints and leaves first, then check that A's view of B's grove has exactly the `FriendGrove` fields:
    ```ts
    expect(Object.keys(res.body).sort()).toEqual(Object.keys(FriendGrove.shape).sort());
    expect(JSON.stringify(res.body)).not.toMatch(/score|mastery|correct|hint|leaves|answer|email/i);
    ```
    Run the same key check on each entry of `GET /friends`.
- [x] Run `npm test -w server -- test/friends.test.ts`. Expected: PASS.
- [x] Commit `test(server): cover friends and cheers; friends never see scores`

**Before merging:** TODO, CHANGELOG, PROMPT_LOG entry (content from Kyle).

---

## Task 2: Rewards — `frontend change required`

**Branch:** `feat/rewards`

**Status:** done on `feat/rewards` on 14 November 2026, not merged yet.

**Changes from the plan**, agreed during review:

- Correct-answer leaves are paid once per question (dedupe key `answer:<itemId>`). Retakes still count toward mastery.
- Hint leaves are paid once per question and hint (`hint:<itemId>:<hint>`), not once per day.
- The client was updated in the same branch: the leaf count follows the once-per-question rule, `readHint` sends `{ itemId, hint }`, "tap the nodes" (`trace-path`) questions can be answered, and multiple-choice options are shuffled once per page load.

### 2.1 Pay each reward once, and use South African days

**Files:**

- Modify `server/prisma/schema.prisma`: add `LeafTransaction.dedupeKey String?` and `@@unique([userId, dedupeKey])`. Migration name: `leaf_dedupe_key`.
- Modify `packages/shared/src/constants.ts`: `DAY_TIMEZONE = 'Africa/Johannesburg'`.
- Create `server/src/lib/days.ts`.
- Modify `server/src/lib/progress.ts` and `server/src/routes/progress.ts`.
- Tests: `server/test/days.test.ts` (no database) and `server/test/rewards.test.ts`.

**Produces:**

- `dayKey(d: Date, tz = DAY_TIMEZONE): string`: returns `'YYYY-MM-DD'` using `Intl.DateTimeFormat('en-CA', { timeZone })`.
- `addDays(key: string, n: number): string`
- `awardLeaves(userId, reason, dedupeKey?: string): Promise<boolean>`: returns `false` instead of throwing on a unique violation (Prisma `P2002`).
- `streakDays(userId, now = new Date())`: the same rule as now, but days come from `dayKey`.
- Lesson leaves use the dedupe key `lesson:<moduleId>`.

- [x] Tests (write them, watch them fail, implement, watch them pass):
  - `dayKey(new Date('2026-11-12T22:30:00Z')) === '2026-11-13'`
  - `addDays('2026-11-01', -1) === '2026-10-31'`
  - `parallel module completion pays lesson leaves once`: run two `PUT /progress` calls with `completed: true` in `Promise.all`; the balance is `30`.
- [x] Commit `feat(server): idempotent leaf awards; streak days in SAST`

### 2.2 3-day streak bonus

**Files:** Modify `packages/shared/src/constants.ts` (`STREAK_BONUS_DAYS = 3`) and `packages/shared/src/api.ts`. Create `server/src/lib/rewards.ts`. Modify `server/src/routes/progress.ts`.

**Produces:**

- Shared types:
  - `LeafBonus = { reason: 'streak' | 'readyCheck'; amount: number }`
  - `AttemptResult = ObjectiveMastery & { bonuses: LeafBonus[] }`
  - `StreakSummary = { days: number }`
- `awardStreakBonus(userId, now = new Date()): Promise<LeafBonus | null>`: when `streakDays >= 3`, pays `streak` with the dedupe key `streak:<first day of this streak>`. A streak pays once; a broken and rebuilt streak pays again.
- `POST /api/attempts` now returns `201 AttemptResult`. This only adds a field, and the client ignores the body today.
- `GET /api/streak` returns `StreakSummary`.

- [x] Tests:
  - `pays +15 once when a 3-day streak is reached`: backdate attempts by 1 and 2 days with Prisma, then post one today. `bonuses` is `[{ reason: 'streak', amount: 15 }]`, and a second post the same day returns `[]`.
  - `no bonus for a 2-day streak`
  - `pays again after the streak breaks and is rebuilt`
  - `GET /streak returns { days: 3 }`
- [x] Commit `feat(server): 3-day streak bonus and GET /streak`

### 2.3 Check first tries and hints on the server

**Files:**

- Modify `server/prisma/schema.prisma`: add `model HintView { id, userId, itemId String, hint Int, createdAt; user cascade; @@index([userId, itemId]) }`. Migration name: `hint_views`.
- Modify `packages/shared/src/constants.ts` (`RUN_GAP_MINUTES = 30`) and `packages/shared/src/api.ts` (`HintBody`).
- Create `server/src/lib/attempts.ts`.
- Modify `server/src/routes/progress.ts`.
- Test: `server/test/attempts.test.ts`.

**Produces:**

- `HintBody = { itemId: string (1–100); hint: 1 | 2 | 3 }`
- `trustedAttempt(userId, claim, now = new Date()): Promise<{ firstAttempt: boolean; hintsUsed: number }>`:
  - `latest` is the student's most recent attempt on `claim.itemId`.
  - A **new run** means there is no `latest`, or `latest` was correct, or `latest` is older than `RUN_GAP_MINUTES`.
  - `firstAttempt = claim.firstAttempt && newRun`.
  - `hintsUsed = min(3, max(claim.hintsUsed, distinct hints viewed for this item since <since>))`.
  - `<since>` is `latest.createdAt` when `latest` was correct and is within the gap; otherwise it is `now − RUN_GAP_MINUTES`.
- `POST /attempts` stores and scores the **trusted** values (mastery and `firstTry`/`withHint` leaves).
- `POST /hints` (body `HintBody`) writes a `HintView` row and pays `hintRead` with the dedupe key `hint:<itemId>:<hint>:<dayKey>`.

- [x] Tests:
  - `a retry after a wrong answer cannot claim firstAttempt`: `counted` stays 0, and the leaves are paid as `withHint`.
  - `a hint viewed before answering counts even when the client sends hintsUsed 0`
  - `retaking an item after answering it correctly counts again`
  - `an attempt after the 30-minute gap counts again`
  - `POST /hints pays once per item, hint and day`: sending it 5 times gives a balance of 5.
  - `POST /hints without itemId → 400`
- [x] Commit `feat(server): verify firstAttempt and hintsUsed on the server`

Put this limit in the CHANGELOG: the server holds no answer keys, so a student who sends hand-made requests can still fake correct answers. This sub-task only closes the easy route of replaying an answer after a hint or a wrong try.

### 2.4 Ready-check bonus

**Files:**

- Modify `packages/shared/src/constants.ts`:
  - `READY_CHECK_ITEM_IDS = ['r-o1', …, 'r-o8']`, matching `client/src/content/quizzes/module-10.json`
  - `READY_CHECK_PASS = Math.ceil(READY_THRESHOLD * 8)`, which is 7
- Modify `server/src/lib/rewards.ts` and `server/src/routes/progress.ts`.
- Modify `client/src/content/content.test.ts`: add one assertion that the module 10 item ids equal `READY_CHECK_ITEM_IDS`.

**Produces:**

- `passedReadyCheck(userId): Promise<boolean>`: true when at least 7 of the 8 ready-check items have a stored attempt that is correct, a first attempt, and used no hints.
- `awardReadyCheckBonus(userId): Promise<LeafBonus | null>`: dedupe key `readyCheck`. It is only called when the attempt's `itemId` is a ready-check item.

- [x] Tests:
  - `7 of 8 pays +60 once`
  - `6 of 8 pays nothing`
  - `answers that used hints do not count`
  - `other items never pay readyCheck`
- [x] Run `npm test -w server && npm test -w client`. Expected: PASS.
- [x] Commit `feat(server): ready-check bonus at 80%`

**Frontend change required:**

- `progressStore.recordAttempt` should add the `bonuses` from the `/attempts` response to the local `leaves` and `ledger`.
- The streak card should use `GET /api/streak`.
- `readHint` should send `{ itemId, hint }` to `POST /hints`. This client change can land before or after this branch, because the current server ignores the body.

**Before merging:** TODO, CHANGELOG, PROMPT_LOG entry (content from Kyle).

---

## Task 3: Badges — `frontend change required`

**Branch:** `feat/badges` (after Task 2 is merged)

**Status:** done on `feat/badges` on 14 November 2026. The rules are as in the table below, with no changes from the plan.

Rules (D2, as proposed):

| Badge         | Earned when                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| Explorer      | the warm-up is done and module 1 is complete                                                         |
| Splitter      | the 3 latest O5 attempts are all correct (matches the "Splitter streak!" text in `PracticePage.tsx`) |
| Root Raiser   | O6 is `mastered`                                                                                     |
| Lecture Ready | `passedReadyCheck` (Task 2.4)                                                                        |

### 3.1 Badge model and rules

**Files:**

- Modify `server/prisma/schema.prisma`: add `enum BadgeId { explorer splitter rootRaiser lectureReady }` and `model UserBadge { id, userId, badge BadgeId, awardedAt @default(now()); user cascade; @@unique([userId, badge]) }`. Migration name: `badges`.
- Modify `packages/shared/src/constants.ts` (`BADGES`: the `id`, `label` and `description` of each badge).
- Create `server/src/lib/badges.ts`.

**Produces:**

- `BADGE_RULES: Record<BadgeId, (userId: string) => Promise<boolean>>`
- `checkBadges(userId): Promise<BadgeId[]>`: creates any missing `UserBadge` rows whose rule passes. A unique violation counts as already awarded.

- [x] Tests: for each badge, one "earned" case and one "not yet" case, plus `each badge is awarded once`.
- [x] Commit `feat(server): badge model and award rules`

### 3.2 Award and read badges

**Files:** Modify `packages/shared/src/api.ts` (`Badge`) and `server/src/routes/progress.ts`.

**Produces:**

- `Badge = { id; label; description; awardedAt: string | null }`
- `checkBadges` runs after `PUT /progress`, `POST /attempts` and `POST /warmup`.
- `GET /api/badges` returns all four badges in `BADGES` order.

- [x] Tests: badges are awarded through the API, and `the friend grove does not include badges` (an extension of the privacy test from 1.3).
- [x] Commit `feat(server): award badges and GET /badges`

**Frontend change required:** show earned and locked badges on the Ready and Grove screens, using `GET /api/badges`.

**Before merging:** TODO, CHANGELOG, PROMPT_LOG entry (content from Kyle).

---

## Task 4: Friends and privacy — `frontend change required`

**Branch:** `feat/friends-privacy`

### 4.1 Decline, cancel and unfriend

**Files:** Modify `server/src/routes/friends.ts` and `packages/shared/src/api.ts` (`FriendsList`).

**Produces:**

- `GET /friends` returns `FriendsList = { friends; incoming: { id; fromName }[]; outgoing: { id; email; sentAt }[] }`.
- `POST /friends/requests/:id/decline`: only the addressee, only while pending. Deletes the row and returns 204, or 404.
- `DELETE /friends/requests/:id`: only the requester, only while pending. Returns 204, or 404.
- `DELETE /friends/:friendId`: removes the accepted friendship from either side. Returns 204, or 404.
- `POST /friends/requests`:
  - if the other student already sent me a pending request, accept it
  - if we are already friends, do nothing
  - the response is always 202, as now

- [ ] Tests:
  - decline (a stranger declining gets 404)
  - cancel (the addressee cancelling gets 404)
  - unfriend from either side; afterwards the grove returns 404 and cheers return 403
  - `crossing requests make A and B friends with one row`
  - `already friends creates no row`
  - the `outgoing` list
- [ ] Commit `feat(server): decline, cancel and unfriend; accept crossing requests`

### 4.2 Rate limits on friend requests and cheers

**Files:** Create `server/src/lib/rateLimit.ts`. Modify `server/src/routes/friends.ts`.

**Produces:**

- `perUserLimiter({ windowMs, limit }): RequestHandler`:
  - uses express-rate-limit, keyed by `uid(req)`
  - mounted **after** `requireAuth`
  - message: `{ error: 'Slow down a little and try again later' }`
- Limits:
  - friend requests: **10 per hour**
  - cheers: **20 per hour**

- [ ] Tests:
  - the 11th friend request gets 429 with that message
  - other students are not affected
  - the 21st cheer gets 429
- [ ] Commit `feat(server): per-student rate limits on friend requests and cheers`

### 4.3 Data export (POPIA right of access)

**Files:** Create `server/src/lib/export.ts`. Modify `server/src/routes/account.ts`. Test: `server/test/account.test.ts`.

**Produces:**

- `exportUserData(userId)`. It returns these keys:
  - `exportedAt`
  - `user`: `email`, `displayName`, `plantedAt`, `createdAt`
  - `modules`, `attempts`, `mastery`, `leaves`, `decorations`, `lectureQuestions`, `warmups`, `hintViews`, `badges`
  - `friendships`: `friendName`, `status`, `direction`, dates
  - `cheersSent` and `cheersReceived`, each with names only
- `GET /api/account/export` returns 200 JSON with `Content-Disposition: attachment; filename="btree-basic-data-<YYYY-MM-DD>.json"`.

- [ ] Tests:
  - every section is present
  - the export never contains `passwordHash`, any user id, or another student's email or attempts
  - a guest gets 401
- [ ] Commit `feat(server): data export endpoint`

**Frontend change required:**

- Decline, cancel and unfriend buttons.
- Pending requests shown outside the Account page.
- Show 429 messages on the friend-request and cheer actions.
- A "Download my data" link (`<a href="/api/account/export" download>`).

**Before merging:** TODO, CHANGELOG, PROMPT_LOG entry (content from Kyle).

---

## Task 5: Account settings — `frontend change required`

**Branch:** `feat/account-settings`

### 5.1 `PATCH /api/account`

**Files:**

- Modify `server/prisma/schema.prisma`: add `enum Theme { day dusk }` and `User.theme Theme?`. Migration name: `user_theme`.
- Modify `packages/shared/src/api.ts`: add `AccountPatchBody`, and add `PublicUser.theme: 'day' | 'dusk' | null`.
- Modify `server/src/routes/account.ts`, `server/src/routes/auth.ts` (`toPublicUser`, and export `authLimiter`), and `server/src/lib/export.ts` (add `theme`).

**Produces:**

- `AccountPatchBody = { displayName?: string (trim, 1–40); theme?: 'day' | 'dusk'; currentPassword?: string; newPassword?: string (8–128) }`
  - at least one field must be set
  - `newPassword` requires `currentPassword`
- `PATCH /api/account` returns `200 PublicUser`.
  - A wrong `currentPassword` returns 400 `'Current password is incorrect'`. It is 400, not 401, so the client doesn't treat it as being signed out.
  - `authLimiter` is mounted on this route.

- [ ] Tests:
  - renaming shows the new name in a friend's `GET /friends`
  - the theme is saved and returned by `/auth/session`
  - after a password change the old password fails and the new one works
  - wrong current password → 400
  - empty body → 400
  - `newPassword` without `currentPassword` → 400
- [ ] Commit `feat(server): update display name, theme and password`

### 5.2 Record what is out of scope

- [ ] In `docs/TODO.md`, mark these as "won't do (prototype)":
  - password reset
  - sessions, with the reason: "the 14-day JWT cookie is acceptable for a prototype"
  - backups
- [ ] Commit `docs: mark prototype out-of-scope items`

**Frontend change required:** a profile settings section on the Account page (name and password). Apply `user.theme` on sign-in when it isn't null, and `PATCH` the theme when a signed-in student changes it.

**Before merging:** CHANGELOG, PROMPT_LOG entry (content from Kyle).

---

## Task 6 (optional, last): Deployment — `frontend change required`

**Branch:** `chore/deployment`. Only start once Tasks 1–5 are merged and there is time before the demo. The demo can run locally (`npm run dev`).

### 6.1 Health check and release step

**Files:**

- Modify `server/src/routes/health.ts`.
- Create `server/src/lib/catalogue.ts`.
- Modify `server/src/index.ts`, `server/prisma/seed.ts` and `server/package.json`.
- Tests: `server/test/health.test.ts` and `server/test/catalogue.test.ts`.

**Produces:**

- `GET /api/health/ready`: returns `200 { status: 'ok', db: 'up' }`, or `503 { status: 'unavailable', db: 'down' }` when `SELECT 1` fails or takes more than 2 seconds. `GET /api/health` stays a liveness check with no database call.
- `syncCatalogue()`: upserts the `DECORATIONS` rows when the server starts, and never deletes any. It replaces `ensureCatalogue` in the test helpers.
- `seed.ts` refuses to run when `NODE_ENV === 'production'`, so the demo users never reach a live database.
- A new `"release": "prisma migrate deploy"` script in `server/package.json`.

- [ ] Tests:
  - ready → 200 with a database
  - ready → 503 when `$queryRaw` is mocked to reject
  - `syncCatalogue` restores a cost that was changed in the database
- [ ] Commit `feat(server): readiness check; catalogue sync on boot; production-safe seed`

### 6.2 Render and Vercel

**Files:**

- Create `render.yaml`:
  - build: `npm ci --include=dev && npm run build -w server`
  - release: `npm run release -w server`
  - start: `npm start`
  - health check: `/api/health`
  - secrets go in the dashboard only
- Create `client/vercel.json` (**frontend**): rewrite `/api/:path*` to the Render URL, plus an SPA fallback. The client and API then share one origin, so the existing `SameSite=Lax` cookie keeps working.
- Modify `server/src/env.ts` (`TRUST_PROXY_HOPS`, default 1) and `server/src/app.ts` (`app.set('trust proxy', env.TRUST_PROXY_HOPS)`).
- Create `docs/DEPLOYMENT.md`.

- [ ] Test: with `TRUST_PROXY_HOPS=2`, two different first `X-Forwarded-For` IPs get separate `authLimiter` buckets.
- [ ] Staging check:
  - sign in and reload on desktop and on a phone
  - `GET /api/health/ready` returns 200
- [ ] Commit `chore: deploy config for Render and Vercel`

**Frontend change required:** `client/vercel.json` and the Vercel project setup.

**Before merging:** TODO, CHANGELOG, PROMPT_LOG entry (content from Kyle).

---

## Frontend hand-off

| Task | Client work                                                                                                                   |
| ---- | ----------------------------------------------------------------------------------------------------------------------------- |
| 2    | Add `bonuses` from `/attempts` to the local ledger; streak card from `GET /api/streak`; `POST /hints` with `{ itemId, hint }` |
| 3    | Badges on the Ready and Grove screens from `GET /api/badges`                                                                  |
| 4    | Decline, cancel and unfriend buttons; pending requests outside Account; 429 messages; "Download my data" link                 |
| 5    | Profile settings (name, password); apply and save `theme` for each account                                                    |
| 6    | `client/vercel.json`; Vercel project setup (optional)                                                                         |
