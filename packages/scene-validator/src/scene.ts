/**
 * Main Scene Validator
 * Orchestrates validation of complete VGZSceneSchema
 * @module scene-validator/validateScene
 */

import type { VGZSceneSchema } from '@vgz/scene-types';
import type { ValidationResult, ValidationError } from './errors.js';
import { createValidationResult, createError } from './errors.js';
import {
  validateId,
  validateString,
  validateISO8601,
  validateViewport,
  validateTransform,
  validateNoDuplicateIds,
  validateReferences,
  validateTileData,
  validateNumberInRange,
} from './validators.js';

/**
 * Validate a complete VGZ scene schema
 *
 * Performs comprehensive validation including:
 * - Root scene fields (id, name, version, etc)
 * - Viewport dimensions
 * - Layers (structure, z-ordering, references)
 * - Entities (transforms, references, IDs)
 * - Assets (references, paths)
 * - Cross-references (entities in layers exist, assets referenced by entities exist)
 *
 * @param scene - Scene to validate
 * @returns ValidationResult with errors, warnings, and status
 *
 * @example
 * const result = validateScene(scene);
 * if (result.valid) {
 *   // Scene is ready to use
 * } else {
 *   result.errors.forEach(err => console.error(err.message));
 * }
 */
export function validateScene(scene: any): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Type check
  if (typeof scene !== 'object' || scene === null) {
    errors.push(createError('INVALID_TYPE', 'Scene must be an object', 'root', scene, 'object'));
    return createValidationResult(errors, warnings);
  }

  // Root fields
  const rootErrors = validateRootFields(scene);
  errors.push(...rootErrors);

  // If critical root fields are missing, stop here
  if (errors.some(e => ['id', 'name', 'version', 'viewport', 'layers', 'entities', 'assets'].some(f => e.path.includes(f)))) {
    return createValidationResult(errors, warnings);
  }

  // Validate collections
  const layerErrors = validateLayers(scene.layers, scene.entities);
  errors.push(...layerErrors);

  const entityErrors = validateEntities(scene.entities);
  errors.push(...entityErrors);

  const assetErrors = validateAssets(scene.assets);
  errors.push(...assetErrors);

  // Cross-reference validation
  const refErrors = validateCrossReferences(scene);
  errors.push(...refErrors);

  return createValidationResult(errors, warnings);
}

/**
 * Validate root-level scene fields
 */
function validateRootFields(scene: any): ValidationError[] {
  const errors: ValidationError[] = [];

  // ID
  if (typeof scene.id === 'undefined') {
    errors.push(createError('MISSING_FIELD', 'Missing required field: id', 'id'));
  } else {
    const err = validateId(scene.id, 'id');
    if (err) errors.push(err);
  }

  // Name
  if (typeof scene.name === 'undefined') {
    errors.push(createError('MISSING_FIELD', 'Missing required field: name', 'name'));
  } else {
    const err = validateString(scene.name, 'name');
    if (err) errors.push(err);
  }

  // Version
  if (typeof scene.version === 'undefined') {
    errors.push(createError('MISSING_FIELD', 'Missing required field: version', 'version'));
  } else if (scene.version !== 1) {
    errors.push(
      createError('SCHEMA_VERSION_MISMATCH', `Unsupported schema version: ${scene.version}`, 'version', scene.version, 1)
    );
  }

  // UpdatedAt
  if (typeof scene.updatedAt === 'undefined') {
    errors.push(createError('MISSING_FIELD', 'Missing required field: updatedAt', 'updatedAt'));
  } else {
    const err = validateISO8601(scene.updatedAt, 'updatedAt');
    if (err) errors.push(err);
  }

  // Viewport
  if (typeof scene.viewport === 'undefined') {
    errors.push(createError('MISSING_FIELD', 'Missing required field: viewport', 'viewport'));
  } else {
    const viewportErrors = validateViewport(scene.viewport, 'viewport');
    errors.push(...viewportErrors);
  }

  // Layers
  if (typeof scene.layers === 'undefined') {
    errors.push(createError('MISSING_FIELD', 'Missing required field: layers', 'layers'));
  } else if (!Array.isArray(scene.layers)) {
    errors.push(createError('INVALID_TYPE', 'Layers must be an array', 'layers', scene.layers, 'array'));
  }

  // Entities
  if (typeof scene.entities === 'undefined') {
    errors.push(createError('MISSING_FIELD', 'Missing required field: entities', 'entities'));
  } else if (typeof scene.entities !== 'object' || scene.entities === null || Array.isArray(scene.entities)) {
    errors.push(
      createError('INVALID_TYPE', 'Entities must be an object (indexed by ID)', 'entities', scene.entities, 'object')
    );
  }

  // Assets
  if (typeof scene.assets === 'undefined') {
    errors.push(createError('MISSING_FIELD', 'Missing required field: assets', 'assets'));
  } else if (!Array.isArray(scene.assets)) {
    errors.push(createError('INVALID_TYPE', 'Assets must be an array', 'assets', scene.assets, 'array'));
  }

  return errors;
}

