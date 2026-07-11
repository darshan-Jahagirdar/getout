export interface FrameMetrics {
  fps: number;
  frameMs: number;
}

type FixedUpdate = (stepSeconds: number, simulationSeconds: number) => void;
type RenderUpdate = (alpha: number, elapsedSeconds: number) => void;
type MetricsUpdate = (metrics: Readonly<FrameMetrics>) => void;

const MAX_FRAME_SECONDS = 0.1;
const METRICS_WINDOW_MS = 1_000;

export class FixedStepLoop {
  private readonly fixedStepSeconds: number;
  private readonly fixedUpdate: FixedUpdate;
  private readonly renderUpdate: RenderUpdate;
  private readonly metricsUpdate: MetricsUpdate;
  private readonly metrics: FrameMetrics = { fps: 0, frameMs: 0 };
  private readonly onFrame = (nowMs: number): void => {
    this.frame(nowMs);
  };

  private accumulatorSeconds = 0;
  private simulationSeconds = 0;
  private elapsedSeconds = 0;
  private previousMs = 0;
  private metricsStartMs = 0;
  private metricsFrames = 0;
  private running = false;

  public constructor(
    fixedHz: number,
    fixedUpdate: FixedUpdate,
    renderUpdate: RenderUpdate,
    metricsUpdate: MetricsUpdate,
  ) {
    this.fixedStepSeconds = 1 / fixedHz;
    this.fixedUpdate = fixedUpdate;
    this.renderUpdate = renderUpdate;
    this.metricsUpdate = metricsUpdate;
  }

  public start(): void {
    if (this.running) return;
    this.running = true;
    this.previousMs = performance.now();
    this.metricsStartMs = this.previousMs;
    requestAnimationFrame(this.onFrame);
  }

  public stop(): void {
    this.running = false;
  }

  private frame(nowMs: number): void {
    if (!this.running) return;

    const rawFrameSeconds = (nowMs - this.previousMs) / 1_000;
    const frameSeconds = Math.min(rawFrameSeconds, MAX_FRAME_SECONDS);
    this.previousMs = nowMs;
    this.accumulatorSeconds += frameSeconds;
    this.elapsedSeconds += frameSeconds;

    while (this.accumulatorSeconds >= this.fixedStepSeconds) {
      this.fixedUpdate(this.fixedStepSeconds, this.simulationSeconds);
      this.simulationSeconds += this.fixedStepSeconds;
      this.accumulatorSeconds -= this.fixedStepSeconds;
    }

    this.renderUpdate(this.accumulatorSeconds / this.fixedStepSeconds, this.elapsedSeconds);
    this.metricsFrames += 1;

    const metricsElapsedMs = nowMs - this.metricsStartMs;
    if (metricsElapsedMs >= METRICS_WINDOW_MS) {
      this.metrics.fps = (this.metricsFrames * 1_000) / metricsElapsedMs;
      this.metrics.frameMs = metricsElapsedMs / this.metricsFrames;
      this.metricsFrames = 0;
      this.metricsStartMs = nowMs;
      this.metricsUpdate(this.metrics);
    }

    requestAnimationFrame(this.onFrame);
  }
}
