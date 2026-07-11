import { ACT0_CHECKLIST, ACT0_TIMING } from '../../content/act0';
import type { AudioCore } from '../../engine/AudioCore';
import { Action, type InputSystem } from '../../engine/Input';
import type { PhysicsCore } from '../../engine/Physics';
import type { Act0Scene } from './Act0Scene';
import type { Act0UI } from './Act0UI';

export type Act0Phase =
  | 'PRE-FLIGHT'
  | 'COUNTDOWN'
  | 'ASCENT'
  | 'MAX-Q'
  | 'STAGE SEPARATION'
  | 'COAST'
  | 'EARTH ORBIT'
  | 'MECO / ZERO-G'
  | 'ORBIT INSERTION'
  | 'DOCKING'
  | 'HARD CAPTURE';

export interface Act0Snapshot {
  missionTime: number;
  phase: Act0Phase;
  checklistComplete: number;
  stageSeparated: boolean;
  dockX: number;
  dockY: number;
  dockRoll: number;
  complete: boolean;
}

const DOCK_TRANSLATION_RATE = 0.34;
const DOCK_ROLL_RATE = 0.42;

export class Act0Director {
  private readonly ui: Act0UI;
  private readonly scene: Act0Scene;
  private readonly input: InputSystem;
  private readonly audio: AudioCore;
  private readonly physics: PhysicsCore;
  private readonly onComplete: () => void;
  private readonly checklist = new Set<string>();

  private missionTime: number = ACT0_TIMING.preflightStart;
  private phase: Act0Phase = 'PRE-FLIGHT';
  private started = false;
  private completed = false;
  private stageSeparated = false;
  private liftoffTriggered = false;
  private maxQTriggered = false;
  private breathTriggered = false;
  private fairingTriggered = false;
  private reflectionTriggered = false;
  private mecoTriggered = false;
  private orbitBurnTriggered = false;
  private dockingTriggered = false;
  private biometricTriggered = false;
  private calloutUntil = Number.NEGATIVE_INFINITY;
  private roarResumeAt = Number.POSITIVE_INFINITY;
  private biometricUntil = Number.NEGATIVE_INFINITY;
  private reflectionUntil = Number.NEGATIVE_INFINITY;
  private lastDisplayedSecond = Number.MIN_SAFE_INTEGER;
  private lastCountdownSecond = Number.MIN_SAFE_INTEGER;
  private uiUpdateAccumulator = 0;
  private dockX = 0.65;
  private dockY = -0.42;
  private dockRoll = 0.35;

  public constructor(
    ui: Act0UI,
    scene: Act0Scene,
    input: InputSystem,
    audio: AudioCore,
    physics: PhysicsCore,
    onComplete: () => void,
  ) {
    this.ui = ui;
    this.scene = scene;
    this.input = input;
    this.audio = audio;
    this.physics = physics;
    this.onComplete = onComplete;
    this.ui.setMissionTime(this.missionTime);
    this.ui.setChecklistCount(0);
  }

  public start(resumeAt = ACT0_TIMING.preflightStart): void {
    if (this.started) return;
    this.started = true;
    this.missionTime = Math.max(ACT0_TIMING.preflightStart, resumeAt);
    this.ui.begin();
    this.updatePhase();
    this.updateMissionClock();
  }

  public toggleChecklist(id: string): boolean {
    if (!this.started || this.missionTime >= ACT0_TIMING.liftoff) return this.checklist.has(id);
    const exists = this.checklist.has(id);
    if (exists) this.checklist.delete(id);
    else this.checklist.add(id);
    this.ui.setChecklistCount(this.checklist.size);
    if (this.checklist.size === ACT0_CHECKLIST.length) {
      this.showCallout('FLIGHT: Vanguard-9 is go for launch.', 3.2);
      this.ui.setObjective('Hold for terminal count.');
    }
    return !exists;
  }

  public triggerStageSeparation(): void {
    if (!this.started || this.stageSeparated || this.missionTime < ACT0_TIMING.stageSeparation - 0.1) return;
    this.stageSeparated = true;
    this.scene.setStageSeparated();
    this.ui.setStageAvailable(false);
    this.audio.stopRoar();
    this.audio.playThunk();
    this.roarResumeAt = this.missionTime + 1.15;
    this.showCallout('STAGE ONE SEPARATION CONFIRMED', 3.4);
  }

