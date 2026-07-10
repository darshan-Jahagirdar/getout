# agents.md — Rules for ALL agents working in this repo

> Codex: read this file, `instruction.md`, `docs/gdd.md`, and `docs/architecture.md` at the start of EVERY session. Then read the latest entry in `docs/progress.md` to know where things stand.

## Project
GETOUT — web-based 3D survival-horror. Escape a haunted spacecraft using gravity and light. Full design in `docs/gdd.md`. Roles and workflow in `instruction.md`.

## Stack (fixed — do not swap without a design decision from Claude)
- TypeScript (strict) + Vite
- Three.js (WebGPURenderer with WebGL2 fallback)
- Rapier3D (@dimforge/rapier3d-compat) for physics
- DOM/CSS overlay for HUD & menus (no React in the render loop)
- Assets: glTF + Draco + KTX2, CC0/procedural only
- Hosting: Vercel. Saves: localStorage.

## Code conventions
- `src/engine/` — renderer, loop, input, audio, assets, save system (game-agnostic)
- `src/game/` — entities, ghost AI, gravity systems, light/power systems, puzzles, acts
- `src/content/` — level definitions, puzzle data, dialog/telemetry text (data, not code)
- Fixed-timestep simulation (60 Hz) with interpolated rendering. No `Math.random()` in sim code — seeded RNG only.
- **Zero allocations in the frame loop.** Preallocate vectors/quaternions; reuse.
- No console errors/warnings in production builds. `console.log` never ships.
- Every PR-sized change: `npm run typecheck && npm run lint && npm run build` must pass.
- Commit style: `feat|fix|perf|docs(scope): message`. Small, coherent commits.

## Testing duties (Codex self-tests before calling anything done)
1. Production build runs locally with zero console noise.
2. Playthrough of the affected act/zone end-to-end.
3. FPS check at Medium tier (report the number in progress.md).
4. Deploy to Vercel, open the deployed URL, verify it actually loads and plays.

## Session end checklist (Codex, every session)
1. Update `docs/progress.md` (top entry): date, what shipped, test results + fps, deploy URL, blockers/questions.
2. Update `docs/architecture.md` if any structure changed.
3. Commit and push everything, including docs.
4. Post an update in Slack `#getout` prefixed `[CODEX]` (if no Slack access: the progress.md entry is the update; GitHub→Slack integration relays commits).

## Boundaries
- Codex owns: repo, CI, Vercel config, implementation details, testing.
- Claude owns: design (gdd.md), tech direction, prompts, review.
- Neither agent changes the other's docs — put questions/corrections in progress.md (Codex) or a new prompt (Claude).
