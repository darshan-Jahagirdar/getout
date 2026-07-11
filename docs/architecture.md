# GETOUT — Implementation Architecture

**Owner:** Codex
**Last updated:** 2026-07-10
**Binding direction:** `docs/gdd.md` §9

## System shape

GETOUT is a static Vite application. The browser owns rendering, physics, audio, input, and saves; there is no MVP backend. The implementation uses an ECS-lite composition model: game directors coordinate long-lived systems and stable entity objects without a general-purpose ECS dependency or per-frame query allocations.

| Area | Modules | Responsibility |
|---|---|---|
| Bootstrap | `src/main.ts` | Initialize quality, renderer, assets, Rapier, audio, saves, Act 0, QA surface, and the fixed-step loop. |
| Timing | `src/engine/FixedStepLoop.ts` | 60 Hz fixed simulation, clamped catch-up, interpolated render alpha, one-second FPS samples. |
| Rendering | `src/engine/Renderer.ts`, `PostStack.ts` | WebGPURenderer initialization, automatic WebGL2 backend fallback, camera/resize, ACES filmic output, bloom and film grain. |
| Physics | `src/engine/Physics.ts` | Async Rapier compatibility-WASM initialization and deterministic 60 Hz world step. Gravity fields attach here in Prompt 2. |
| Input | `src/engine/Input.ts` | Allocation-free keyboard state plus virtual DOM controls; WASD/arrows, Q/E, interaction edge state. |
| Audio | `src/engine/AudioCore.ts` | WebAudio master/effects buses, positional panning, per-zone reverb send, procedural launch/heartbeat/breath/thunk cues. |
| Assets | `src/engine/AssetLoader.ts` | Per-zone manifests, glTF loading, Draco decoding, KTX2 transcoding, load/unload lifecycle. |
| Saves | `src/engine/SaveSystem.ts` | Versioned localStorage schema, three manual slots, one autosave. |
| Quality | `src/engine/Quality.ts` | Auto-detection and Low/Medium/High/Cinema profiles controlling pixel ratio, AA, shadows, bloom, and star density. |
| Act 0 | `src/game/act0/*`, `src/content/act0.ts` | Procedural capsule/Earth/DHRUVA scene, exact mission timeline, checklist, horror seeds, docking, diegetic HUD. |

## Frame and simulation pipeline

`requestAnimationFrame` supplies wall-clock time. `FixedStepLoop` clamps a resumed frame to 100 ms, accumulates time, and executes zero or more exact `1/60 s` simulation steps. Each step runs the Act 0 director, then Rapier, then clears input edge state. Rendering receives `alpha = accumulator / fixedStep` and interpolates mission time and docking offsets between the previous and current simulation snapshots before submitting the scene.

The hot path keeps stable callbacks and numeric state. Scene vectors, groups, geometry, materials, star buffers, and metrics objects are created once. Simulation never calls `Math.random()`; startup-only procedural content uses `SeededRandom`. DOM text changes are event-driven or throttled, not rebuilt every rendered frame. Allocation-sensitive changes require a frame-loop review before merge.

## Render pipeline

1. `WebGPURenderer.init()` chooses WebGPU when available and its built-in WebGL2 backend otherwise.
2. A single physically based scene graph feeds both backends, avoiding divergent visual implementations.
3. ACES filmic tone mapping and sRGB output establish the common color pipeline.
4. Three.js `RenderPipeline` renders the scene color node, threshold bloom, then animated fine film grain.
5. Emissive practicals, atmosphere shells, stars, cockpit glass, and HUD overlays sit on this base.
6. The post graph is deliberately composable: Prompt 3 can insert GTAO, volumetric/god-ray nodes, hunting chromatic pull, and VHS tearing before the final film node without changing game code.

Act 0 uses procedural geometry and generated CanvasTextures. Earth has a lit surface, emissive night-city map, independent cloud shell, additive atmosphere rim, directional sunlight, and orbit motion. This avoids license risk and external asset requests while retaining the required day/night wallpaper beat.

## Quality tiers

