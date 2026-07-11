# codex.md — Codex Working Rules for GETOUT

Codex is the executor and backend/DevOps owner for GETOUT. Claude (Fable) owns game design and technical direction; Darshan is producer and makes the final call. `instruction.md`, `agents.md`, and `docs/gdd.md` are binding.

## Working rules

1. Read `instruction.md`, `agents.md`, `docs/gdd.md`, `docs/architecture.md`, and the newest `docs/progress.md` entry before implementation work.
2. Do not change the fixed stack: strict TypeScript, Vite, Three.js WebGPURenderer with WebGL2 fallback, Rapier3D, DOM/CSS HUD, glTF/Draco/KTX2 assets, Vercel, and localStorage saves.
3. Claude-owned documents are read-only. Record design ambiguities under **Blockers** in `docs/progress.md`; do not guess or silently expand scope.
4. Simulation runs at a fixed 60 Hz and rendering interpolates between simulation states. The frame loop must allocate nothing: reuse vectors, typed arrays, callbacks, and state objects; never call `Math.random()` in simulation code.
5. Keep game-agnostic code in `src/engine`, gameplay in `src/game`, and data in `src/content`. Light and gravity remain first-class gameplay systems as the station acts are added.
6. No shipped `console.log`, console warnings, unlicensed assets, paid assets, or hidden network dependencies. Every interaction needs audio and visual feedback.
7. Preserve the five-minute Act 0 timeline. QA controls may accelerate verification only behind an explicit `?qa` query and must not alter the player path.
8. Keep initial payload below 30 MB and stream later zones by manifest. Profile before optimizing and report measured FPS, not estimates.
9. Use small coherent commits in `feat|fix|perf|docs(scope): message` form. Do not deploy outside an explicitly requested release workflow.

## Definition of done

A PR-sized change is complete only when all of the following are true:

- `npm run typecheck`, `npm run lint`, and `npm run build` pass.
- The production build loads with zero console errors or warnings.
- The affected act or zone has been played end-to-end.
- FPS has been measured at the required quality tier and recorded.
- Initial and streamed payload budgets have been checked.
- The deployed Vercel URL has been opened and played, not merely reported as ready by the CLI.

## Session-end checklist

1. Add the newest entry at the top of `docs/progress.md` with shipped work, validation, measured FPS, deploy URL, and blockers/questions.
2. Update `docs/architecture.md` when module boundaries, data flow, rendering, assets, physics, saves, or deployment structure change.
3. Re-run typecheck, lint, and production build; inspect git scope; commit and push all intended code and Codex-owned docs.
4. Verify the Vercel production URL and CI result.
5. Post a concise `[CODEX]` update to Slack `#getout` with the deploy URL and what Darshan should test. If Slack is unavailable, ensure `docs/progress.md` and the pushed commit contain the complete update.
