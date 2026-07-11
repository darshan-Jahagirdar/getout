import { LoadingManager, type Object3D, type WebGPURenderer } from 'three/webgpu';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';

export interface ZoneAsset {
  id: string;
  url: string;
}

export interface ZoneManifest {
  zone: string;
  assets: readonly ZoneAsset[];
}

export interface LoadedZone {
  zone: string;
  roots: readonly Object3D[];
}

export class ZoneAssetLoader {
  private readonly manager = new LoadingManager();
  private readonly dracoLoader = new DRACOLoader(this.manager);
  private readonly ktx2Loader = new KTX2Loader(this.manager);
  private readonly gltfLoader = new GLTFLoader(this.manager);
  private readonly loaded = new Map<string, LoadedZone>();

  public constructor(renderer: WebGPURenderer) {
    this.dracoLoader.setDecoderPath('/decoders/draco/');
    this.ktx2Loader.setTranscoderPath('/decoders/basis/');
    this.ktx2Loader.detectSupport(renderer);
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
    this.gltfLoader.setKTX2Loader(this.ktx2Loader);
  }

  public async loadZone(manifest: ZoneManifest): Promise<LoadedZone> {
    const existing = this.loaded.get(manifest.zone);
    if (existing !== undefined) return existing;

    const roots: Object3D[] = [];
    for (const asset of manifest.assets) {
      const gltf = await this.gltfLoader.loadAsync(asset.url);
      gltf.scene.name = asset.id;
      roots.push(gltf.scene);
    }
    const zone = { zone: manifest.zone, roots };
    this.loaded.set(manifest.zone, zone);
    return zone;
  }

  public unloadZone(zoneId: string): void {
    const zone = this.loaded.get(zoneId);
    if (zone === undefined) return;
    for (const root of zone.roots) root.removeFromParent();
    this.loaded.delete(zoneId);
  }

  public dispose(): void {
    this.loaded.clear();
    this.dracoLoader.dispose();
    this.ktx2Loader.dispose();
  }
}
