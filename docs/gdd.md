# GETOUT — Game Design Document
*Owner: Claude (Lead Architect / Game Designer). v1.0 — planned once, built in 3 prompts.*

---

## 1. Logline & Pillars

**You launched alone. Something came with you.**

A browser-based 3D survival-horror. The first five minutes are a real, interactive rocket launch. Then you dock with a derelict station — and discover you were never alone. Escape by mastering the two things the ghost cannot: **gravity** and **light**.

**Pillar 1 — The launch is real.** Act 0 plays like a flight sim, not a cutscene. Earning the player's trust with realism makes the first supernatural beat devastating.

**Pillar 2 — Gravity is a tool.** Zero-g drift, magboots, re-orientable gravity plates, a spin-gravity ring you control. Puzzles are solved by changing which way "down" is.

**Pillar 3 — Light is life.** The ghost cannot enter light. Power is scarce. Every lit corridor is safety you paid for. This is the resource economy AND the horror dial.

Every feature is judged against these pillars. Serves none → cut.

**Not-goals:** no combat/weapons, no crafting, no open world, no multiplayer, no procedural levels. Escape is never just running — it is unlocking (Resident Evil pacing: locked doors, keys, backtracking, save rooms).

## 2. Story

2049. Nine years after the DHRUVA research station was abandoned mid-mission — official cause "decompression incident, one crew member unrecovered" — you, **Commander Ash Vale**, launch solo aboard the **Vanguard-9** to decommission it and bring home its data cores.

The unrecovered crew member was **Dr. Elara Voss**. She never left. During your launch there are hints (a fifth heartbeat on your biometric panel that support dismisses as sensor noise, an extra breath on comms). After docking, the haunting begins. Voss — "the Passenger" — is not evil, but she is territorial, starving for warmth, and utterly lethal in the dark. Logs scattered through the station (found under UV light) reveal what actually happened, and give the player the codes and knowledge to escape.

**Ending:** you reach the escape pod, but launching it requires spinning down the hab ring and transferring fuel — a finale that uses every mechanic learned. You undock, burn away, and see her face in the station window. Post-credit sting: frost blooms on the inside of your pod's glass.

## 3. The Ship & Station (game map)

Vanguard-9 capsule docks to station DHRUVA. RE-style hub-and-spokes with locked doors and backtracking:

| Zone | Gravity | Role | Signature puzzle theme |
|---|---|---|---|
| **Capsule** (Act 0) | Launch G → zero-g | Cockpit, launch sequence, tutorial of switches | Pre-flight checklist |
| **Node** (hub) | Zero-g | Central junction, map terminal, first save room | Power routing master board |
| **Power Core** | Zero-g | Reactor; the station's kW budget lives here | Fuse & circuit routing (light vs doors vs systems) |
| **Habitation Ring** | Spin gravity (you control spin rate) | Crew quarters, medbay, save room | Spin up/down changes gravity: reach ceilings, move counterweights, spill fluids |
| **Labs** | Zero-g + local gravity plates | Research bays | Re-orient gravity plates to route objects/yourself |
| **Greenhouse** | Low light, plates | Overgrown, darkest zone | Light-starved plants react to your lamps; UV reveals Voss's log trail |
| **Cargo Bay** | Zero-g, huge | Storage canyon | Momentum puzzles: throw mass, ride recoil, magboot ceilings |
| **Pod Bay** | Zero-g | Final zone, locked by 3 authorization keys | Finale: fuel transfer + ring spin-down under pursuit |

Progression: 3 **authorization keys** (RE emblems) gate the Pod Bay — one each earned by completing Habitation Ring, Labs/Greenhouse, and Cargo Bay puzzle chains. Power Core is the recurring hub-puzzle you revisit to re-route the budget.

## 4. Core Mechanics

### 4.1 Gravity (MOAT #1)
- **Zero-g movement:** Newtonian drift — push off surfaces, grab handholds, momentum persists. Gentle auto-assist so it's readable, not frustrating.
- **Magboots:** toggle to walk on any ferrous surface (floors, walls, ceilings). Slower but stable; loud (ghost hears).
- **Gravity plates:** room-local plates the player re-orients (floor→wall→ceiling) at junction boxes; objects and fluids obey. Used for: dropping crates through "ceilings," redirecting coolant flows, making the ghost's frost fall as visible snow to track it.
- **Hab ring spin control:** a station-level dial. High spin = full gravity in ring (needed for some machinery), zero spin = float to unreachable places. Spinning up while a puzzle object is unsecured = it slides — used deliberately in puzzles.

### 4.2 Light & Power (MOAT #2)
- **The Passenger cannot enter lit space.** Lux threshold; dim light slows her, bright light blocks/banishes.
- **Power budget:** the reactor gives a fixed kW. At breaker boards, the player routes power among zone lighting, door motors, ring spin, and systems. You can rarely afford everything — darkness is a choice you're forced to make somewhere.
- **Handheld kit:** flashlight (battery drains, recharge at outlets), flares (consumable — 60 s of area denial, she circles the edge), UV lamp (reveals her residue trails, hidden writing, and log fragments — the clue system).
- **She drains lights.** Lit zones decay over minutes when she's near — flicker, brown-out, dark. Safety is temporary; the map's "safe topology" keeps shifting.
- **Save rooms:** two rooms (Node, Hab Ring) on protected circuits — always lit, autosave terminal, gentle music. The RE safe-room exhale.

