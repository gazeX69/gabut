/**
 * Built-in Component: Float
 * Deterministically oscillates an entity's Y position.
 * @module apps/runtime/phaser-adapter/components
 */

import type { RuntimeComponent } from '../runtime-component.js';

export class FloatComponent implements RuntimeComponent {
  readonly id: string;
  readonly type = 'float';
  enabled = true;
  mountedEntity?: import('../phaser-mounted-entity.js').RuntimeMountedEntity;
  mountedScene?: import('../types.js').MountedScene;
  runtimeData: { startY: number; time: number; amplitude: number; speed: number } = { 
    startY: 0, 
    time: 0, 
    amplitude: 10, 
    speed: 0.005 
  };

  constructor(id: string, amplitude = 10, speed = 0.005) {
    this.id = id;
    this.runtimeData.amplitude = amplitude;
    this.runtimeData.speed = speed;
  }

  onAttach() {
    if (this.mountedEntity) {
      this.runtimeData.startY = this.mountedEntity.transformState.y;
    }
  }

  onUpdate(deltaMs: number) {
    if (!this.mountedEntity || !this.mountedScene) return;

    this.runtimeData.time += deltaMs;
    
    const offsetY = Math.sin(this.runtimeData.time * this.runtimeData.speed) * this.runtimeData.amplitude;
    const newY = this.runtimeData.startY + offsetY;
    
    this.mountedScene.setEntityPosition(
      this.mountedEntity.entityId,
      this.mountedEntity.transformState.x,
      newY
    );
  }
}
