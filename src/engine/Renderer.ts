import {
  ACESFilmicToneMapping,
  PCFSoftShadowMap,
  PerspectiveCamera,
  SRGBColorSpace,
  WebGPURenderer,
  type Scene,
} from 'three/webgpu';
import { PostStack } from './PostStack';
import type { QualityProfile } from './Quality';

interface BackendFlags {
  isWebGPUBackend?: boolean;
}

export class RendererCore {
  public readonly camera = new PerspectiveCamera(62, 1, 0.05, 2_000);
  public readonly renderer: WebGPURenderer;
  public readonly backendLabel: 'WEBGPU' | 'WEBGL2';

  private profile: QualityProfile;
  private postStack: PostStack | null = null;
  private width = 0;
  private height = 0;

  private constructor(renderer: WebGPURenderer, profile: QualityProfile) {
    this.renderer = renderer;
    this.profile = profile;
    this.backendLabel = (renderer.backend as BackendFlags).isWebGPUBackend === true ? 'WEBGPU' : 'WEBGL2';
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.applyQuality(profile);
  }

  public static async create(canvas: HTMLCanvasElement, profile: QualityProfile): Promise<RendererCore> {
    const renderer = new WebGPURenderer({
      canvas,
      antialias: profile.antialias,
      alpha: false,
      powerPreference: 'high-performance',
    });
    await renderer.init();
    return new RendererCore(renderer, profile);
  }

  public connectScene(scene: Scene): void {
    this.postStack?.dispose();
    this.postStack = new PostStack(this.renderer, scene, this.camera, this.profile);
  }

  public applyQuality(profile: QualityProfile): void {
    this.profile = profile;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, profile.pixelRatioCap));
    this.renderer.shadowMap.enabled = profile.shadows;
    this.postStack?.setQuality(profile);
    this.resize();
  }

  public resize(): void {
    const nextWidth = window.innerWidth;
    const nextHeight = window.innerHeight;
    if (nextWidth === this.width && nextHeight === this.height) return;
    this.width = nextWidth;
    this.height = nextHeight;
    this.camera.aspect = nextWidth / nextHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(nextWidth, nextHeight, false);
  }

  public render(): void {
    this.resize();
    this.postStack?.render();
  }

  public dispose(): void {
    this.postStack?.dispose();
    this.renderer.dispose();
  }
}