  public fixedUpdate(stepSeconds: number): void {
    if (!this.started || this.completed) {
      this.scene.fixedUpdate(this.missionTime, this.dockX, this.dockY, this.dockRoll);
      return;
    }

    const previousTime = this.missionTime;
    const checklistReady = this.checklist.size === ACT0_CHECKLIST.length;
    const heldForChecklist = this.missionTime >= ACT0_TIMING.checklistHold && !checklistReady;
    const heldForStage = this.missionTime >= ACT0_TIMING.stageSeparation && !this.stageSeparated;
    if (!heldForChecklist && !heldForStage) this.missionTime += stepSeconds;
    if (!checklistReady && this.missionTime > ACT0_TIMING.checklistHold) {
      this.missionTime = ACT0_TIMING.checklistHold;
    }
    if (!this.stageSeparated && this.missionTime > ACT0_TIMING.stageSeparation) {
      this.missionTime = ACT0_TIMING.stageSeparation;
    }

    if (this.missionTime >= ACT0_TIMING.dockingStart) this.updateDocking(stepSeconds);
    this.processEvents(previousTime);
    this.updatePhase();
    this.updateMissionClock();
    this.updateTransientUi(stepSeconds);
    this.scene.fixedUpdate(this.missionTime, this.dockX, this.dockY, this.dockRoll);

    if (
      this.missionTime >= ACT0_TIMING.dockingComplete &&
      Math.abs(this.dockX) < 0.08 &&
      Math.abs(this.dockY) < 0.08 &&
      Math.abs(this.dockRoll) < 0.1
    ) {
      this.finish();
    }
  }

  public qaCompleteChecklist(): void {
    for (const item of ACT0_CHECKLIST) {
      this.checklist.add(item.id);
      this.ui.setChecklistItem(item.id, true);
    }
    this.ui.setChecklistCount(this.checklist.size);
  }

  public qaSetMissionTime(seconds: number): void {
    if (!this.started) this.start();
    const previousTime = this.missionTime;
    this.missionTime = Math.max(ACT0_TIMING.preflightStart, seconds);
    this.processEvents(previousTime);
    this.updatePhase();
    this.updateMissionClock();
    this.scene.fixedUpdate(this.missionTime, this.dockX, this.dockY, this.dockRoll);
  }

  public qaAlignDocking(): void {
    this.dockX = 0;
    this.dockY = 0;
    this.dockRoll = 0;
    this.ui.updateDocking(0, 0, 0);
  }

  public snapshot(): Act0Snapshot {
    return {
      missionTime: this.missionTime,
      phase: this.phase,
      checklistComplete: this.checklist.size,
      stageSeparated: this.stageSeparated,
      dockX: this.dockX,
      dockY: this.dockY,
      dockRoll: this.dockRoll,
      complete: this.completed,
    };
  }

  private updateDocking(stepSeconds: number): void {
    const translation = DOCK_TRANSLATION_RATE * stepSeconds;
    const roll = DOCK_ROLL_RATE * stepSeconds;
    if (this.input.isDown(Action.Left)) this.dockX -= translation;
    if (this.input.isDown(Action.Right)) this.dockX += translation;
    if (this.input.isDown(Action.Up)) this.dockY += translation;
    if (this.input.isDown(Action.Down)) this.dockY -= translation;
    if (this.input.isDown(Action.RollLeft)) this.dockRoll -= roll;
    if (this.input.isDown(Action.RollRight)) this.dockRoll += roll;
    this.dockX = Math.max(-1, Math.min(1, this.dockX));
    this.dockY = Math.max(-1, Math.min(1, this.dockY));
    this.dockRoll = Math.max(-0.75, Math.min(0.75, this.dockRoll));
  }

  private processEvents(previousTime: number): void {
    if (!this.biometricTriggered && previousTime < -45 && this.missionTime >= -45) {
      this.biometricTriggered = true;
      this.biometricUntil = this.missionTime + 4.1;
      this.ui.showBiometricAnomaly(true);
      this.audio.playHeartbeat(5);
    }
    if (!this.liftoffTriggered && previousTime < ACT0_TIMING.liftoff && this.missionTime >= ACT0_TIMING.liftoff) {
      this.liftoffTriggered = true;
      this.audio.startRoar();
      this.showCallout('LIFTOFF · VANGUARD-9 COMMITTED', 4.2);
    }
    if (!this.maxQTriggered && previousTime < ACT0_TIMING.maxQ && this.missionTime >= ACT0_TIMING.maxQ) {
      this.maxQTriggered = true;
      this.showCallout('FLIGHT: Max-Q. Throttle bucket nominal.', 4.5);
    }
    if (!this.breathTriggered && previousTime < ACT0_TIMING.extraBreath && this.missionTime >= ACT0_TIMING.extraBreath) {
      this.breathTriggered = true;
      this.audio.playBreath();
      this.showCallout('COMMS: Vanguard, we copy…     [open carrier]', 3.2);
    }
    if (this.missionTime >= ACT0_TIMING.stageSeparation && !this.stageSeparated) {
      this.ui.setStageAvailable(true);
      this.ui.setObjective('Trigger stage separation.');
      this.showCallout('ACTION REQUIRED · STAGE SEPARATION', 99, true);
    }
    if (!this.fairingTriggered && previousTime < ACT0_TIMING.fairingJettison && this.missionTime >= ACT0_TIMING.fairingJettison) {
      this.fairingTriggered = true;
      this.audio.playThunk();
      this.showCallout('FAIRING JETTISON · VISUAL ACQUISITION', 4.5);
    }
    if (!this.reflectionTriggered && previousTime < ACT0_TIMING.wrongReflection && this.missionTime >= ACT0_TIMING.wrongReflection) {
      this.reflectionTriggered = true;
      this.reflectionUntil = this.missionTime + 2.7;
      this.ui.showReflection(true);
    }
    if (!this.mecoTriggered && previousTime < ACT0_TIMING.meco && this.missionTime >= ACT0_TIMING.meco) {
      this.mecoTriggered = true;
      this.audio.stopRoar();
      this.physics.setZeroGravity(true);
      this.showCallout('MECO', 5.2);
    }
    if (!this.orbitBurnTriggered && previousTime < ACT0_TIMING.orbitBurn && this.missionTime >= ACT0_TIMING.orbitBurn) {
      this.orbitBurnTriggered = true;
      this.audio.playUiTone(310, 0.65, 0.16);
      this.showCallout('ORBIT INSERTION BURN · DHRUVA AHEAD', 4.8);
    }
    if (!this.dockingTriggered && previousTime < ACT0_TIMING.dockingStart && this.missionTime >= ACT0_TIMING.dockingStart) {
      this.dockingTriggered = true;
      this.ui.setDockingVisible(true);
      this.ui.setObjective('Align the docking reticle with Port A.');
      this.showCallout('AUTODOCK LIMIT · MANUAL CONTROL', 4.5);
    }
  }

