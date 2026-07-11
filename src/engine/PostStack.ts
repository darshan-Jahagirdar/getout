import { RenderPipeline, type Camera, type Scene, type WebGPURenderer } from 'three/webgpu';
import { float, pass } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import type BloomNode from 'three/addons/tsl/display/BloomNode.js';
import { film } from 'three/addons/tsl/display/FilmNode.js';
import type { QualityProfile } from './Quality';

export class PostStack {
  private readonly pipeline: RenderPipeline;
  private readonly bloomNode: BloomNode;

  public constructor(
    renderer: WebGPURenderer,
    scene: Scene,
    camera: Camera,
    profile: QualityProfile,
  ) {
    const scenePass = pass(scene, camera);
    const sceneColor = scenePass.getTextureNode('output');
    this.bloomNode = bloom(sceneColor, profile.bloomStrength, 0.28, 0.78);
    this.bloomNode.setResolutionScale(profile.bloomScale);
    this.pipeline = new RenderPipeline(renderer);
    this.pipeline.outputNode = film(sceneColor.add(this.bloomNode), float(0.018));
  }

  public setQuality(profile: QualityProfile): void {
    this.bloomNode.strength.value = profile.bloomStrength;
    this.bloomNode.setResolutionScale(profile.bloomScale);
  }

  public render(): void {
    this.pipeline.render();
  }

  public dispose(): void {
    this.pipeline.dispose();
  }
}
