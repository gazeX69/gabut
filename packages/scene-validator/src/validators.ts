/**
 * Individual field validators
 * Reusable validation functions for scene components
 * @module scene-validator/validators
 */

import type { ValidationError } from './errors.js';
import { createError } from './errors.js';
import type {
  VGZSceneSchema,
  VGZSceneLayer,
  VGZSceneEntity,
  VGZTransform,
  VGZPosition,
  VGZAssetReference,
} from '@vgz/scene-types';

/**
 * Validate a string ID format
 * IDs must be lowercase with hyphens (no spaces, uppercase, underscores)
 */
export function validateId(value: any, path: string): ValidationError | null {
  if (typeof value !== 'string') {
    return createError('INVALID_TYPE', `Expected string, got ${typeof value}`, path, value, 'string');
  }

  if (value.length === 0) {
    return createError('INVALID_VALUE', 'ID cannot be empty', path, value);
  }

  if (!/^[a-z0-9-]+$/.test(value)) {
    return createError(
      'INVALID_FORMAT',
      'ID must contain only lowercase letters, numbers, and hyphens',
      path,
      value,
      'lowercase-with-hyphens'
    );
  }

  if (value.startsWith('-') || value.endsWith('-')) {
    return createError('INVALID_FORMAT', 'ID cannot start or end with hyphen', path, value);
  }

  return null;
}

/**
 * Validate a positive number
 */
export function validatePositiveNumber(value: any, path: string, minValue = 1): ValidationError | null {
  if (typeof value !== 'number') {
    return createError('INVALID_TYPE', `Expected number, got ${typeof value}`, path, value, 'number');
  }

  if (!Number.isFinite(value)) {
    return createError('INVALID_VALUE', 'Number must be finite', path, value);
  }

  if (value < minValue) {
    return createError('OUT_OF_BOUNDS', `Number must be >= ${minValue}`, path, value, minValue);
  }

  return null;
}

/**
 * Validate a number in range [min, max]
 */
export function validateNumberInRange(
  value: any,
  path: string,
  min: number,
  max: number
): ValidationError | null {
  if (typeof value !== 'number') {
    return createError('INVALID_TYPE', `Expected number, got ${typeof value}`, path, value, 'number');
  }

  if (!Number.isFinite(value)) {
    return createError('INVALID_VALUE', 'Number must be finite', path, value);
  }

  if (value < min || value > max) {
    return createError(
      'OUT_OF_BOUNDS',
      `Number must be between ${min} and ${max}`,
      path,
      value,
      `[${min}, ${max}]`
    );
  }

  return null;
}

/**
 * Validate a non-empty string
 */
export function validateString(value: any, path: string, minLength = 1): ValidationError | null {
  if (typeof value !== 'string') {
    return createError('INVALID_TYPE', `Expected string, got ${typeof value}`, path, value, 'string');
  }

  if (value.length < minLength) {
    return createError(
      'INVALID_VALUE',
      `String must be at least ${minLength} character(s)`,
      path,
      value,
      minLength
    );
  }

  return null;
}

/**
 * Validate ISO timestamp format
 */
export function validateISO8601(value: any, path: string): ValidationError | null {
  if (typeof value !== 'string') {
    return createError('INVALID_TYPE', `Expected string, got ${typeof value}`, path, value, 'string');
  }

  // Basic ISO 8601 check
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    return createError('INVALID_FORMAT', 'Timestamp must be in ISO 8601 format', path, value, 'YYYY-MM-DDTHH:mm:ss');
  }

  // Try to parse as Date
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return createError('INVALID_VALUE', 'Timestamp is not a valid date', path, value);
  }

  return null;
}

/**
 * Validate viewport dimensions
 */
export function validateViewport(viewport: any, path: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof viewport !== 'object' || viewport === null) {
    errors.push(createError('INVALID_TYPE', 'Viewport must be an object', path, viewport, 'object'));
    return errors;
  }

  if (typeof viewport.width !== 'number') {
    errors.push(createError('MISSING_FIELD', 'Missing required field: width', `${path}.width`));
  } else {
    const widthErr = validatePositiveNumber(viewport.width, `${path}.width`, 64);
    if (widthErr) errors.push(widthErr);
  }

  if (typeof viewport.height !== 'number') {
    errors.push(createError('MISSING_FIELD', 'Missing required field: height', `${path}.height`));
  } else {
    const heightErr = validatePositiveNumber(viewport.height, `${path}.height`, 64);
    if (heightErr) errors.push(heightErr);
  }

  return errors;
}

/**
 * Validate position object
 */
export function validatePosition(position: any, path: string): ValidationError | null {
  if (typeof position !== 'object' || position === null) {
    return createError('INVALID_TYPE', 'Position must be an object', path, position, 'object');
  }

  if (typeof position.x !== 'number') {
    return createError('MISSING_FIELD', 'Missing required field: x', `${path}.x`);
  }

  if (typeof position.y !== 'number') {
    return createError('MISSING_FIELD', 'Missing required field: y', `${path}.y`);
  }

  if (!Number.isFinite(position.x)) {
    return createError('INVALID_VALUE', 'x must be a finite number', `${path}.x`, position.x);
  }

  if (!Number.isFinite(position.y)) {
    return createError('INVALID_VALUE', 'y must be a finite number', `${path}.y`, position.y);
  }

  return null;
}