/**
 * Validate all layers
 */
function validateLayers(layers: any, entities: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!Array.isArray(layers)) {
    return errors;
  }

  if (layers.length === 0) {
    errors.push(
      createError('EMPTY_COLLECTION', 'Scene must have at least one layer', 'layers', [], 'at least one layer')
    );
    return errors;
  }

  // Check for duplicate IDs
  const idErrors = validateNoDuplicateIds(layers, 'id', 'layers');
  errors.push(...idErrors);

  // Check z-index uniqueness
  const zIndexes = new Set<number>();
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];

    // Validate layer
    const layerErrors = validateLayer(layer, i);
    errors.push(...layerErrors);

    // Check z-index
    if (typeof layer.zIndex === 'number') {
      if (zIndexes.has(layer.zIndex)) {
        errors.push(
          createError('DUPLICATE_ID', `Duplicate zIndex: ${layer.zIndex}`, `layers[${i}].zIndex`, layer.zIndex)
        );
      }
      zIndexes.add(layer.zIndex);
    }

    // Validate entity references for entity layers
    if (layer.type === 'entity' && Array.isArray(layer.entityIds) && typeof entities === 'object') {
      const entityIds = new Set(Object.keys(entities));
      const refErrors = validateReferences(layer.entityIds, entityIds, `layers[${i}].entityIds`);
      errors.push(...refErrors);
    }
  }

  return errors;
}

/**
 * Validate a single layer
 */
