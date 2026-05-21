/**
 * Runtime Collision (AABB only, no Phaser physics)
 * @module apps/runtime/phaser-adapter
 */

import type { RuntimeMountedEntity } from './phaser-mounted-entity.js';

/** Half-extents from entity transform center (pixels). */
export interface RuntimeCollisionBounds {
  halfWidth: number;
  halfHeight: number;
  offsetX?: number;
  offsetY?: number;
}

export interface RuntimeCollisionAABB {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export type CollisionLayer = 'default' | 'solid' | 'actor' | 'trigger';

const DEFAULT_HALF_SIZE = 16;

export function isValidCollisionBounds(
  bounds: RuntimeCollisionBounds | null | undefined
): bounds is RuntimeCollisionBounds {
  if (!bounds) return false;
  return (
    Number.isFinite(bounds.halfWidth) &&
    Number.isFinite(bounds.halfHeight) &&
    bounds.halfWidth > 0 &&
    bounds.halfHeight > 0
  );
}

export function hasActiveCollision(entity: RuntimeMountedEntity): boolean {
  return (
    !entity.destroyed &&
    entity.collisionEnabled &&
    isValidCollisionBounds(entity.collisionBounds)
  );
}

/** Entity blocks movement when tagged solid. */
export function isSolidCollider(entity: RuntimeMountedEntity): boolean {
  return hasActiveCollision(entity) && entity.collisionTags.includes('solid');
}

export function entityWorldAABB(
  entity: RuntimeMountedEntity,
  atX = entity.transformState.x,
  atY = entity.transformState.y
): RuntimeCollisionAABB | null {
  if (!hasActiveCollision(entity) || !entity.collisionBounds) return null;

  const { halfWidth, halfHeight, offsetX = 0, offsetY = 0 } = entity.collisionBounds;
  const cx = atX + offsetX;
  const cy = atY + offsetY;

  return {
    left: cx - halfWidth,
    right: cx + halfWidth,
    top: cy - halfHeight,
    bottom: cy + halfHeight,
  };
}

export function isValidAABB(box: RuntimeCollisionAABB | null | undefined): box is RuntimeCollisionAABB {
  if (!box) return false;
  return (
    Number.isFinite(box.left) &&
    Number.isFinite(box.top) &&
    Number.isFinite(box.right) &&
    Number.isFinite(box.bottom) &&
    box.right > box.left &&
    box.bottom > box.top
  );
}

export function aabbOverlap(a: RuntimeCollisionAABB, b: RuntimeCollisionAABB): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

export function pointInAABB(x: number, y: number, box: RuntimeCollisionAABB): boolean {
  return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
}

export function entitiesOverlap(
  a: RuntimeMountedEntity,
  b: RuntimeMountedEntity
): boolean {
  const boxA = entityWorldAABB(a);
  const boxB = entityWorldAABB(b);
  if (!boxA || !boxB) return false;
  return aabbOverlap(boxA, boxB);
}

export function defaultActorBounds(): RuntimeCollisionBounds {
  return { halfWidth: DEFAULT_HALF_SIZE, halfHeight: DEFAULT_HALF_SIZE };
}
