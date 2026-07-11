import type RAPIER_NAMESPACE from '@dimforge/rapier3d-compat';

type RapierModule = typeof RAPIER_NAMESPACE;

export class PhysicsCore {
  private rapier: RapierModule | null = null;
  private world: RAPIER_NAMESPACE.World | null = null;

  public async initialize(): Promise<void> {
    const module = await import('@dimforge/rapier3d-compat');
    await module.default.init();
    this.rapier = module.default;
    this.world = new this.rapier.World({ x: 0, y: -9.81, z: 0 });
    this.world.timestep = 1 / 60;
  }

  public setZeroGravity(enabled: boolean): void {
    if (this.world === null) return;
    this.world.gravity.x = 0;
    this.world.gravity.y = enabled ? 0 : -9.81;
    this.world.gravity.z = 0;
  }

  public step(): void {
    this.world?.step();
  }

  public dispose(): void {
    this.world?.free();
    this.world = null;
    this.rapier = null;
  }
}
