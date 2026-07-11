# GETOUT

**You launched alone. Something came with you.**

GETOUT is a browser-based 3D survival-horror game built with strict TypeScript, Vite, Three.js WebGPU/WebGL2, and Rapier3D. This repository currently contains the full interactive five-minute Act 0 launch from pre-flight through docking with DHRUVA.

## Run locally

```bash
npm install
npm run dev
```

Production checks:

```bash
npm run typecheck
npm run lint
npm run build
npm run preview
```

## Controls

- Click all pre-flight switches before terminal count.
- Press the Stage Separation control when commanded.
- Use `WASD` or arrow keys for final docking translation and `Q` / `E` for roll.
- Open Settings from the top-right control for quality, audio, and manual save slots.

Design and ownership rules live in `instruction.md`, `agents.md`, and `docs/gdd.md`. Implementation details and current evidence live in `docs/architecture.md` and `docs/progress.md`.
