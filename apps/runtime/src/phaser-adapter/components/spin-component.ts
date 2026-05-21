/**
 * Built-in Component: Spin
 * Deterministically rotates an entity.
 * @module apps/runtime/phaser-adapter/components
 */

import type { RuntimeComponent } from '../runtime-component.js';

export class SpinComponent implements RuntimeComponent {
  readonly id: string;
  readonly type = 'spin';
  enabled = true;
  mountedEntity?: import('../phaser-mounted-entity.js').RuntimeMountedEntity;
  mountedScene?: import('../types.js').MountedScene;
  runtimeData: { speed: number; angle: number } = { speed: 0.002, angle: 0 };

  constructor(id: string, speed = 0.002) {
    this.id = id;
    this.runtimeData.speed = speed;
  }

  onAttach() {
    if (this.mountedEntity) {
      this.runtimeData.angle = this.mountedEntity.transformState.rotation;
    }
  }

  onUpdate(deltaMs: number) {
    if (!this.mountedEntity || !this.mountedScene) return;

    this.runtimeData.angle += this.runtimeData.speed * deltaMs;
    this.mountedScene.setEntityRotation(this.mountedEntity.entityId, this.runtimeData.angle);
  }
}
