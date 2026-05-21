/**
 * Built-in Component: InputMove
 * Reads RuntimeInputState to move an entity using WASD/Arrows.
 * @module apps/runtime/phaser-adapter/components
 */

import type { RuntimeComponent } from '../runtime-component.js';

export class InputMoveComponent implements RuntimeComponent {
  readonly id: string;
  readonly type = 'input-move';
  enabled = true;
  mountedEntity?: import('../phaser-mounted-entity.js').RuntimeMountedEntity;
  mountedScene?: import('../types.js').MountedScene;
  runtimeData: { speed: number } = { speed: 0.3 };

  constructor(id: string, speed = 0.3) {
    this.id = id;
    this.runtimeData.speed = speed;
  }

  onUpdate(deltaMs: number) {
    if (!this.mountedEntity || !this.mountedScene) return;

    const input = this.mountedScene.input;
    if (!input) return;

    const speed = this.runtimeData.speed * deltaMs;
    let dx = 0;
    let dy = 0;

    if (input.isKeyDown('W') || input.isKeyDown('ARROWUP')) dy -= speed;
    if (input.isKeyDown('S') || input.isKeyDown('ARROWDOWN')) dy += speed;
    if (input.isKeyDown('A') || input.isKeyDown('ARROWLEFT')) dx -= speed;
    if (input.isKeyDown('D') || input.isKeyDown('ARROWRIGHT')) dx += speed;

    if (dx !== 0 || dy !== 0) {
      const currentX = this.mountedEntity.transformState.x;
      const currentY = this.mountedEntity.transformState.y;
      const moved = this.mountedScene.moveEntityWithCollision(
        this.mountedEntity.entityId,
        currentX + dx,
        currentY + dy
      );
      if (!moved) {
        this.mountedScene.audio.playSound('sfx-blocked', { volume: 0.35 });
      }
    }
  }
}
