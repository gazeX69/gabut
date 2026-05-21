/**
 * Phaser Mounted Entity
 * Mutable runtime lifecycle wrapper above immutable RuntimeEntityDescriptor.
 * @module apps/runtime/phaser-adapter
 */

import type Phaser from 'phaser';
import type { RuntimeEntityDescriptor } from '@vgz/engine-runtime';
import type { RuntimeCollisionBounds } from './runtime-collision.js';
import type { RuntimeTriggerCallbacks } from './runtime-trigger.js';

/**
 * Mutable state of a mounted entity in the runtime layer.
 * Keeps the underlying RuntimeEntityDescriptor immutable.
 */
export interface RuntimeMountedEntity {
  readonly entityId: string;
  readonly descriptor: RuntimeEntityDescriptor; // Immutable reference
  gameObject: Phaser.GameObjects.GameObject;
  transformState: {
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
  };
  visible: boolean;
  alpha: number;
  destroyed: boolean;

  /** Runtime-only collision (not in scene descriptors) */
  collisionEnabled: boolean;
  collisionBounds: RuntimeCollisionBounds | null;
  collisionTags: string[];

  /** Runtime-only triggers & interaction */
  triggerEnabled: boolean;
  interactionEnabled: boolean;
  triggerTags: string[];
  activeTriggerOverlaps: Set<string>;
  triggerCallbacks?: RuntimeTriggerCallbacks;

  /** Optional per-entity update logic */
  updateHandler?: EntityUpdateHandler;
  
  /** Optional untyped runtime memory for the entity */
  runtimeData?: Record<string, unknown>;
  
  /** Ordered list of runtime components */
  components: import('./runtime-component.js').RuntimeComponent[];
}

export type EntityUpdateHandler = (entity: RuntimeMountedEntity, deltaMs: number, loop: import('./runtime-scene-loop.js').RuntimeSceneLoop) => void;


/**
 * Immediately synchronizes the mutable transform state to the Phaser GameObject.
 */
export function syncMountedEntityTransform(entity: RuntimeMountedEntity): void {
  if (entity.destroyed || !entity.gameObject) return;
  
  const obj = entity.gameObject as any;
  if (typeof obj.setPosition === 'function') {
    obj.setPosition(entity.transformState.x, entity.transformState.y);
  } else {
    obj.x = entity.transformState.x;
    obj.y = entity.transformState.y;
  }
  
  if (typeof obj.setRotation === 'function') {
    obj.setRotation(entity.transformState.rotation); // Phaser uses radians for setRotation natively
  } else if (typeof obj.setAngle === 'function') {
    obj.setAngle(entity.transformState.rotation); // fallback
  }

  if (typeof obj.setScale === 'function') {
    obj.setScale(entity.transformState.scaleX, entity.transformState.scaleY);
  }
}

/**
 * Immediately synchronizes the mutable visibility and alpha to the Phaser GameObject.
 */
export function syncMountedEntityVisibility(entity: RuntimeMountedEntity): void {
  if (entity.destroyed || !entity.gameObject) return;

  const obj = entity.gameObject as any;
  if (typeof obj.setVisible === 'function') {
    obj.setVisible(entity.visible);
  }
  
  if (typeof obj.setAlpha === 'function') {
    obj.setAlpha(entity.alpha);
  }
}