### 4.3 The Passenger (ghost AI)
State machine, never killable, escalates per act:
- **Dormant** → invisible; ambience normal.
- **Stalking** → cold front: breath fogs, frost creeps on glass, lights flicker, whispers pan around the player. She probes the lit boundary.
- **Hunting** → visible, fast, closes through dark volumes only; screen gets VHS tearing/chromatic pull; heartbeat audio. Triggered by noise (magboot clanks, thrown objects, failed puzzle alarms) or by standing in the dark too long.
- **Banished** → hit by sufficient lux (flare, restored zone light): shrieks, disperses into vents, cooldown. Cooldown shortens each act.
- Sound is a real sensor: sprint-drifting and impacts attract her. Throwing objects makes distraction possible — but plates/gravity change where "thrown" things land.
- Being caught in darkness: screen-freeze death beat, reload at last save.

### 4.4 Puzzles (Resident Evil DNA)
- Locked doors: keycards, fuses, hand-crank overrides (crank speed vs noise tradeoff).
- Codes found via UV logs and environmental storytelling (burnt marks, arranged objects).
- Item combination at save-room benches (e.g., UV bulb + handlamp = UV lamp).
- Every zone's chain: explore dark → find clue under UV → re-route power/gravity → unlock shortcut back to hub → earn key. Shortcuts make backtracking fast (RE door-loop design).
- 8–10 major puzzles, 15–20 minor. Difficulty curve: teach (Act 1) → test (Act 2) → combine under pressure (Act 3).

## 5. Act Structure & Beat Timeline

**Act 0 — LAUNCH (5 min, interactive, sacred):**
T-2:00 cockpit pre-flight: player flips real switches from a checklist, comms chatter. T-0 liftoff: shake, roar, G-force vignette. +1:10 Max-Q callout. +2:30 **player triggers stage separation** (button + thunk + silence beat). +3:00 fairing jettison — first sight of Earth. +4:00 MECO: sudden silence, weightlessness, a pen floats. +4:30 orbit insertion burn; DHRUVA glints ahead. Docking auto-sequence with manual final alignment (mini-skill). Horror seeds: 5th heartbeat on biometrics, extra breath on comms, reflection that doesn't match.

**Act 1 — ARRIVAL (~15 min):** board through the Node. Station dark, tutorializes flashlight, magboots, first breaker board. Scripted unbeatable first encounter: she kills the lights corridor by corridor toward you; you survive by restoring one breaker — teaching *light = life* under pressure.

**Act 2 — THE STATION (~60–90 min):** free structure. Earn 3 keys across Hab Ring / Labs+Greenhouse / Cargo Bay; Power Core re-routing evolves each time (she starts draining zones in Act 2B). Story logs deepen; her behavior escalates.

**Act 3 — GET OUT (~15 min):** Pod Bay opens. Fuel transfer requires power → you must darken zones you rely on. Ring spin-down sends floating debris everywhere. She hunts continuously. Undock, burn, window shot, sting.

**MVP vertical slice** (= end of Codex Prompt 2 midpoint): Act 0 + Act 1 + Node + Power Core + Hab Ring key, full ghost AI, save system.

## 6. Controls
WASD + mouse-look. Space/ctrl = up/down thrust in zero-g. Shift = push-off burst. F = flashlight, G = magboots, E = interact/grab, Q = throw, Tab = wrist computer (map, objectives, inventory, power overview). Full rebinding + gamepad post-MVP.

## 7. Art Direction — "NASA-punk dread"
- Grounded ISS/Dragon realism: worn velcro, cable runs, checklists taped to panels; then wrongness layered on (frost fractals, floating rosaries, her silhouette).
- **Light is the art direction:** volumetric shafts through dust, hard flashlight cone with soft falloff, emergency-red vs safe warm-white vs UV violet as emotional palette. Darkness is true black with audio doing the work.
- Ghost rendering: refraction/distortion silhouette + particulate frost, never a textured "monster." Cheap, and scarier.
- Post stack: bloom, GTAO, filmic tonemap, subtle grain; chromatic aberration/VHS tear only during Hunting.
- Earth from orbit must be a wallpaper moment (day/night cities, atmosphere rim scatter).

## 8. Audio Direction
Audio carries 60% of the horror budget: positional 3D whispers, per-module convolution reverb, hull groans keyed to ring spin, her leitmotif in detuned humming. Silence is a designed state (post-MECO, save rooms). Player noise (boots, impacts) is diegetic and feeds her AI — what you hear, she hears.

## 9. Tech Direction (binding for architecture.md)
- TypeScript strict + Vite. Three.js WebGPURenderer, WebGL2 fallback. Rapier3D WASM physics.
- Fixed-timestep 60 Hz sim, interpolated render, zero per-frame allocations.
- ECS-lite composition; light/power and gravity as first-class systems (LightGrid: per-volume lux map the ghost AI reads; GravityField: per-volume gravity vector the physics reads).
- Assets glTF+Draco+KTX2, < 30 MB initial, per-zone streaming. CC0/procedural only.
- Quality tiers Low/Med/High/Cinema (auto-detect + override). 60 fps @ High on M1/GTX 1660.
- DOM/CSS diegetic HUD (wrist computer). WebAudio graph with per-zone reverb sends. localStorage saves (3 slots + autosave).

## 10. Scope Ledger
v1.0 baseline above. Changes get a dated line here with rationale. Cut-first list if schedule slips: Greenhouse zone (fold its puzzle into Labs), item combination (pre-built tools), Cinema tier, manual docking mini-game (auto-dock).
