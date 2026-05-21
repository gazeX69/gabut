/**
 * Type Registry
 * Minimal type registries for entity and layer types
 * @module engine-runtime/registry
 */

import type { VGZEntityType, VGZLayerType } from '@vgz/scene-types';

/**
 * Generic type registry.
 * Holds a known set of type strings for runtime type-checking.
 * Immutable after construction.
 */
export class TypeRegistry<T extends string> {
  private readonly known: ReadonlySet<T>;

  constructor(types: readonly T[]) {
    this.known = Object.freeze(new Set(types));
  }

  /**
   * Check if a type string is registered
   */
  has(type: string): type is T {
    return this.known.has(type as T);
  }

  /**
   * Get all registered types
   */
  getAll(): ReadonlySet<T> {
    return this.known;
  }
}

/**
 * Pre-populated entity type registry.
 * Contains all known VGZEntityType values: actor, prop, trigger, decoration
 */
export const entityTypeRegistry = new TypeRegistry<VGZEntityType>([
  'actor',
  'prop',
  'trigger',
  'decoration',
]);

/**
 * Pre-populated layer type registry.
 * Contains all known VGZLayerType values: tilemap, entity, particle, light, shadow
 */
export const layerTypeRegistry = new TypeRegistry<VGZLayerType>([
  'tilemap',
  'entity',
  'particle',
  'light',
  'shadow',
]);
