# GETOUT — Project Instructions (Source of Truth)

> Web-based 3D survival-horror game. You launch into space with an astronaut, discover a ghost aboard, and must escape the spacecraft using **gravity** and **light** as your tools. Puzzle-driven escape (Resident Evil pacing), AAA-quality visuals in the browser.

This file is the operating manual for the project. The **Google Drive folder `getout`** mirrors all project docs and is the human-readable source of truth. The **GitHub repo `getout`** is the canonical source for code and for Codex-authored docs.

---

## 1. The Team

| Who | Role | Responsibilities |
|---|---|---|
| **Darshan** | Producer / Final call | Approves direction, relays prompts between agents, plays every build |
| **Claude (Fable)** | Lead Architect + Game Designer + Frontend lead | Game design, technical direction, frontend/gameplay specs, writes Codex prompts, reviews builds, syncs docs to Drive, posts architect updates in Slack `#getout` |
| **Codex** | Executor + Backend/DevOps engineer | Implements all code, creates & owns the GitHub repo, CI, Vercel hosting, self-tests every build, writes implementation docs, posts build updates in Slack `#getout` |

Escalation: if Codex hits a design ambiguity → it writes the question into `progress.md` under **Blockers** and Darshan brings it to Claude. Claude answers with an updated spec, never with vague guidance.

## 2. Document Ownership

| Doc | Owner | Purpose | Update cadence |
|---|---|---|---|
| `instruction.md` | Claude | This file — roles, workflow, quality bar | On process change |
| `docs/gdd.md` | Claude | Full game design document (mechanics, story, acts, art/audio direction, scope) | On design change |
| `claude.md` | Claude | Claude's working rules for this project | Rare |
| `agents.md` | Claude | Conventions ALL agents follow in the repo (Codex reads this every session) | Rare |
| `docs/codex-prompts.md` | Claude | The canonical build prompts given to Codex | Per prompt |
| `codex.md` | Codex | Codex's own working rules & session checklist | Rare |
| `docs/architecture.md` | Codex | Implementation-level architecture: modules, data flow, render pipeline, build system (must conform to gdd.md §9 Tech Direction) | Every structural change |
| `docs/progress.md` | Codex | Running log: what was built, test results, deploy URLs, blockers. Newest entry on top. | **Every working session** |

All docs live in the repo. Claude mirrors them to the Drive folder `getout` whenever they change.

## 3. Workflow (one loop, always the same)

1. Claude writes/updates the spec (gdd.md + a prompt in codex-prompts.md).
2. Darshan pastes the prompt to Codex.
3. Codex implements → tests locally → commits → deploys to Vercel → updates `progress.md` (+ `architecture.md` if structure changed) → posts update in `#getout`.
4. Darshan plays the deployed build; Claude reviews code/visuals and posts review notes in `#getout`.
5. Fix list → next prompt. Repeat.

The whole game is planned up front (see gdd.md). Build is delivered through **3 master prompts** (Foundation & Launch → Station & Ghost → Polish & Ship) — no re-planning between them, only fix lists.

## 4. Quality Bar (non-negotiable, checked every deploy)

- **60 fps** on a mid-range laptop GPU (M1 / GTX 1660 class) at High tier; never below 30 fps on Low tier.
- Zero console errors or warnings in production build.
- Initial payload **< 30 MB**; zone assets lazy-loaded; loading screens themed (mission telemetry).
- Quality tiers: Low / Medium / High / Cinema, auto-detected, user-overridable.
- Works on latest Chrome, Edge, Safari, Firefox (WebGPU where available, WebGL2 fallback everywhere).
- Every interactive element has audio + visual feedback. No dead clicks.
- Every deploy is playable start-to-current-milestone with no dev knowledge.

## 5. Communication

- Slack channel **`#getout`** — all updates land here. Format: `[CLAUDE]` or `[CODEX]` prefix, what changed, deploy URL, what to test.
- Recommended: connect the GitHub app to `#getout` so commits/deploys post automatically.
- `docs/progress.md` is the written record; Slack is the notification layer. If they disagree, progress.md wins.

## 6. Decisions Already Made (do not relitigate)

- Engine: **Three.js** (WebGPU renderer, WebGL2 fallback) + **TypeScript** + **Vite**. No React in the 3D loop; DOM/CSS for HUD & menus.
- Physics: **Rapier3D** (WASM).
- No backend for MVP — static hosting on Vercel, saves in localStorage. (Post-launch: Vercel KV for cloud saves/speedrun board.)
- Assets: glTF + Draco + KTX2. Procedural/CC0 assets only — no paid or unlicensed assets.
- The game's MOAT: **gravity as a tool** + **light as life**. Every feature decision is judged against these two pillars.
