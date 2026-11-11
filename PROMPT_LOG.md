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