function validateLayer(layer: any, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const path = `layers[${index}]`;

  if (typeof layer !== 'object' || layer === null) {
    errors.push(createError('INVALID_TYPE', 'Layer must be an object', path, layer, 'object'));
    return errors;
  }

  // ID
  if (typeof layer.id === 'undefined') {
    errors.push(createError('MISSING_FIELD', 'Missing required field: id', `${path}.id`));
  } else {
    const err = validateId(layer.id, `${path}.id`);
    if (err) errors.push(err);
  }

  // Name
  if (typeof layer.name === 'undefined') {
    errors.push(createError('MISSING_FIELD', 'Missing required field: name', `${path}.name`));
  }

  // Type
  if (typeof layer.type === 'undefined') {
    errors.push(createError('MISSING_FIELD', 'Missing required field: type', `${path}.type`));
  } else if (!['tilemap', 'entity', 'particle', 'light', 'shadow'].includes(layer.type)) {
    errors.push(
      createError('INVALID_VALUE', `Invalid layer type: ${layer.type}`, `${path}.type`, layer.type, 'tilemap|entity|particle|light|shadow')
    );
  }

  // zIndex
  if (typeof layer.zIndex === 'undefined') {
    errors.push(createError('MISSING_FIELD', 'Missing required field: zIndex', `${path}.zIndex`));
  } else if (typeof layer.zIndex !== 'number') {
    errors.push(createError('INVALID_TYPE', 'zIndex must be a number', `${path}.zIndex`, layer.zIndex, 'number'));
  }

  // Visible
  if (typeof layer.visible !== 'boolean') {
    errors.push(createError('INVALID_TYPE', 'visible must be a boolean', `${path}.visible`, layer.visible, 'boolean'));
  }

  // Opacity
  if (typeof layer.opacity === 'undefined') {
    errors.push(createError('MISSING_FIELD', 'Missing required field: opacity', `${path}.opacity`));
  } else {
    const err = validateNumberInRange(layer.opacity, `${path}.opacity`, 0, 1);
    if (err) errors.push(err);
  }

  // Version
  if (layer.version !== 1) {
    errors.push(
      createError('SCHEMA_VERSION_MISMATCH', `Unsupported layer version: ${layer.version}`, `${path}.version`, layer.version, 1)
    );
  }

  // Type-specific validation
  if (layer.type === 'tilemap') {
    if (typeof layer.tileData === 'undefined') {
      errors.push(createError('MISSING_FIELD', 'Tilemap layer must have tileData', `${path}.tileData`));
    } else {
      const tileErrors = validateTileData(layer.tileData, `${path}.tileData`);
      errors.push(...tileErrors);
    }
  } else if (layer.type === 'entity') {
    if (typeof layer.entityIds === 'undefined') {
      errors.push(createError('MISSING_FIELD', 'Entity layer must have entityIds', `${path}.entityIds`));
    } else if (!Array.isArray(layer.entityIds)) {
      errors.push(createError('INVALID_TYPE', 'entityIds must be an array', `${path}.entityIds`, layer.entityIds, 'array'));
    }
  }

  return errors;
}

/**
 * Validate all entities
 */
function validateEntities(entities: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof entities !== 'object' || entities === null || Array.isArray(entities)) {
    return errors;
  }

  const entityIds = Object.keys(entities);

  // Check for duplicate IDs
  const seen = new Set<string>();
  for (const id of entityIds) {
    if (seen.has(id)) {
      errors.push(createError('DUPLICATE_ID', `Duplicate entity ID: ${id}`, `entities.${id}`));
    }
    seen.add(id);
  }

  // Validate each entity
  for (const id of entityIds) {
    const entity = entities[id];
    const entityErrors = validateEntity(entity, id);
    errors.push(...entityErrors);
  }

  return errors;
}

/**
 * Validate a single entity
 */
function validateEntity(entity: any, id: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const path = `entities.${id}`;

  if (typeof entity !== 'object' || entity === null) {
    errors.push(createError('INVALID_TYPE', 'Entity must be an object', path, entity, 'object'));
    return errors;
  }

  // Entity.id should match key
  if (entity.id !== id) {
    errors.push(
      createError('INCONSISTENT_DATA', `Entity.id (${entity.id}) does not match key (${id})`, `${path}.id`, entity.id, id)
    );
  }

  // Name
  if (typeof entity.name === 'undefined') {
    errors.push(createError('MISSING_FIELD', 'Missing required field: name', `${path}.name`));
  }

  // Type
  if (typeof entity.type === 'undefined') {
    errors.push(createError('MISSING_FIELD', 'Missing required field: type', `${path}.type`));
  } else if (!['actor', 'prop', 'trigger', 'decoration'].includes(entity.type)) {
    errors.push(
      createError('INVALID_VALUE', `Invalid entity type: ${entity.type}`, `${path}.type`, entity.type, 'actor|prop|trigger|decoration')
    );
  }

  // Transform
  if (typeof entity.transform === 'undefined') {
    errors.push(createError('MISSING_FIELD', 'Missing required field: transform', `${path}.transform`));
  } else {
    const transformErrors = validateTransform(entity.transform, `${path}.transform`);
    errors.push(...transformErrors);
  }

  // Visible
  if (typeof entity.visible !== 'boolean') {
    errors.push(createError('INVALID_TYPE', 'visible must be a boolean', `${path}.visible`, entity.visible, 'boolean'));
  }

  // Version
  if (entity.version !== 1) {
    errors.push(
      createError('SCHEMA_VERSION_MISMATCH', `Unsupported entity version: ${entity.version}`, `${path}.version`, entity.version, 1)
    );
  }

  return errors;
}

