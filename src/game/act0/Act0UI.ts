import { ACT0_CHECKLIST } from '../../content/act0';
import { Action, type InputSystem } from '../../engine/Input';
import { QUALITY_PROFILES, type QualityTier } from '../../engine/Quality';

function requireElement<T extends HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (element === null) throw new Error(`Missing UI element: ${selector}`);
  return element;
}

export class Act0UI {
  private readonly startPanel: HTMLElement;
  private readonly startButton: HTMLButtonElement;
  private readonly loadingText: HTMLElement;
  private readonly hud: HTMLElement;
  private readonly time: HTMLElement;
  private readonly phase: HTMLElement;
  private readonly objective: HTMLElement;
  private readonly callout: HTMLElement;
  private readonly checklist: HTMLElement;
  private readonly checklistState: HTMLElement;
  private readonly stageButton: HTMLButtonElement;
  private readonly docking: HTMLElement;
  private readonly dockingReticle: HTMLElement;
  private readonly dockingReadout: HTMLElement;
  private readonly vignette: HTMLElement;
  private readonly biometric: HTMLElement;
  private readonly reflection: HTMLElement;
  private readonly completion: HTMLElement;
  private readonly fps: HTMLElement;
  private readonly renderer: HTMLElement;
  private readonly qualitySelect: HTMLSelectElement;
  private readonly settings: HTMLElement;
  private readonly saveStatus: HTMLElement;
  private readonly checklistButtons = new Map<string, HTMLButtonElement>();
  private previousDockX = Number.NaN;
  private previousDockY = Number.NaN;

