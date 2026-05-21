/**
 * Runtime Trigger & Interaction (collision overlap, no event bus)
 * @module apps/runtime/phaser-adapter
 */

import type { MountedScene } from './types.js';
import type { RuntimeMountedEntity } from './phaser-mounted-entity.js';
import {
  entitiesOverlap,
  hasActiveCollision,
  isValidCollisionBounds,
} from './runtime-collision.js';

export interface RuntimeTriggerCallbacks {
  onTriggerEnter?: (otherEntityId: string) => void;
  onTriggerExit?: (otherEntityId: string) => void;
  onInteract?: (actorEntityId: string) => void;
}

export function canEmitTriggers(entity: RuntimeMountedEntity): boolean {
  return (
    !entity.destroyed &&
    entity.triggerEnabled &&
    hasActiveCollision(entity)
  );
}

/** Entities that can enter trigger volumes (overlap probes). */
export function canBeTriggerProbe(entity: RuntimeMountedEntity): boolean {
  return (
    !entity.destroyed &&
    entity.collisionEnabled &&
    isValidCollisionBounds(entity.collisionBounds)
  );
}

export function canReceiveInteraction(entity: RuntimeMountedEntity): boolean {
  return !entity.destroyed && entity.interactionEnabled;
}

function invokeEnter(entity: RuntimeMountedEntity, otherEntityId: string): void {
  try {
    entity.triggerCallbacks?.onTriggerEnter?.(otherEntityId);
  } catch (err) {
    console.warn(
      `[RuntimeTrigger] onTriggerEnter error on '${entity.entityId}' from '${otherEntityId}':`,
      err
    );
  }
}

function invokeExit(entity: RuntimeMountedEntity, otherEntityId: string): void {
  try {
    entity.triggerCallbacks?.onTriggerExit?.(otherEntityId);
  } catch (err) {
    console.warn(
      `[RuntimeTrigger] onTriggerExit error on '${entity.entityId}' from '${otherEntityId}':`,
      err
    );
  }
}

export function invokeInteract(entity: RuntimeMountedEntity, actorEntityId: string): void {
  try {
    entity.triggerCallbacks?.onInteract?.(actorEntityId);
  } catch (err) {
    console.warn(
      `[RuntimeTrigger] onInteract error on '${entity.entityId}' from '${actorEntityId}':`,
      err
    );
  }
}

/** Current probe ids overlapping this trigger volume (sorted). */
export function computeTriggerOverlapIds(
  trigger: RuntimeMountedEntity,
  probes: readonly RuntimeMountedEntity[]
): string[] {
  const hits: string[] = [];
  for (const probe of probes) {
    if (probe.entityId === trigger.entityId) continue;
    if (!canBeTriggerProbe(probe)) continue;
    if (entitiesOverlap(trigger, probe)) {
      hits.push(probe.entityId);
    }
  }
  hits.sort();
  return hits;
}

/**
 * Compare current overlaps vs activeTriggerOverlaps; fire enter/exit (no duplicates).
 */
export function processEntityTriggers(
  trigger: RuntimeMountedEntity,
  probes: readonly RuntimeMountedEntity[]
): void {
  if (!canEmitTriggers(trigger)) return;

  const current = new Set(computeTriggerOverlapIds(trigger, probes));
  const active = trigger.activeTriggerOverlaps;

  for (const otherId of current) {
    if (!active.has(otherId)) {
      active.add(otherId);
      invokeEnter(trigger, otherId);
    }
  }

  for (const otherId of [...active]) {
    if (!current.has(otherId)) {
      active.delete(otherId);
      invokeExit(trigger, otherId);
    }
  }
}

/** Deterministic end-of-tick trigger pass for all trigger-enabled entities. */
export function processAllTriggerOverlaps(scene: MountedScene): void {
  if (scene.isDisposed) return;

  const entities = [...scene.mountedEntities.values()]
    .filter((e) => !e.destroyed)
    .sort((a, b) => a.entityId.localeCompare(b.entityId));

  const probes = entities.filter(canBeTriggerProbe);
  const triggers = entities.filter(canEmitTriggers);

  for (const trigger of triggers) {
    processEntityTriggers(trigger, probes);
  }
}

/** Remove probe from all active overlap sets and fire exit on triggers. */
export function cleanupTriggerOverlapsForRemovedEntity(
  removedEntityId: string,
  entities: Iterable<RuntimeMountedEntity>
): void {
  for (const entity of entities) {
    if (!entity.activeTriggerOverlaps.has(removedEntityId)) continue;
    entity.activeTriggerOverlaps.delete(removedEntityId);
    if (canEmitTriggers(entity)) {
      invokeExit(entity, removedEntityId);
    }
  }
}
