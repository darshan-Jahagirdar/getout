import './styles.css';
import { AudioCore } from './engine/AudioCore';
import { ZoneAssetLoader } from './engine/AssetLoader';
import { FixedStepLoop } from './engine/FixedStepLoop';
import { InputSystem } from './engine/Input';
import { PhysicsCore } from './engine/Physics';
import { detectQualityTier, QUALITY_PROFILES, type QualityTier } from './engine/Quality';
import { RendererCore } from './engine/Renderer';
import { SaveSystem } from './engine/SaveSystem';
import { Act0Director } from './game/act0/Act0Director';
import { Act0Scene } from './game/act0/Act0Scene';
import { Act0UI } from './game/act0/Act0UI';

async function bootstrap(): Promise<void> {
  const root = document.querySelector<HTMLElement>('#app');
  if (root === null) throw new Error('GETOUT root unavailable');

  const input = new InputSystem();
  const ui = new Act0UI(root, input);
  const audio = new AudioCore();
  const physics = new PhysicsCore();
  const saves = new SaveSystem();
  let tier: QualityTier = detectQualityTier();
  let currentFps = 0;

  const renderer = await RendererCore.create(ui.canvas, QUALITY_PROFILES[tier]);
  const act0Scene = new Act0Scene(renderer.camera, QUALITY_PROFILES[tier]);
  renderer.connectScene(act0Scene.scene);
  const assets = new ZoneAssetLoader(renderer.renderer);
  await physics.initialize();

  const director = new Act0Director(ui, act0Scene, input, audio, physics, () => {
    saves.save('autosave', director.snapshot().missionTime, true, tier);
  });

  ui.bindStart(async () => {
    try {
      await audio.start();
    } catch {
      ui.showCallout('AUDIO OFFLINE · MISSION MAY CONTINUE', true);
    }
    director.start();
  });
  ui.bindChecklist(
    (id) => director.toggleChecklist(id),
    () => audio.playUiTone(),
  );
  ui.bindStage(() => director.triggerStageSeparation());
  ui.bindQuality((nextTier) => {
    tier = nextTier;
    renderer.applyQuality(QUALITY_PROFILES[tier]);
    act0Scene.applyQuality(QUALITY_PROFILES[tier]);
  });
  ui.bindVolume((value) => audio.setMasterVolume(value));
  ui.bindSave((slot) => {
    const snapshot = director.snapshot();
    saves.save(slot, snapshot.missionTime, snapshot.complete, tier);
    ui.showSaveStatus(`SAVE ${slot.toString().padStart(2, '0')} WRITTEN · ${new Date().toLocaleTimeString()}`);
    audio.playUiTone(1_120, 0.12, 0.07);
  });

  const loop = new FixedStepLoop(
    60,
    (stepSeconds) => {
      director.fixedUpdate(stepSeconds);
      physics.step();
      input.endFixedStep();
    },
    (alpha, elapsedSeconds) => {
      act0Scene.render(alpha, elapsedSeconds);
      renderer.render();
    },
    (metrics) => {
      currentFps = metrics.fps;
      ui.setFps(metrics.fps);
    },
  );

  ui.ready(renderer.backendLabel, tier);
  loop.start();

  if (new URLSearchParams(window.location.search).has('qa')) {
    window.__GETOUT_QA__ = {
      completeChecklist: () => director.qaCompleteChecklist(),
      setMissionTime: (seconds) => director.qaSetMissionTime(seconds),
      triggerStageSeparation: () => director.triggerStageSeparation(),
      alignDocking: () => director.qaAlignDocking(),
      snapshot: () => ({
        ...director.snapshot(),
        fps: currentFps,
        backend: renderer.backendLabel,
        quality: tier,
      }),
    };
  }

  window.addEventListener('beforeunload', () => {
    loop.stop();
    assets.dispose();
    physics.dispose();
    act0Scene.dispose();
    renderer.dispose();
    input.dispose();
  });
}

void bootstrap().catch(() => {
  const root = document.querySelector<HTMLElement>('#app');
  if (root !== null) {
    root.innerHTML = '<section class="fatal"><small>VANGUARD-9 FAULT</small><h1>FLIGHT COMPUTER OFFLINE</h1><p>This browser requires WebGPU or WebGL2. Reload to retry initialization.</p></section>';
  }
});
