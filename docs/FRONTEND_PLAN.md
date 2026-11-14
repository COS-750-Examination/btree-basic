# Frontend Remaining Work: Handover

> **How to use this document.** It is written so you can hand it straight to Claude Code (or read it yourself): "Read `docs/FRONTEND_PLAN.md` and do Task N." Each task says which branch to use, which files to touch, which API it calls, and how to check it is done. The backend for every task here is already built and merged on `main`, unless the task says otherwise.

**Goal:** Finish the Frontend section of [TODO.md](TODO.md) for the COS750 demo (16–17 November 2026). Most of the work connects screens to backend features that already exist.

**Stack:** React 18, Vite, Tailwind CSS 4 (tokens in `client/src/styles/tokens.css`), TanStack Query, Zustand, React Router, dnd-kit, Vitest with React Testing Library, and Playwright with axe.

**Related docs:** [TODO.md](TODO.md) (the checklist), [BACKEND_PLAN.md](BACKEND_PLAN.md) (how the backend was built), [LOCAL_DEV.md](LOCAL_DEV.md) (setup), and the root `CHANGELOG.md`.

---

## Before you start

```sh
git switch main && git pull
npm install
npm run db:up && npm run db:migrate   # the backend added 4 migrations since 0.1.0
npm run dev                           # API on :4000, client on :5173 (Vite proxies /api)
```

Register an account in the app to test signed-in features. Seeded demo users (`npm run db:seed`, password `btree-demo-123`) are handy for friend features.

## Ways of working

- **One branch and one pull request per task**, named as in the task. CI must be green: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` and `npm run test:e2e`.
- **Before merging a task:**
  - Tick its line(s) in `docs/TODO.md`, with the date.
  - Add what changed under `## [Unreleased]` in `CHANGELOG.md`.
  - Add a `PROMPT_LOG.md` entry for the **opening prompt** of the task, if you used GenAI. The module requires this, and the template is at the bottom of that file. Follow-up prompts within a task are not logged.
- **Use the shared contracts.** Every request and response shape is a Zod schema in `packages/shared/src/api.ts` (import from `@btree/shared`). Pass the schema to `api.get` / `api.post` in `client/src/api/client.ts` so responses are checked.
- **Errors:** the API always replies `{ error: string, details? }`. `api.*` throws `ApiRequestError` with `.status` and `.message` set from that. Show `.message` to the student; it is already written for them.
- **Guests must keep working** (NFR7). Anything that needs the server is only for signed-in students; guests get a short "Sign in to …" note instead of an error.
- **Accessibility:** keyboard access for everything clickable, `role="status"` or `role="alert"` for messages, and never colour alone to show state. The axe checks in `client/e2e/smoke.spec.ts` must stay clean in Day and Dusk.

## Already done on the frontend (don't redo)

These landed with the backend work on `feat/rewards` and are on `main`:

- `progressStore.recordAttempt` pays leaves only for the first correct answer to a question. `readHint(itemId, hint)` pays once per question and hint, and sends `{ itemId, hint }` to `POST /api/hints`.
- "Tap the nodes" (`trace-path`) questions can be answered in `QuestionCard`.
- Multiple-choice options are shuffled once per page load (`components/quiz/shuffle.ts`).
- Tests: `progressStore.test.ts`, `QuestionCard.test.tsx` and `shuffle.test.ts`.

---

## API reference (new since 0.1.0)

All need a signed-in student (401 for guests). Types are in `@btree/shared`.

