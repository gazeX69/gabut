/**
 * Runtime Load Errors
 * Structured error types for the scene loading pipeline
 * @module engine-runtime/errors
 */

// ─── RuntimeLoadError ────────────────────────────────────────────────────────

/**
 * Error codes for the top-level load pipeline
 */
export type RuntimeLoadErrorCode =
  | 'INVALID_INPUT'
  | 'VALIDATION_FAILED'
  | 'CONVERSION_FAILED';

/**
 * Structured error returned in RuntimeLoadResult on failure.
 * Not thrown — carried as data in the result union.
 */
export interface RuntimeLoadError {
  readonly code: RuntimeLoadErrorCode;
  readonly message: string;
  readonly context?: string;
  readonly sourcePath?: string;
}

// ─── DescriptorBuildError ────────────────────────────────────────────────────

/**
 * Error codes for descriptor conversion failures
 */
export type DescriptorBuildErrorCode =
  | 'UNKNOWN_LAYER_TYPE'
  | 'UNKNOWN_ENTITY_TYPE'
  | 'ASSET_RESOLUTION_FAILED'
  | 'CONVERSION_FAILED';

/**
 * Thrown if descriptor conversion fails unexpectedly.
 * Caught by loadScene and mapped to RuntimeLoadError.
 */
export class DescriptorBuildError extends Error {
  readonly code: DescriptorBuildErrorCode;
  readonly context?: string;
  readonly sourcePath?: string;

  constructor(
    code: DescriptorBuildErrorCode,
    message: string,
    context?: string,
    sourcePath?: string,
  ) {
    super(message);
    this.name = 'DescriptorBuildError';
    this.code = code;
    this.context = context;
    this.sourcePath = sourcePath;
  }
}

// ─── RegistryResolutionError ─────────────────────────────────────────────────

/**
 * Error codes for registry lookup failures
 */
export type RegistryResolutionErrorCode = 'TYPE_NOT_REGISTERED';

/**
 * Thrown if a type is not found in a registry.
 */
export class RegistryResolutionError extends Error {
  readonly code: RegistryResolutionErrorCode;
  readonly context?: string;
  readonly sourcePath?: string;

  constructor(
    code: RegistryResolutionErrorCode,
    message: string,
    context?: string,
    sourcePath?: string,
  ) {
    super(message);
    this.name = 'RegistryResolutionError';
    this.code = code;
    this.context = context;
    this.sourcePath = sourcePath;
  }
}

// ─── RuntimeLoadResult ───────────────────────────────────────────────────────

/**
 * Discriminated union result for loadScene().
 * Either a successful load with data, or a failure with errors.
 */
export type RuntimeLoadResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly errors: ReadonlyArray<RuntimeLoadError> };

// ─── Factory Functions ───────────────────────────────────────────────────────

/**
 * Create a RuntimeLoadError value
 */
export function createRuntimeLoadError(
  code: RuntimeLoadErrorCode,
  message: string,
  context?: string,
  sourcePath?: string,
): RuntimeLoadError {
  return Object.freeze({
    code,
    message,
    ...(context !== undefined && { context }),
    ...(sourcePath !== undefined && { sourcePath }),
  });
}

/**
 * Create a successful RuntimeLoadResult
 */
export function success<T>(data: T): RuntimeLoadResult<T> {
  return Object.freeze({ success: true as const, data });
}

/**
 * Create a failed RuntimeLoadResult
 */
export function failure<T>(errors: RuntimeLoadError[]): RuntimeLoadResult<T> {
  return Object.freeze({ success: false as const, errors: Object.freeze(errors) });
}
