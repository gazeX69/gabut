/**
 * Scene Loader
 * Top-level entry point for loading scene JSON into runtime descriptors.
 * Validation happens once here — downstream converters assume valid input.
 * @module engine-runtime/loader
 */

import type { VGZSceneSchema } from '@vgz/scene-types';
import { validateScene } from '@vgz/scene-validator';
import type { ValidationError } from '@vgz/scene-validator';

import type { RuntimeScene } from '../runtime-scene.js';
import type { RuntimeLoadResult, RuntimeLoadError } from '../errors/runtime-errors.js';
import {
  createRuntimeLoadError,
  success,
  failure,
  DescriptorBuildError,
} from '../errors/runtime-errors.js';
import { buildRuntimeScene } from './scene-converter.js';

// ─── Validation Error Mapping ────────────────────────────────────────────────

/**
 * Map a ValidationError from @vgz/scene-validator to a RuntimeLoadError.
 * Preserves the original error code and path as context/sourcePath.
 */
function mapValidationError(err: ValidationError): RuntimeLoadError {
  return createRuntimeLoadError(
    'VALIDATION_FAILED',
    err.message,
    `${err.code} (${err.severity})`,
    err.path,
  );
}

// ─── loadScene ───────────────────────────────────────────────────────────────

/**
 * Load a scene from unknown JSON input.
 *
 * Pipeline:
 * 1. Type-guard: input must be a non-null object
 * 2. Validate with @vgz/scene-validator (single validation boundary)
 * 3. If invalid → return failure with structured errors
 * 4. Convert validated schema → immutable RuntimeScene
 * 5. Return success
 *
 * @param input - Unknown JSON value (typically parsed from file/network)
 * @returns RuntimeLoadResult<RuntimeScene> — discriminated union:
 *          success with frozen RuntimeScene, or failure with RuntimeLoadError[]
 *
 * @example
 * ```ts
 * const result = loadScene(json);
 * if (result.success) {
 *   console.log(result.data.id);
 *   console.log(result.data.entities.size);
 * } else {
 *   result.errors.forEach(e => console.error(`[${e.code}] ${e.message}`));
 * }
 * ```
 */
export function loadScene(input: unknown): RuntimeLoadResult<RuntimeScene> {
  // 1. Type guard — reject non-objects early
  if (typeof input !== 'object' || input === null) {
    return failure([
      createRuntimeLoadError(
        'INVALID_INPUT',
        `Expected scene object, received ${input === null ? 'null' : typeof input}`,
        'loadScene input guard',
      ),
    ]);
  }

  // 2. Validate with scene-validator (single validation boundary)
  const validationResult = validateScene(input);

  // 3. If invalid, map errors and return failure
  if (!validationResult.valid) {
    const loadErrors: RuntimeLoadError[] =
      validationResult.errors.map(mapValidationError);
    return failure(loadErrors);
  }

  // 4. Convert to runtime descriptors
  //    Validation passed — conversion should always succeed.
  //    Wrapped in try/catch as a safety net for unexpected edge cases.
  try {
    const scene = input as VGZSceneSchema;
    const runtimeScene = buildRuntimeScene(scene);
    return success(runtimeScene);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const sourcePath =
      err instanceof DescriptorBuildError ? err.sourcePath : undefined;

    return failure([
      createRuntimeLoadError(
        'CONVERSION_FAILED',
        `Scene conversion failed: ${message}`,
        'buildRuntimeScene',
        sourcePath,
      ),
    ]);
  }
}
