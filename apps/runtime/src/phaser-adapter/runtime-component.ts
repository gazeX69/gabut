/**
 * Runtime Component Model
 * Lightweight runtime-only behaviors attached to entities.
 * @module apps/runtime/phaser-adapter
 */

import type { RuntimeMountedEntity } from './phaser-mounted-entity.js';
import type { MountedScene } from './types.js';

/**
 * Base interface for a runtime component.
 * Components are mutable runtime objects executed sequentially by the loop.
 */
export interface RuntimeComponent {
  readonly id: string;
  readonly type: string;
  enabled: boolean;
  
  /** Automatically assigned by the adapter when attached */
  mountedEntity?: RuntimeMountedEntity;
  
  /** Automatically assigned by the adapter when attached */
  mountedScene?: MountedScene;

  /** Untyped memory bag for the component */
  runtimeData?: Record<string, unknown>;

  /** Lifecycle Hook: Called when attached to a mounted entity */
  onAttach?(): void;
  
  /** Lifecycle Hook: Called when detached or when entity is destroyed */
  onDetach?(): void;
  
  /** Lifecycle Hook: Called every frame by the runtime loop if enabled */
  onUpdate?(deltaMs: number): void;
}
