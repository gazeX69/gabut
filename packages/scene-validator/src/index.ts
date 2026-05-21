/**
 * @vgz/scene-validator
 *
 * Lightweight scene schema validation for VGZ.
 *
 * Exports:
 * - validateScene(): Main validation function
 * - ValidationResult, ValidationError: Result types
 * - Individual validators for reuse
 *
 * No runtime rendering, no Phaser integration.
 * Pure validation logic, framework-agnostic.
 */

export type {
  ValidationResult,
  ValidationError,
  ValidationSeverity,
  ValidationErrorCode,
} from './errors.js';

export {
  createError,
  createValidationResult,
} from './errors.js';

export {
  validateId,
  validatePositiveNumber,
  validateNumberInRange,
  validateString,
  validateISO8601,
  validateViewport,
  validatePosition,
  validateTransform,
  validateNoDuplicateIds,
  validateReferences,
  validateTileData,
} from './validators.js';

export { validateScene } from './scene.js';
