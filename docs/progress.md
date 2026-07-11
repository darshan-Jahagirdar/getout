# GETOUT — Progress Log

Newest entry first. `docs/progress.md` is the written source of truth for implementation status.

## 2026-07-10 — Foundation and Act 0 launch

**Status:** Implementation and local static gates complete; commit, publication, and public-browser verification blocked by the session's external-action approval quota.

### Shipped

- Initialized the repository with a docs-only baseline commit, then added strict Vite + TypeScript + ESLint scaffolding and GitHub Actions CI.
- Added the required `src/engine`, `src/game`, and `src/content` architecture with fixed 60 Hz simulation, interpolated rendering, WebGPU→WebGL2 renderer fallback, Rapier, input, WebAudio, manifest streaming, quality tiers, and 3-slot + autosave storage.
- Implemented Act 0 from T−2:00 to docking: six-switch pre-flight, held terminal count, launch shake/roar/G vignette, Max-Q, player stage separation, fairing/Earth reveal, MECO silence and floating pen, orbit burn, DHRUVA approach, manual alignment, and hard capture.
- Added the fifth biometric heartbeat, extra breath on comms, and wrong reflection as subtle one-shot events.
- Added ACES filmic tone mapping, bloom, film grain, emissive practicals, and a post graph ready for volumetric/GTAO/Hunting nodes.
- Generated Earth, clouds, city lights, atmosphere, stars, cockpit, pen, and station procedurally; no external or unlicensed art assets are used.

### Validation

- `npm run typecheck`: pass.
- `npm run lint`: pass with zero warnings.
- `npm run build`: pass.
- Production `dist`: 6,412 KiB total uncompressed including on-demand decoder copies; initial application graph remains far below the 30 MB limit.
- Forbidden-source scan: no `Math.random()` or `console.*` under `src`.
- Public playthrough, console scan, High-tier FPS: pending production URL.

### Deployment

- GitHub: pending publication to public `getout` repository; local GitHub CLI credential was expired at session start.
- Vercel: authenticated account confirmed; production URL pending.
- CI: workflow committed locally; run result pending push.

### Blockers / questions

- GitHub CLI requires re-authentication before repository creation/push.
- The connected Slack API can post the session update but cannot administer the GitHub app subscription; app installation may require an authenticated Slack/GitHub UI step.
- The approval quota also rejected local Git index writes, so the implementation remains an untracked working-tree change after the earlier docs-only commit.
- Vercel deployment was attempted through the authenticated connector and rejected by the same quota; no deploy URL or FPS claim is recorded.
