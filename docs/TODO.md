# Remaining work

What is still to build after the 0.1.0 scaffold. This list was built from the current code (TODOs, API routes, and which screens call the API) and from the to-do list in [CHANGELOG.md](../CHANGELOG.md). The scaffold has every screen and endpoint, so most of what's left is content, design polish, and connecting features that only work half way.

Tick items off as they land, and move finished work into the CHANGELOG.

---

## Frontend

### Design

- [x] Swap in the exact Figma colours, fonts, shadows and radii (`client/src/styles/tokens.css`). Done 10 November 2026.
- [x] Replace the placeholder grove art: the six growth stages and the nine decorations (`client/src/components/grove/`). Done 11 November 2026.
- [ ] Give each screen a pixel pass against the Figma frames, at desktop and at 360px wide.

### Content (ID team)

- [x] Review the lesson Markdown in `client/src/content/lessons/` against the B-tree definitions, fixing only what was inaccurate. Done 11 November 2026.
- [x] Write quiz banks for every module. Done 11 November 2026.
- [x] Write the 8-question ready check, now module 10 (one question per objective, O1–O8). Done 11 November 2026.
- [x] Write the deletion lesson: new module 7, objective O8. Done 11 November 2026.
- [x] Set a Watch-tab preset for every lesson part that has a tree (`WATCH_PRESET` in `client/src/pages/LessonPage.tsx`). Done 11 November 2026.
- [x] Review the narration sentences (`narration.json`) and warm-up questions (`warmup.json`). Both were accurate, so they are unchanged. Done 11 November 2026.

### Features

- [ ] Practice activity 4, **Build the tree** (O6), is still a stub (`client/src/pages/PracticePage.tsx`).
- [x] Badges (Explorer, Splitter, Root Raiser, Lecture Ready): show them on the Ready and Grove screens. Done 14 November 2026. The server side is ready: `GET /api/badges` returns all four, with `awardedAt` (or null while locked).
- [ ] Drag decorations into place on the grove. The server has `PUT /api/grove/placement`, but nothing on the client calls it.
- [x] Friend requests: add decline and unfriend buttons, and show pending requests outside the Account page. The server side is ready: `POST /api/friends/requests/:id/decline`, `DELETE /api/friends/requests/:id` (cancel), `DELETE /api/friends/:id` (unfriend), and `GET /api/friends` now also lists `outgoing` requests. Show the 429 message ("Slow down a little and try again later") when a student sends too many requests or cheers. Done 14 November 2026.
- [x] Streak card: show the real streak from the server. It's currently computed on the client only. The server side is ready: `GET /api/streak` returns `{ days }`. Done 14 November 2026.
- [x] Show reward bonuses as soon as they're earned. `POST /api/attempts` now returns `bonuses` (streak +15, ready check +60), but the client ignores them, so they only appear in the leaf count after a reload. Done 14 November 2026.
- [ ] Profile settings: change display name and password, and remember the Day/Dusk choice per account. The server side is ready: `PATCH /api/account` takes `displayName`, `theme`, and `currentPassword` with `newPassword`, and `user.theme` (null until set) comes back from sign-in and `/api/auth/session`. Apply it on sign-in when it isn't null.
- [ ] "Download my data" link on the Account page (`<a href="/api/account/export" download>`). The server side is ready.
- [ ] Turn the mastery mini-lessons behind "Need more?" into real content. For now they just send the student back to the lesson.
- [x] Add an error boundary and an offline banner, so a failed save is shown to the student instead of failing silently. Done 14 November 2026.
- [x] Let students take bought decorations off the tree and put them back (craft drawer). Done 14 November 2026.
- [x] Load past answers on sign-in, so readiness doesn't drop to 0%, and make mastery percentages show progress toward mastery. Done 14 November 2026.

### Quality

- [ ] Unit tests for the Quiz, Practice and Grove pages and the progress store.
- [ ] More Playwright journeys: register → lesson → quiz → ready, and visiting a friend's grove.
- [ ] Manual accessibility pass with a screen reader (VoiceOver and NVDA). The automated axe checks are not enough on their own.

---

## Backend

### Rewards

- [x] Award the **3-day streak** bonus (+15), once per streak. Days are counted in South African time. Done 14 November 2026.
- [x] Award the **ready-check** bonus (+60) once, when 7 of the 8 ready-check questions are right on the first try without hints. Done 14 November 2026.
- [x] Badge model and award rules: Explorer (warm-up and module 1), Splitter (3 correct O5 answers in a row), Root Raiser (O6 mastered) and Lecture Ready (ready check passed). Done 14 November 2026.
- [x] Check that `firstAttempt` and `hintsUsed` agree on the server, not only on the client, so a student can't fake a first-try answer. Done 14 November 2026.

### Friends and privacy

- [x] Endpoints to decline a request, unfriend, and cancel a request you sent. Requests that cross now make the two students friends. Done 14 November 2026.
- [x] Rate-limit cheers and friend requests to block spam: 10 friend requests and 20 cheers per student per hour. Done 14 November 2026.
- [x] Data export endpoint (POPIA right of access), alongside the account deletion that already exists: `GET /api/account/export` downloads everything the app stores about the student as a JSON file. Done 14 November 2026.

### Account

- [x] `PATCH /api/account`: display name, theme and password change. Password changes are limited to 10 per student per 15 minutes; name and theme changes are not limited. Done 14 November 2026.
- [x] ~~Password reset by email (needs a mail provider)~~. Won't do (prototype): there is no mail provider. A signed-in student can still change their password. Decided 14 November 2026.
- [x] Sessions: tokens currently live for a fixed number of days with no refresh or revoke. Decided: the 14-day JWT cookie is acceptable for a prototype. Changing the password does not sign out other devices. Decided 14 November 2026.

### Ops and deployment

- [ ] Deploy the API and Postgres to Render and the client to Vercel. This includes cross-site cookies: `SameSite=None; Secure`, or putting both on one domain.
- [ ] Run `prisma migrate deploy` in the release step and put secrets in the hosting dashboard.
- [ ] Add a database readiness check to `/api/health`.
- [x] ~~Back up the production database.~~ Won't do (prototype). Decided 14 November 2026.

### Quality

- [x] Supertest coverage for the grove, decorations, lecture-questions, friends and cheers routes. Done 13 November 2026.
- [x] Test that friends can never see another student's scores or answers. Done 13 November 2026.

---

## Suggested order

1. **Quick wins:** Build the tree, the quiz banks, and the two missing reward payouts (streak and ready check).
2. **Team decision first:** the deployment cookie setup (cross-site cookies or one shared domain) needs agreement before anyone builds it.