  public constructor(root: HTMLElement, input: InputSystem) {
    root.innerHTML = `
      <canvas id="viewport" aria-label="Vanguard-9 cockpit view"></canvas>
      <div class="post-vignette" data-vignette></div>
      <div class="post-grain" aria-hidden="true"></div>
      <div class="reflection-seed" data-reflection aria-hidden="true"><i></i></div>

      <section class="start-panel" data-start-panel>
        <div class="mission-kicker">ISRO / INTERNATIONAL ORBITAL RECOVERY COMMAND</div>
        <h1>GET<span>OUT</span></h1>
        <p class="tagline">YOU LAUNCHED ALONE.</p>
        <div class="mission-card">
          <span>VANGUARD-9</span><span>COMMANDER ASH VALE</span><span>DHRUVA / 408 KM</span>
        </div>
        <button class="primary-button" data-start disabled>INITIALIZING FLIGHT SYSTEMS</button>
        <p class="loading-copy" data-loading>Compiling flight renderer…</p>
        <p class="control-copy">Headphones recommended · WASD + Q/E during final docking</p>
      </section>

      <main class="hud" data-hud hidden>
        <header class="top-rail">
          <div><small>MISSION ELAPSED TIME</small><strong data-time>T−02:00</strong></div>
          <div class="phase"><small>FLIGHT PHASE</small><strong data-phase>PRE-FLIGHT</strong></div>
          <div class="system-badges"><span data-renderer>GPU</span><span data-fps>-- FPS</span></div>
          <button class="icon-button" data-settings-open aria-label="Open settings">Ⅱ</button>
        </header>

        <aside class="objective-panel">
          <small>PRIMARY OBJECTIVE</small>
          <p data-objective>Complete the pre-flight checklist.</p>
        </aside>

        <aside class="biometric-panel" data-biometric>
          <div><small>CREW BIOMETRICS</small><strong>ASH / 72 BPM</strong></div>
          <div class="heart-trace"><i></i><i></i><i></i><i></i><i class="fifth"></i></div>
          <span class="crew-count">CREW: <b>01</b></span>
        </aside>

        <section class="checklist-panel" data-checklist>
          <div class="panel-title"><span>V-9 // LAUNCH READINESS</span><b data-checklist-state>0 / ${ACT0_CHECKLIST.length}</b></div>
          <div class="switch-grid">
            ${ACT0_CHECKLIST.map(
              (item) => `<button class="switch" data-check-id="${item.id}" aria-pressed="false">
                <span class="switch-code">${item.code}</span>
                <span class="switch-lever"><i></i></span>
                <span class="switch-label">${item.label}</span>
                <small>${item.confirmation}</small>
              </button>`,
            ).join('')}
          </div>
        </section>

        <div class="callout" data-callout></div>
        <button class="stage-button" data-stage hidden><span>STAGE 01</span>SEPARATE</button>

        <section class="docking-panel" data-docking hidden>
          <div class="dock-copy"><small>DHRUVA / PORT A</small><strong>MANUAL FINAL ALIGNMENT</strong></div>
          <div class="docking-scope"><i class="dock-target"></i><b data-dock-reticle></b></div>
          <p data-dock-readout>ΔX +0.65 · ΔY −0.42 · ROLL +20.1°</p>
          <div class="dock-controls" aria-label="Docking controls">
            <button data-action="up">W</button><button data-action="left">A</button>
            <button data-action="down">S</button><button data-action="right">D</button>
            <button data-action="roll-left">Q ↺</button><button data-action="roll-right">E ↻</button>
          </div>
        </section>
      </main>

      <section class="settings-panel" data-settings hidden>
        <div class="settings-card">
          <button class="settings-close" data-settings-close aria-label="Close settings">×</button>
          <small>VANGUARD-9 SYSTEMS</small><h2>SETTINGS</h2>
          <label>RENDER QUALITY<select data-quality>
            ${Object.values(QUALITY_PROFILES).map((profile) => `<option value="${profile.tier}">${profile.label}</option>`).join('')}
          </select></label>
          <label>MASTER AUDIO<input data-volume type="range" min="0" max="1" value="0.78" step="0.01" /></label>
          <div class="save-grid"><button data-save="1">SAVE 01</button><button data-save="2">SAVE 02</button><button data-save="3">SAVE 03</button></div>
          <p data-save-status>3 MANUAL SLOTS + MISSION AUTOSAVE ONLINE</p>
        </div>
      </section>

      <section class="completion-panel" data-completion hidden>
        <small>DOCKING CAPTURE CONFIRMED</small>
        <h2>DHRUVA</h2>
        <p>Hard seal established. Cabin pressure equalization in progress.</p>
        <div><span>ACT 0 COMPLETE</span><span>MISSION TIME 05:00</span></div>
        <p class="completion-whisper">There should only be one set of footprints.</p>
      </section>
    `;

    this.startPanel = requireElement(root, '[data-start-panel]');
    this.startButton = requireElement(root, '[data-start]');
    this.loadingText = requireElement(root, '[data-loading]');
    this.hud = requireElement(root, '[data-hud]');
    this.time = requireElement(root, '[data-time]');
    this.phase = requireElement(root, '[data-phase]');
    this.objective = requireElement(root, '[data-objective]');
    this.callout = requireElement(root, '[data-callout]');
    this.checklist = requireElement(root, '[data-checklist]');
    this.checklistState = requireElement(root, '[data-checklist-state]');
    this.stageButton = requireElement(root, '[data-stage]');
    this.docking = requireElement(root, '[data-docking]');
    this.dockingReticle = requireElement(root, '[data-dock-reticle]');
    this.dockingReadout = requireElement(root, '[data-dock-readout]');
    this.vignette = requireElement(root, '[data-vignette]');
    this.biometric = requireElement(root, '[data-biometric]');
    this.reflection = requireElement(root, '[data-reflection]');
    this.completion = requireElement(root, '[data-completion]');
    this.fps = requireElement(root, '[data-fps]');
    this.renderer = requireElement(root, '[data-renderer]');
    this.qualitySelect = requireElement(root, '[data-quality]');
    this.settings = requireElement(root, '[data-settings]');
    this.saveStatus = requireElement(root, '[data-save-status]');

    requireElement(root, '[data-settings-open]').addEventListener('click', () => {
      this.settings.hidden = false;
    });
    requireElement(root, '[data-settings-close]').addEventListener('click', () => {
      this.settings.hidden = true;
    });

    const actionByName: Readonly<Record<string, Action>> = {
      up: Action.Up,
      left: Action.Left,
      down: Action.Down,
      right: Action.Right,
      'roll-left': Action.RollLeft,
      'roll-right': Action.RollRight,
    };
    root.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => {
      const action = actionByName[button.dataset['action'] ?? ''];
      if (action === undefined) return;
      button.addEventListener('pointerdown', () => input.setVirtual(action, true));
      button.addEventListener('pointerup', () => input.setVirtual(action, false));
      button.addEventListener('pointercancel', () => input.setVirtual(action, false));
      button.addEventListener('pointerleave', () => input.setVirtual(action, false));
    });
  }

  public get canvas(): HTMLCanvasElement {
    return requireElement(document, '#viewport');
  }

  public bindStart(callback: () => void): void {
    this.startButton.addEventListener('click', callback);
  }

  public bindChecklist(callback: (id: string) => boolean, feedback: () => void): void {
    for (const item of ACT0_CHECKLIST) {
      const button = requireElement<HTMLButtonElement>(document, `[data-check-id="${item.id}"]`);
      this.checklistButtons.set(item.id, button);
      button.addEventListener('click', () => {
        const active = callback(item.id);
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
        feedback();
      });
    }
  }

  public bindStage(callback: () => void): void {
    this.stageButton.addEventListener('click', callback);
  }

  public bindQuality(callback: (tier: QualityTier) => void): void {
    this.qualitySelect.addEventListener('change', () => callback(this.qualitySelect.value as QualityTier));
  }

  public bindVolume(callback: (value: number) => void): void {
    requireElement<HTMLInputElement>(document, '[data-volume]').addEventListener('input', (event) => {
      callback(Number((event.currentTarget as HTMLInputElement).value));
    });
  }

  public bindSave(callback: (slot: 1 | 2 | 3) => void): void {
    document.querySelectorAll<HTMLButtonElement>('[data-save]').forEach((button) => {
      button.addEventListener('click', () => callback(Number(button.dataset['save']) as 1 | 2 | 3));
    });
  }

  public ready(backend: string, tier: QualityTier): void {
    this.renderer.textContent = backend;
    this.qualitySelect.value = tier;
    this.startButton.disabled = false;
    this.startButton.textContent = 'BEGIN PRE-FLIGHT';
    this.loadingText.textContent = 'Flight systems nominal · Audio arms on launch command';
  }

  public begin(): void {
    this.startPanel.hidden = true;
    this.hud.hidden = false;
  }

  public setMissionTime(seconds: number): void {
    const prefix = seconds < 0 ? 'T−' : 'T+';
    const absolute = Math.abs(Math.trunc(seconds));
    const minutes = Math.floor(absolute / 60).toString().padStart(2, '0');
    const remainder = (absolute % 60).toString().padStart(2, '0');
    this.time.textContent = `${prefix}${minutes}:${remainder}`;
  }

  public setPhase(phase: string): void {
    this.phase.textContent = phase;
  }

  public setObjective(objective: string): void {
    this.objective.textContent = objective;
  }

  public setChecklistCount(count: number): void {
    this.checklistState.textContent = `${count} / ${ACT0_CHECKLIST.length}`;
    this.checklist.classList.toggle('complete', count === ACT0_CHECKLIST.length);
  }

  public setChecklistItem(id: string, active: boolean): void {
    const button = this.checklistButtons.get(id);
    if (button === undefined) return;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  }

  public showCallout(message: string, alert = false): void {
    this.callout.textContent = message;
    this.callout.classList.add('visible');
    this.callout.classList.toggle('alert', alert);
  }

  public hideCallout(): void {
    this.callout.classList.remove('visible');
  }

  public setStageAvailable(available: boolean): void {
    this.stageButton.hidden = !available;
  }

  public setDockingVisible(visible: boolean): void {
    this.docking.hidden = !visible;
  }

  public updateDocking(x: number, y: number, roll: number): void {
    const roundedX = Math.round(x * 100);
    const roundedY = Math.round(y * 100);
    if (roundedX !== this.previousDockX || roundedY !== this.previousDockY) {
      this.dockingReticle.style.transform = `translate(${roundedX}px, ${roundedY}px)`;
      this.previousDockX = roundedX;
      this.previousDockY = roundedY;
    }
    this.dockingReadout.textContent = `ΔX ${x >= 0 ? '+' : ''}${x.toFixed(2)} · ΔY ${y >= 0 ? '+' : ''}${y.toFixed(2)} · ROLL ${(roll * 57.2958).toFixed(1)}°`;
    this.docking.classList.toggle('aligned', Math.abs(x) < 0.08 && Math.abs(y) < 0.08 && Math.abs(roll) < 0.1);
  }

  public setGForce(normalized: number): void {
    this.vignette.style.opacity = String(Math.max(0, Math.min(0.82, normalized * 0.82)));
  }

  public showBiometricAnomaly(visible: boolean): void {
    this.biometric.classList.toggle('anomaly', visible);
  }

  public showReflection(visible: boolean): void {
    this.reflection.classList.toggle('visible', visible);
  }

  public setFps(value: number): void {
    this.fps.textContent = `${Math.round(value)} FPS`;
  }

  public showSaveStatus(message: string): void {
    this.saveStatus.textContent = message;
  }

  public complete(): void {
    this.docking.hidden = true;
    this.objective.textContent = 'Docking complete. Await pressure equalization.';
    this.completion.hidden = false;
  }
}