| Tier | Pixel ratio cap | AA / shadows | Bloom scale | Stars | Target |
|---|---:|---|---:|---:|---|
| Low | 1.0 | Off / off | 0.30 | 900 | Never below 30 FPS on supported hardware. |
| Medium | 1.35 | On / on | 0.40 | 1,600 | Default for constrained/compact devices. |
| High | 1.75 | On / on | 0.50 | 2,600 | 60 FPS on M1 / GTX 1660 class. |
| Cinema | 2.0 | On / on | 0.65 | 4,000 | Manual visual ceiling, no 60 FPS guarantee. |

Hardware concurrency, device memory when exposed, and viewport size select Medium or High. The settings overlay can override the tier live without recreating the game.

## Asset pipeline and streaming

Content declares a `ZoneManifest` containing stable IDs and URLs. `ZoneAssetLoader` configures one `LoadingManager`, `GLTFLoader`, `DRACOLoader`, and `KTX2Loader`; Vite copies pinned Three.js Draco/Basis decoders into `/decoders` before dev/build. `loadZone` is asynchronous and idempotent. `unloadZone` detaches roots and releases the manifest entry. Prompt 2 will add material/geometry reference counting when assets become shared between station zones.

Only the capsule manifest is part of initial navigation. Later station manifests load behind mission-telemetry transitions. glTF mesh payloads use Draco, textures use KTX2/Basis, and all sources must be procedural or CC0 with attribution recorded beside the manifest.

## Physics, gravity, light, and entities

Rapier is loaded as a split compatibility-WASM chunk and stepped only by the fixed simulation. Act 0 switches the world gravity vector to zero at MECO. Prompt 2 adds two first-class volume systems required by the GDD:

- `GravityField`: stable volume IDs map to reusable gravity vectors consumed before each Rapier step; magboots, plates, and ring spin modify fields rather than special-casing actors.
- `LightGrid`: stable volume IDs hold lux contributions and power state; player safety and Passenger AI read the same values.

Entities remain composed objects with handles into physics, render, audio, light, and gravity systems. Systems own storage and lifecycle; entities do not allocate transient messages each tick.

## Audio graph

The WebAudio graph is created on the first user gesture: source → dry bus and convolution-reverb send → master → destination. Positional sources use `PannerNode`. Act 0 generates seeded noise and impulse responses once, then schedules launch roar, cabin thunks, comms breath, UI tones, and the five-heartbeat anomaly. MECO ramps the roar to silence in 80 ms, making silence an authored event rather than absent content.

Prompt 2 extends the same graph with per-module impulse responses and sound events consumed by Passenger hearing.

## Save system

Keys are `getout.save.v1.1`, `.2`, `.3`, and `.autosave`. Each JSON record contains schema version, slot, act, mission time, completion flag, quality tier, and ISO timestamp. Reads validate version/act and fail closed to `null`; malformed data never blocks startup. Act 0 autosaves on hard capture and allows manual writes from Settings. Future schema changes increment both the key prefix and record version and require an explicit migration.

## Act 0 state flow

The director begins at T−2:00 and preserves real time. It holds at T−0:10 until all six switches are set, at T+2:30 until the player presses Stage Separation, and after T+5:00 until manual docking alignment is within translation/roll tolerance. Timeline events trigger Max-Q, fairing jettison/Earth reveal, MECO/pen float, orbit burn, DHRUVA approach, and hard capture. The fifth heartbeat, extra comms breath, and wrong reflection are one-shot seeds with no narrative explanation.

`?qa=1` exposes deterministic checklist, mission-time, separation, alignment, and snapshot controls for automated acceptance tests. It does not change default timing or add visible player controls.

## Build, CI, and deploy

Vite emits static files in `dist`. GitHub Actions on every push and pull request uses Node 22, `npm ci`, typecheck, ESLint with zero warnings, and production build. Vercel uses `vercel.json`, deploys `dist`, and applies immutable caching to fingerprinted assets plus cross-origin and content-type security headers. Git integration on `main` is the production auto-deploy path; other branches are previews.