| Endpoint                                 | Request                            | Response                                                            | Notes                                                                                                                                                                       |
| ---------------------------------------- | ---------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/attempts`                     | `QuizAttemptBody` (unchanged)      | `201 AttemptResult` = `ObjectiveMastery & { bonuses: LeafBonus[] }` | `LeafBonus = { reason: 'streak' \| 'readyCheck'; amount }`. Streak +15 once per 3-day streak; ready check +60 once.                                                         |
| `POST /api/hints`                        | `HintBody` `{ itemId, hint: 1–3 }` | `201 { ok: true }`                                                  | Already wired.                                                                                                                                                              |
| `GET /api/streak`                        | –                                  | `StreakSummary` `{ days }`                                          | Days in South African time. Counts today or yesterday onward.                                                                                                               |
| `GET /api/badges`                        | –                                  | `Badge[]` (always 4, in `BADGES` order)                             | `Badge = { id, label, description, awardedAt: string \| null }`. `null` = locked.                                                                                           |
| `GET /api/friends`                       | –                                  | `FriendsList` `{ friends, incoming, outgoing }`                     | `outgoing = { id, email, sentAt }[]` (new).                                                                                                                                 |
| `POST /api/friends/requests`             | `{ email }`                        | `202 { ok: true }` always                                           | Never reveals whether the email exists. If they had already asked you, you become friends at once. **429** after 10 per hour.                                               |
| `POST /api/friends/requests/:id/decline` | –                                  | `204`, or 404                                                       | Only the student who received it.                                                                                                                                           |
| `DELETE /api/friends/requests/:id`       | –                                  | `204`, or 404                                                       | Cancel: only the student who sent it.                                                                                                                                       |
| `DELETE /api/friends/:id`                | –                                  | `204`, or 404                                                       | Unfriend, from either side. Afterwards their grove is 404 and cheers are 403.                                                                                               |
| `POST /api/friends/:id/cheers`           | `CheerBody` (unchanged)            | `201`                                                               | **429** after 20 per hour.                                                                                                                                                  |
| `PATCH /api/account`                     | `AccountPatchBody`                 | `200 PublicUser`                                                    | `{ displayName?, theme?, currentPassword?, newPassword? }`. Wrong current password: **400** "Current password is incorrect". Password changes: **429** after 10 per 15 min. |
| `GET /api/account/export`                | –                                  | JSON file download                                                  | POPIA right of access. A plain `<a download>` works because the cookie goes along.                                                                                          |
| `GET /api/auth/session`, login, register | (unchanged)                        | `PublicUser` now has `theme: 'day' \| 'dusk' \| null`               | `null` until the student picks one while signed in.                                                                                                                         |

The 429 message is always "Slow down a little and try again later".

---

## Order

The demo is on 16–17 November. Tasks 1–5 are the ones a marker will see, so do them first. Tasks 6–10 are as time allows.

| Task          | Branch                      | TODO item(s)                                     | Backend ready?                             |
| ------------- | --------------------------- | ------------------------------------------------ | ------------------------------------------ |
| 1             | `feat/rewards-ui`           | Show reward bonuses; Streak card                 | Yes                                        |
| 2             | `feat/badges-ui`            | Badges on Ready and Grove                        | Yes                                        |
| 3             | `feat/friends-ui`           | Friend requests (decline, cancel, unfriend, 429) | Yes                                        |
| 4             | `feat/account-settings-ui`  | Profile settings; Download my data               | Yes                                        |
| 5             | `feat/error-handling`       | Error boundary and offline banner                | n/a                                        |
| 6             | `feat/build-the-tree`       | Practice activity 4, Build the tree (O6)         | n/a                                        |
| 7             | `feat/decoration-placement` | Drag decorations into place                      | **No**, needs a small backend change first |
| 8             | `feat/mini-lessons`         | Mastery mini-lessons behind "Need more?"         | n/a (needs ID-team content)                |
| 9             | `chore/pixel-pass`          | Pixel pass against Figma                         | n/a                                        |
| 10            | `test/frontend-quality`     | Unit tests, Playwright journeys, screen reader   | n/a                                        |
| 11 (optional) | `chore/deployment`          | `client/vercel.json`, only if the team deploys   | See BACKEND_PLAN Task 6                    |

---

## Task 1: Rewards feedback

**Branch:** `feat/rewards-ui`

### 1.1 Show bonuses as soon as they're earned

Today the client ignores the `/attempts` response, so the +15 streak and +60 ready-check bonuses only appear in the header after a reload.

- In `client/src/stores/progressStore.ts`, `recordAttempt` saves with `api.post('/attempts', …)` and discards the result. Instead:
  - Pass the `AttemptResult` schema.
  - For each item in `bonuses`, add `amount` to `leaves` and push `{ amount, reason, at: Date.now() }` onto `ledger`.
  - Keep the call fire-and-forget for the UI (don't block the question on it).
- Don't compute these bonuses on the client. The server decides them, so guests don't get them.
- Optional but nice: a short `role="status"` toast, such as "+60 leaves: you're ready for the lecture!"

**Check:**

- Unit test in `progressStore.test.ts`: mock `api.post` to resolve with `bonuses: [{ reason: 'readyCheck', amount: 60 }]`, and expect `leaves` and `ledger` to include it.
- In the app: pass the ready check (`/quiz/10`, 7 of 8 right first try without hints). The header jumps by +60 without a reload.

### 1.2 Streak card

Nothing on screen shows the day streak yet. The Grove page only lists "3-day practice streak" in the rewards table.

- Add a streak card where the Figma shows it (the Grove screen), using `GET /api/streak` (TanStack Query key `['streak']`).
- Refetch it after an answer is saved, by invalidating `['streak']`.
- Guests: hide the card, or show "Sign in to keep a streak".
- Use the `STREAK_BONUS_DAYS` constant (3) from `@btree/shared` for any "x more days" text.

### 1.3 Fix the practice streak text

`client/src/pages/PracticePage.tsx` (around line 205) says "`n` more and you earn the Apples decoration for free". This isn't true: nothing awards free Apples.

- Three correct split answers (O5) in a row now earn the **Splitter** badge.
- Change the text to something like "`n` more in a row earns the Splitter badge", using `SPLITTER_RUN` from `@btree/shared`.
- Only show it on the **Split it yourself** activity, since the badge counts O5 answers only.

**Done when:** the TODO items "Show reward bonuses as soon as they're earned" and "Streak card" are ticked.

---

## Task 2: Badges

**Branch:** `feat/badges-ui`

- **Data:** `GET /api/badges` returns all four badges (Explorer, Splitter, Root Raiser, Lecture Ready) with `label`, `description` and `awardedAt`. Use query key `['badges']`.
- **Ready screen** (`client/src/pages/ReadyPage.tsx`): a badges card with all four.
  - Earned badges show the date earned.
  - Locked badges look like the locked decoration tiles (dashed outline) and say "Locked" in text, not only through colour.
  - Show the `description` so students know how to earn each one.
- **Grove screen** (`client/src/pages/GrovePage.tsx`): a compact badge strip, or the same card. Check the Figma for placement.
- **Keeping it fresh:** invalidate `['badges']` after an answer, module completion or warm-up is saved. Badges are awarded by those requests.
- **Guests:** show the four as locked, with "Sign in to earn badges".
- Badges are private. Never show them on a friend's grove (the API doesn't send them there).

**Check:**

- A unit test for the badge card: it renders earned and locked states from a mocked list.
- In the app: finish the warm-up and module 1, and Explorer shows as earned.

**Done when:** the TODO item "Badges … show them on the Ready and Grove screens" is ticked.

---

## Task 3: Friends

**Branch:** `feat/friends-ui`

- **Hooks** (`client/src/api/hooks.ts`):
  - Type `useFriends` with `FriendsList` (pass the schema).
  - Add `useDeclineRequest`, `useCancelRequest` and `useUnfriend` mutations. Each invalidates `['friends']`.
- **Account page** (`client/src/pages/AccountPage.tsx`):
  - Incoming requests: **Accept** (exists) and **Decline**.
  - Outgoing requests (new): show the email and when it was sent, with **Cancel request**.
  - Friends: an **Unfriend** button, with a confirm step ("Remove Sam from your friends?").
  - After sending a request, keep the existing neutral text (the API never says whether the email exists). Refetch the list too, because crossing requests make two students friends at once.
- **Pending requests outside the Account page:** surface incoming requests where students will see them. Options are the "Friends' groves" card on the Grove page, or a small count in the header. Check the Figma.
- **429 messages:** when sending a request or a cheer (`useSendCheer` on the friend's grove) fails with status 429, show `error.message` next to the button with `role="alert"`. Right now these failures are silent.
- **After unfriending:** `/grove/:friendId` for that student returns 404. Show "You're no longer friends" with a link back, not a broken page.

**Check:**

- Unit tests for the new hooks or the Account page sections, with the API mocked.
- In the app (two browsers): send, cancel, re-send, decline, re-send, accept, then unfriend. Send 11 requests to made-up emails; the 11th shows the slow-down message.

**Done when:** the TODO item "Friend requests: add decline and unfriend buttons …" is ticked.

---

## Task 4: Account settings

**Branch:** `feat/account-settings-ui`

- **Profile settings** (Account page, signed in only):
  - **Display name:** a form that sends `PATCH /api/account` with `{ displayName }`. On success, `queryClient.setQueryData(['me'], user)` so the header updates.
  - **Password:** current password, new password and a confirm field (the confirm check is client-only). Send `{ currentPassword, newPassword }`.
    - Show 400 "Current password is incorrect" and 429 messages inline.
    - Field errors come back in `error.details` (Zod issues). `AccountPatchBody` from `@btree/shared` can validate before sending.
    - Other devices stay signed in after a password change. That's a known prototype decision, so no UI is needed for it.
- **Theme per account:**
  - On sign-in or session load (the effect in `client/src/components/layout/AppShell.tsx`), if `me.data.theme` isn't null, call `useThemeStore.getState().setTheme(me.data.theme)`.
  - In `AppearanceCard` (Account page), when a **signed-in** student picks a theme, also `PATCH { theme }`. Update the card's text from "saved on this device" to say it follows the account when signed in.
  - Guests keep using localStorage, as now.
  - `THEMES` and `Theme` are exported from `@btree/shared`, so `themeStore.ts` can use them instead of its own type.
  - Changing the theme is not rate-limited, so saving on every toggle is fine.
- **Download my data:** add `<a href="/api/account/export" download>Download my data</a>` near "Delete account", with one line explaining it (a copy of everything the app stores about you, POPIA).

**Check:**

- Unit tests for the forms (success, wrong password, 429) with the API mocked.
- In the app:
  - Rename yourself, and a friend sees the new name.
  - Pick Dusk, sign out, clear site data, sign in, and you're back in Dusk.
  - The download link saves a `btree-basic-data-<date>.json` file.

**Done when:** the TODO items "Profile settings …" and "Download my data link …" are ticked.

---

## Task 5: Error boundary and offline banner

**Branch:** `feat/error-handling`

Saves are fire-and-forget. `save()` in `progressStore.ts` only does `console.warn` on failure, so a student never learns that their progress didn't reach the server.

- **Offline banner:** listen to `online` and `offline` events (and `navigator.onLine`). Show a banner such as "You're offline. Your progress is kept on this device and saved when you reconnect." Use `role="status"` and keep it out of the way of content.
- **Failed saves:**
  - Have `save()` set store state (for example `lastSaveError`) instead of only logging.
  - Show a dismissible banner: "We couldn't save your last change."
  - If the failure is 401 (session expired), offer "Sign in again" instead.
- **Error boundary:** wrap the `<Outlet />` in `AppShell.tsx`. The fallback should be friendly, with "Something went wrong" and a **Reload** button, inside the normal layout so the header still works.
- Don't break guest mode or offline use of lessons and the visualiser (NFR7).

**Check:** in DevTools set the network to Offline and the banner appears. Stop the API (`Ctrl+C` on the server) and answer a question; the save-failed banner appears. A component that throws in a test renders the fallback.

**Done when:** the TODO item "Add an error boundary and an offline banner …" is ticked.

---

## Task 6: Practice activity 4, Build the tree (O6)

**Branch:** `feat/build-the-tree`

`BuildTheTree` in `client/src/pages/PracticePage.tsx` is a stub. Its TODO reads: "insert a short key sequence and ask the student to predict the final tree."

- **Generating the question:** follow the other activities (`ActivityProps`, `seed`, `onResult`, `locked`).
  - Pick 4–6 keys with `randomKeys` (seeded), and order 3, so the root splits.
  - Build the correct tree with `insert` from `@btree/engine`.
  - Render the question with `BTreeView`.
- **Answering:** the simplest approach is multiple choice.
  - Offer the correct final tree plus 2–3 plausible wrong ones, for example: the tree before the last insert, a tree that didn't split at the root, or one with the wrong middle key promoted.
  - Also ask "Did the tree grow taller?".
  - Use `shuffle` from `components/quiz/shuffle.ts` for option order.
- **Reporting:** report through `onResult`. The page already records it as an O6 attempt, which counts toward mastery and the **Root Raiser** badge.
- Keyboard-operable, with text feedback on why an answer is wrong.

**Check:** a unit test that the generated correct answer equals the engine's tree for a fixed seed, and that each wrong option differs from it.

**Done when:** the TODO item "Practice activity 4, Build the tree (O6) …" is ticked.

---

## Task 7: Drag decorations into place

**Branch:** `feat/decoration-placement`

> **Blocked on a small backend change. Ask Kyle first.** `PUT /api/grove/placement` saves `{ items: [{ decorationId, placed, x?, y? }] }` (max 50), but no endpoint returns positions. `GET /api/decorations` only gives `{ id, name, cost, owned }`, and a friend's grove only lists decoration ids. The backend needs to return `placed`, `x` and `y` for owned decorations, and for the friend grove too.

Once that's there:

- Make owned decorations draggable inside the grove scene (`components/grove/GroveTree.tsx`). Coordinates are in the scene's 832×480 frame (`SCENE_VIEWBOX` in `SceneBackdrop.tsx`). dnd-kit is already used in `PracticePage.tsx`.
- Save with `PUT /api/grove/placement` when a drag ends. Decorations with no saved position keep their current default spot.
- Provide a keyboard alternative (select a decoration, move it with the arrow keys).
- Show the placed positions on a friend's grove as well.

**Done when:** the TODO item "Drag decorations into place on the grove …" is ticked.

---

## Task 8: Mastery mini-lessons

**Branch:** `feat/mini-lessons`

The "Need more?" card in `client/src/pages/QuizPage.tsx` (around line 181) links back to the whole lesson.

- **Needs content from the ID team first:** a short worked example per objective (O1–O8).
- **Suggested shape:**
  - one Markdown file per objective, for example `client/src/content/mini-lessons/O5.md`;
  - a small route that renders it with the existing lesson Markdown rendering;
  - point the link at the question's objective.
- Lower priority than Tasks 1–6.

**Done when:** the TODO item "Turn the mastery mini-lessons behind 'Need more?' into real content …" is ticked.

---

## Task 9: Pixel pass

**Branch:** `chore/pixel-pass`

Compare each screen with its Figma frame at desktop and at 360px wide, in Day and Dusk. The tokens (colours, fonts, shadows, radii) already match Figma exactly (see PROMPT_LOG Entry 002), so this is layout and spacing only. Include the new cards from Tasks 1–4.

**Done when:** the TODO item "Give each screen a pixel pass …" is ticked.

---

## Task 10: Quality

**Branch:** `test/frontend-quality`

- **Unit tests** (Vitest and React Testing Library, next to the code as `*.test.tsx`):
  - the Quiz, Practice and Grove pages;
  - more cases in `client/src/stores/progressStore.test.ts`, which has 4 tests for the leaf rules.
- **Playwright journeys:** register → lesson → quiz → ready, and visiting a friend's grove.
  - `client/playwright.config.ts` currently starts only the client (`npm run dev` in `client/`), so these journeys also need the API and database running. Either add a second `webServer` entry for the server, or start the whole app with the root `npm run dev`.
  - The `e2e` CI job will need Postgres too (copy the `services` block from the `check` job in `.github/workflows/ci.yml`).
- **Screen reader pass:** go through every screen with VoiceOver (macOS) and NVDA (Windows) and write down what doesn't work. Pay special attention to the tree nodes, the drag-and-drop split, and the new cards and banners.

**Done when:** the three TODO Quality items are ticked.

---

## Task 11 (optional): Deployment config

Only if the team decides to deploy (see BACKEND_PLAN Task 6). Add `client/vercel.json`:

- a rewrite from `/api/:path*` to the Render API URL, so the client and API share one origin and the existing `SameSite=Lax` cookie works;
- an SPA fallback to `/index.html`.

The demo can run locally, so skip this unless it's agreed.

---

## Known limits to keep in mind

- **Leaf count on a new device:** past attempts aren't reloaded from the server on sign-in. On a new device, retaking a question already answered elsewhere can briefly show +10 in the header. The real balance comes back on reload. This is fine to leave as is.
- **Answer checking:** the server holds no answer keys. It stops a student replaying an answer after a hint or a wrong try, but not hand-made API requests. This is a known prototype limit.