  private updatePhase(): void {
    let next: Act0Phase;
    if (this.completed) next = 'HARD CAPTURE';
    else if (this.missionTime < ACT0_TIMING.checklistHold) next = 'PRE-FLIGHT';
    else if (this.missionTime < ACT0_TIMING.liftoff) next = 'COUNTDOWN';
    else if (this.missionTime < ACT0_TIMING.maxQ) next = 'ASCENT';
    else if (this.missionTime < ACT0_TIMING.stageSeparation) next = 'MAX-Q';
    else if (!this.stageSeparated) next = 'STAGE SEPARATION';
    else if (this.missionTime < ACT0_TIMING.fairingJettison) next = 'COAST';
    else if (this.missionTime < ACT0_TIMING.meco) next = 'EARTH ORBIT';
    else if (this.missionTime < ACT0_TIMING.orbitBurn) next = 'MECO / ZERO-G';
    else if (this.missionTime < ACT0_TIMING.dockingStart) next = 'ORBIT INSERTION';
    else next = 'DOCKING';
    if (next === this.phase) return;
    this.phase = next;
    this.ui.setPhase(next);
    if (next === 'ASCENT') this.ui.setObjective('Ride ascent. Monitor flight calls.');
    if (next === 'EARTH ORBIT') this.ui.setObjective('Confirm fairing clear and Earth acquisition.');
    if (next === 'MECO / ZERO-G') this.ui.setObjective('Secure loose cabin objects.');
    if (next === 'ORBIT INSERTION') this.ui.setObjective('Acquire DHRUVA docking corridor.');
  }

  private updateMissionClock(): void {
    const displayedSecond = Math.trunc(this.missionTime);
    if (displayedSecond === this.lastDisplayedSecond) return;
    this.lastDisplayedSecond = displayedSecond;
    this.ui.setMissionTime(this.missionTime);
    if (
      this.phase === 'COUNTDOWN' &&
      displayedSecond >= -10 &&
      displayedSecond <= 0 &&
      displayedSecond !== this.lastCountdownSecond &&
      this.checklist.size === ACT0_CHECKLIST.length
    ) {
      this.lastCountdownSecond = displayedSecond;
      this.audio.playUiTone(displayedSecond === 0 ? 1_050 : 720, 0.1, 0.08);
    }
  }

  private updateTransientUi(stepSeconds: number): void {
    if (this.missionTime >= this.calloutUntil) this.ui.hideCallout();
    if (this.biometricTriggered && this.missionTime >= this.biometricUntil) this.ui.showBiometricAnomaly(false);
    if (this.reflectionTriggered && this.missionTime >= this.reflectionUntil) this.ui.showReflection(false);
    if (this.missionTime >= this.roarResumeAt && this.missionTime < ACT0_TIMING.meco) {
      this.roarResumeAt = Number.POSITIVE_INFINITY;
      this.audio.startRoar();
    }
    this.uiUpdateAccumulator += stepSeconds;
    if (this.uiUpdateAccumulator < 0.08) return;
    this.uiUpdateAccumulator = 0;
    const gForce = this.missionTime >= 0 && this.missionTime < ACT0_TIMING.meco
      ? 0.24 + smoothGForce(this.missionTime)
      : 0;
    this.ui.setGForce(gForce);
    if (this.missionTime >= ACT0_TIMING.dockingStart) {
      this.ui.updateDocking(this.dockX, this.dockY, this.dockRoll);
    }
  }

  private showCallout(message: string, duration: number, alert = false): void {
    this.calloutUntil = this.missionTime + duration;
    this.ui.showCallout(message, alert);
  }

  private finish(): void {
    this.completed = true;
    this.phase = 'HARD CAPTURE';
    this.audio.playThunk();
    this.ui.setPhase(this.phase);
    this.ui.complete();
    this.onComplete();
  }
}

function smoothGForce(missionTime: number): number {
  const rise = Math.max(0, Math.min(1, missionTime / 42));
  const release = 1 - Math.max(0, Math.min(1, (missionTime - 224) / 16));
  return rise * release * 0.72;
}