/**
 * Validate transform (position, rotation, scale)
 */
export function validateTransform(transform: any, path: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof transform !== 'object' || transform === null) {
    errors.push(createError('INVALID_TYPE', 'Transform must be an object', path, transform, 'object'));
    return errors;
  }

  // Validate position
  const posErr = validatePosition(transform.position, `${path}.position`);
  if (posErr) errors.push(posErr);

  // Validate rotation
  if (typeof transform.rotation !== 'number') {
    errors.push(createError('MISSING_FIELD', 'Missing required field: rotation', `${path}.rotation`));
  } else {
    const rotErr = validateNumberInRange(transform.rotation, `${path}.rotation`, 0, 360);
    if (rotErr) errors.push(rotErr);
  }

  // Validate scale
  if (typeof transform.scale !== 'object' || transform.scale === null) {
    errors.push(createError('INVALID_TYPE', 'Scale must be an object', `${path}.scale`, transform.scale, 'object'));
  } else {
    if (typeof transform.scale.x !== 'number') {
      errors.push(createError('MISSING_FIELD', 'Missing required field: x', `${path}.scale.x`));
    } else if (transform.scale.x <= 0) {
      errors.push(createError('OUT_OF_BOUNDS', 'Scale.x must be positive', `${path}.scale.x`, transform.scale.x, '> 0'));
    }

    if (typeof transform.scale.y !== 'number') {
      errors.push(createError('MISSING_FIELD', 'Missing required field: y', `${path}.scale.y`));
    } else if (transform.scale.y <= 0) {
      errors.push(createError('OUT_OF_BOUNDS', 'Scale.y must be positive', `${path}.scale.y`, transform.scale.y, '> 0'));
    }
  }

  return errors;
}

/**
 * Validate array has no duplicate IDs
 */
export function validateNoDuplicateIds(items: any[], idField: string, path: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const id = item?.[idField];

    if (typeof id === 'string') {
      if (seen.has(id)) {
        errors.push(
          createError('DUPLICATE_ID', `Duplicate ${idField} "${id}"`, `${path}[${i}]`, id)
        );
      }
      seen.add(id);
    }
  }

  return errors;
}

/**
 * Validate that reference IDs exist in a collection
 */
export function validateReferences(
  referenceIds: string[],
  availableIds: Set<string>,
  path: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (let i = 0; i < referenceIds.length; i++) {
    const refId = referenceIds[i];
    if (!availableIds.has(refId)) {
      errors.push(
        createError('INVALID_REFERENCE', `Referenced ID not found: "${refId}"`, `${path}[${i}]`, refId)
      );
    }
  }

  return errors;
}

/**
 * Validate layer tile data
 */
export function validateTileData(tileData: any, path: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof tileData !== 'object' || tileData === null) {
    errors.push(createError('INVALID_TYPE', 'TileData must be an object', path, tileData, 'object'));
    return errors;
  }

  // Width and height
  if (typeof tileData.width !== 'number') {
    errors.push(createError('MISSING_FIELD', 'Missing required field: width', `${path}.width`));
  } else {
    const err = validatePositiveNumber(tileData.width, `${path}.width`);
    if (err) errors.push(err);
  }

  if (typeof tileData.height !== 'number') {
    errors.push(createError('MISSING_FIELD', 'Missing required field: height', `${path}.height`));
  } else {
    const err = validatePositiveNumber(tileData.height, `${path}.height`);
    if (err) errors.push(err);
  }

  // Tile size
  if (typeof tileData.tileSize !== 'number') {
    errors.push(createError('MISSING_FIELD', 'Missing required field: tileSize', `${path}.tileSize`));
  } else {
    const err = validatePositiveNumber(tileData.tileSize, `${path}.tileSize`, 8);
    if (err) errors.push(err);
  }

  // Tiles array
  if (!Array.isArray(tileData.tiles)) {
    errors.push(createError('MISSING_FIELD', 'Missing required field: tiles', `${path}.tiles`));
  } else {
    const expectedLength = (tileData.width ?? 0) * (tileData.height ?? 0);
    if (expectedLength > 0 && tileData.tiles.length !== expectedLength) {
      errors.push(
        createError(
          'INCONSISTENT_DATA',
          `Tiles array length mismatch: expected ${expectedLength}, got ${tileData.tiles.length}`,
          `${path}.tiles`,
          tileData.tiles.length,
          expectedLength
        )
      );
    }
  }

  // TilesetIds
  if (!Array.isArray(tileData.tilesetIds)) {
    errors.push(createError('MISSING_FIELD', 'Missing required field: tilesetIds', `${path}.tilesetIds`));
  } else if (tileData.tilesetIds.length === 0) {
    errors.push(
      createError('EMPTY_COLLECTION', 'TilesetIds cannot be empty', `${path}.tilesetIds`, [], 'at least one tileset')
    );
  }

  return errors;
}