/**
 * Validate all assets
 */
function validateAssets(assets: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!Array.isArray(assets)) {
    return errors;
  }

  // Check for duplicate IDs
  const idErrors = validateNoDuplicateIds(assets, 'id', 'assets');
  errors.push(...idErrors);

  // Validate each asset
  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    const assetErrors = validateAsset(asset, i);
    errors.push(...assetErrors);
  }

  return errors;
}

/**
 * Validate a single asset
 */
function validateAsset(asset: any, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const path = `assets[${index}]`;

  if (typeof asset !== 'object' || asset === null) {
    errors.push(createError('INVALID_TYPE', 'Asset must be an object', path, asset, 'object'));
    return errors;
  }

  // ID
  if (typeof asset.id === 'undefined') {
    errors.push(createError('MISSING_FIELD', 'Missing required field: id', `${path}.id`));
  } else {
    const err = validateId(asset.id, `${path}.id`);
    if (err) errors.push(err);
  }

  // Type
  if (typeof asset.type === 'undefined') {
    errors.push(createError('MISSING_FIELD', 'Missing required field: type', `${path}.type`));
  } else if (!['tileset', 'sprite', 'animation', 'audio', 'font', 'particle'].includes(asset.type)) {
    errors.push(
      createError(
        'INVALID_VALUE',
        `Invalid asset type: ${asset.type}`,
        `${path}.type`,
        asset.type,
        'tileset|sprite|animation|audio|font|particle'
      )
    );
  }

  // Path
  if (typeof asset.path === 'undefined') {
    errors.push(createError('MISSING_FIELD', 'Missing required field: path', `${path}.path`));
  } else if (typeof asset.path !== 'string') {
    errors.push(createError('INVALID_TYPE', 'path must be a string', `${path}.path`, asset.path, 'string'));
  }

  // Version
  if (asset.version !== 1) {
    errors.push(
      createError('SCHEMA_VERSION_MISMATCH', `Unsupported asset version: ${asset.version}`, `${path}.version`, asset.version, 1)
    );
  }

  return errors;
}

/**
 * Validate cross-references between components
 */
function validateCrossReferences(scene: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!Array.isArray(scene.layers) || typeof scene.entities !== 'object' || !Array.isArray(scene.assets)) {
    return errors;
  }

  const entityIds = new Set<string>(Object.keys(scene.entities));
  const assetIds = new Set<string>(scene.assets.map((a: any) => a?.id).filter((id: any) => typeof id === 'string'));

  // Check entity references in layers
  for (let i = 0; i < scene.layers.length; i++) {
    const layer = scene.layers[i];
    if (layer.type === 'entity' && Array.isArray(layer.entityIds)) {
      const refErrors = validateReferences(layer.entityIds, entityIds, `layers[${i}].entityIds`);
      errors.push(...refErrors);
    }
  }

  // Check asset references in entities
  for (const id of Object.keys(scene.entities)) {
    const entity = scene.entities[id];
    if (typeof entity?.assetId === 'string') {
      if (!assetIds.has(entity.assetId)) {
        errors.push(
          createError('INVALID_REFERENCE', `Asset not found: "${entity.assetId}"`, `entities.${id}.assetId`, entity.assetId)
        );
      }
    }
  }

  // Check tileset references in layers
  for (let i = 0; i < scene.layers.length; i++) {
    const layer = scene.layers[i];
    if (layer.type === 'tilemap' && layer.tileData?.tilesetIds) {
      const refErrors = validateReferences(layer.tileData.tilesetIds, assetIds, `layers[${i}].tileData.tilesetIds`);
      errors.push(...refErrors);
    }
  }

  return errors;
}
