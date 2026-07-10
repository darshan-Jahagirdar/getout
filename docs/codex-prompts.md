# GETOUT — Master Codex Prompts
*Owner: Claude. Three prompts cover the entire build. Paste verbatim. Fix-lists between prompts are allowed; re-planning is not.*

---

## PROMPT 1 — Foundation & The Launch

You are Codex, executor and backend/DevOps engineer for **GETOUT**, a web-based 3D survival-horror game. Claude (Fable) is lead architect; his design is law and lives in the docs. Darshan is producer.

**First, read these files in the repo root: `instruction.md`, `agents.md`, `docs/gdd.md`.** They define the game, your role, the fixed stack, code conventions, and your session-end checklist. Do not deviate from the stack: TypeScript strict + Vite + Three.js (WebGPU renderer, WebGL2 fallback) + Rapier3D. No React in the render loop.

**Deliverables:**
1. **Repo & infra:** Create GitHub repo `getout` (public), commit the existing docs, set up Vite+TS scaffold per `agents.md` layout (`src/engine`, `src/game`, `src/content`), ESLint + typecheck + build scripts, GitHub Actions CI (typecheck/lint/build on push), and Vercel hosting with auto-deploy from `main`. Connect the GitHub app to Slack channel `#getout` so commits/deploys post there automatically.
2. **Your docs:** Write `codex.md` (your working rules + session checklist, consistent with agents.md), `docs/architecture.md` (module map, render pipeline, game loop, asset pipeline, save system — must conform to gdd.md §9), and `docs/progress.md` (start the log).
3. **Engine core:** fixed-timestep 60 Hz loop with interpolated render; renderer bootstrap with WebGPU→WebGL2 fallback; quality tiers Low/Med/High/Cinema (auto-detect + settings UI); asset loader (glTF+Draco+KTX2, per-zone manifest); input system; WebAudio positional audio core; localStorage save system (3 slots + autosave); zero per-frame allocations (enforce with a lint rule or review note).
4. **Act 0 — the full 5-minute launch sequence** per gdd.md §5: interactive cockpit pre-flight checklist (clickable switches), countdown, liftoff with shake/roar/G vignette, Max-Q, player-triggered stage separation, fairing jettison revealing Earth (make Earth gorgeous — day/night, atmosphere rim), MECO silence + floating pen, orbit burn, approach to station DHRUVA, docking with manual final alignment. Include the three horror seeds (5th heartbeat on biometrics, extra breath on comms, wrong reflection) — subtle, no payoff yet.
5. **Post stack v1:** bloom, filmic tonemap, grain, volumetric-light-ready pipeline.

**Acceptance criteria:** deployed Vercel URL plays Act 0 start-to-docking with zero console errors; 60 fps at High on an M1-class GPU (report measured fps in progress.md); initial payload < 30 MB; CI green. Complete the session-end checklist in agents.md (progress.md entry, commit, push, `#getout` update — post updates yourself if you have Slack access, otherwise the GitHub integration + progress.md entry is your update).

---

## PROMPT 2 — The Station & The Ghost

Re-read `instruction.md`, `agents.md`, `docs/gdd.md` §3–§5, and your `docs/architecture.md`. This prompt builds the game's heart.

**Deliverables:**
1. **Systems (build these first, they are the MOAT):**
   - `GravityField`: per-volume gravity vectors driving Rapier — zero-g drift with push-off/handholds/momentum, magboots (any ferrous surface, walk on walls/ceilings, loud), re-orientable gravity plates at junction boxes, hab-ring spin control with continuous gravity scaling and unsecured-object slide.
   - `LightGrid`: per-volume lux map — every light source contributes; ghost AI and gameplay read it. Power budget system with breaker boards routing fixed kW among zone lights / door motors / ring spin / systems. Handhelds: flashlight (battery+outlets), flares (60 s area denial), UV lamp (residue trails, hidden writing, logs).
   - **The Passenger** (ghost AI) per gdd.md §4.3: Dormant/Stalking/Hunting/Banished state machine, sound sensing, light-boundary behavior, zone light-draining, vent traversal, escalation per act. Render her as refraction distortion + frost particulate. Death beat + reload on dark catch.
2. **The station:** all zones per gdd.md §3 (Node, Power Core, Hab Ring, Labs, Greenhouse, Cargo Bay, Pod Bay exterior), zone streaming, map terminal, both save rooms, shortcut unlocks for fast backtracking.
3. **Acts 1–2:** scripted first encounter (Act 1), the three key puzzle chains (Hab Ring, Labs+Greenhouse, Cargo Bay), Power Core evolving re-route puzzle, UV log/story system with Voss's logs (write functional placeholder text; Claude will polish), wrist-computer HUD (map, objectives, inventory, power overview).
4. **Audio pass 1:** positional whispers, per-module reverb, hull groans keyed to spin, player-noise-feeds-AI loop.

**Acceptance criteria:** deployed build plays Act 0 → Act 2 complete (all 3 keys earnable); ghost is genuinely scary and never unfair (she must be readable: cold-front telegraphs before Hunting); saves work across reload; 60 fps @ High maintained in every zone; zero console errors; progress.md + architecture.md updated; `#getout` updated. Flag any gdd ambiguity in progress.md Blockers instead of guessing.

---

## PROMPT 3 — Act 3, AAA Polish & Ship

Re-read the docs. This prompt finishes and ships the game.

**Deliverables:**
1. **Act 3 finale** per gdd.md §5: 3-key Pod Bay unlock, fuel-transfer power sacrifice puzzle, ring spin-down debris chaos, continuous hunt, undock + burn + window shot + post-credit frost sting. Credits.
2. **AAA visual pass:** GTAO, volumetric light shafts (dust in every beam), Hunting-state VHS tear + chromatic pull, frost material pass, Earth beauty pass, lighting/color grade per zone (emergency-red / warm-white / UV-violet language from gdd §7).
3. **Audio final:** Voss leitmotif (detuned hum), designed silences, save-room theme, full mix pass with ducking.
4. **Performance & QA:** profile every zone on Low/Med/High, hit the tier targets in instruction.md §4, fix all fps sinks; full playthrough test matrix (Chrome/Edge/Safari/Firefox, WebGPU and WebGL2 paths); soak-test saves; payload audit < 30 MB initial.
5. **Ship polish:** title screen, settings (audio/video/rebinding), accessibility (subtitles for all audio cues incl. ghost telegraphs, photosensitivity mode reducing flicker, hold-to-toggle options), themed loading screens, favicon/OG cards, README.
6. **Docs:** final architecture.md, progress.md ship entry, and a `docs/postmortem.md` (what to build next: cloud saves/speedrun board on Vercel KV).

**Acceptance criteria:** complete game playable start-to-credits on the production URL by someone with zero instructions; all instruction.md §4 quality bars pass and are evidenced in progress.md; `#getout` ship announcement posted.
