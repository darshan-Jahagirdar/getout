import { SeededRandom } from './SeededRandom';

const NOISE_SECONDS = 4;

export class AudioCore {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private effects: GainNode | null = null;
  private roarSource: AudioBufferSourceNode | null = null;
  private roarGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  public async start(): Promise<void> {
    if (this.context === null) this.createGraph();
    await this.context?.resume();
  }

  public setMasterVolume(value: number): void {
    if (this.context === null || this.master === null) return;
    this.master.gain.setTargetAtTime(value, this.context.currentTime, 0.03);
  }

  public playUiTone(frequency = 880, duration = 0.08, volume = 0.08): void {
    this.playTone(frequency, duration, volume, 'sine');
  }

  public playThunk(): void {
    this.playTone(72, 0.46, 0.45, 'sine');
    this.playTone(41, 0.65, 0.3, 'triangle');
  }

  public playHeartbeat(count: number): void {
    if (this.context === null || this.effects === null) return;
    const start = this.context.currentTime;
    for (let index = 0; index < count; index += 1) {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 48;
      const beat = start + index * 0.64;
      gain.gain.setValueAtTime(0.0001, beat);
      gain.gain.exponentialRampToValueAtTime(0.18, beat + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, beat + 0.2);
      oscillator.connect(gain).connect(this.effects);
      oscillator.start(beat);
      oscillator.stop(beat + 0.22);
    }
  }

  public playBreath(): void {
    if (this.context === null || this.effects === null || this.noiseBuffer === null) return;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    const panner = this.context.createPanner();
    source.buffer = this.noiseBuffer;
    filter.type = 'bandpass';
    filter.frequency.value = 720;
    filter.Q.value = 0.6;
    panner.positionX.value = 0.55;
    panner.positionY.value = 0.1;
    panner.positionZ.value = -0.4;
    const now = this.context.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.11, now + 0.55);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
    source.connect(filter).connect(panner).connect(gain).connect(this.effects);
    source.start(now, 0, 1.9);
    source.stop(now + 1.9);
  }

  public startRoar(): void {
    if (this.context === null || this.effects === null || this.noiseBuffer === null || this.roarSource !== null) {
      return;
    }
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = this.noiseBuffer;
    source.loop = true;
    filter.type = 'lowpass';
    filter.frequency.value = 260;
    const now = this.context.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.65, now + 1.8);
    source.connect(filter).connect(gain).connect(this.effects);
    source.start(now);
    this.roarSource = source;
    this.roarGain = gain;
  }

  public stopRoar(): void {
    if (this.context === null || this.roarSource === null || this.roarGain === null) return;
    const now = this.context.currentTime;
    this.roarGain.gain.cancelScheduledValues(now);
    this.roarGain.gain.setValueAtTime(Math.max(this.roarGain.gain.value, 0.0001), now);
    this.roarGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    this.roarSource.stop(now + 0.1);
    this.roarSource = null;
    this.roarGain = null;
  }

  private createGraph(): void {
    const context = new AudioContext({ latencyHint: 'interactive' });
    const master = context.createGain();
    const effects = context.createGain();
    const dry = context.createGain();
    const wet = context.createGain();
    const reverb = context.createConvolver();
    master.gain.value = 0.78;
    dry.gain.value = 0.88;
    wet.gain.value = 0.12;
    effects.connect(dry).connect(master);
    effects.connect(reverb).connect(wet).connect(master);
    master.connect(context.destination);
    this.context = context;
    this.master = master;
    this.effects = effects;
    this.noiseBuffer = this.createNoiseBuffer(context, NOISE_SECONDS, 0x0a57_2049);
    reverb.buffer = this.createImpulseBuffer(context, 1.25, 0x0d48_1255);
  }

  private createNoiseBuffer(context: AudioContext, seconds: number, seed: number): AudioBuffer {
    const length = Math.floor(context.sampleRate * seconds);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    const random = new SeededRandom(seed);
    for (let index = 0; index < length; index += 1) data[index] = random.next() * 2 - 1;
    return buffer;
  }

  private createImpulseBuffer(context: AudioContext, seconds: number, seed: number): AudioBuffer {
    const length = Math.floor(context.sampleRate * seconds);
    const buffer = context.createBuffer(2, length, context.sampleRate);
    const random = new SeededRandom(seed);
    for (let channel = 0; channel < 2; channel += 1) {
      const data = buffer.getChannelData(channel);
      for (let index = 0; index < length; index += 1) {
        const decay = (1 - index / length) ** 2.8;
        data[index] = (random.next() * 2 - 1) * decay;
      }
    }
    return buffer;
  }

  private playTone(
    frequency: number,
    duration: number,
    volume: number,
    type: OscillatorType,
  ): void {
    if (this.context === null || this.effects === null) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const now = this.context.currentTime;
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(Math.max(volume, 0.0001), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(this.effects);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }
}
