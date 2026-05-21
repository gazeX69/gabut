/**
 * Validation Error Types
 * Structured error reporting for scene validation
 * @module scene-validator/errors
 */

/**
 * Validation error severity level
 */
export type ValidationSeverity = 'error' | 'warning';

/**
 * Validation error code (machine-readable category)
 */
export type ValidationErrorCode =
  | 'MISSING_FIELD'
  | 'INVALID_TYPE'
  | 'INVALID_VALUE'
  | 'OUT_OF_BOUNDS'
  | 'INVALID_REFERENCE'
  | 'DUPLICATE_ID'
  | 'INVALID_FORMAT'
  | 'INCONSISTENT_DATA'
  | 'EMPTY_COLLECTION'
  | 'SCHEMA_VERSION_MISMATCH';

/**
 * Single validation error
 */
export interface ValidationError {
  /** Error code (machine-readable) */
  code: ValidationErrorCode;

  /** Human-readable message */
  message: string;

  /** Where the error occurred */
  path: string;

  /** Error severity (error = blocking, warning = non-blocking) */
  severity: ValidationSeverity;

  /** Optional: value that failed validation */
  value?: any;

  /** Optional: expected value or format */
  expected?: any;
}

/**
 * Validation result: Pass or fail with detailed errors/warnings
 */
export interface ValidationResult {
  /** Is the scene valid (all errors, no critical failures)? */
  valid: boolean;

  /** Does scene have any errors (blocking issues)? */
  hasErrors: boolean;

  /** Does scene have any warnings (non-blocking issues)? */
  hasWarnings: boolean;

  /** All errors encountered */
  errors: ValidationError[];

  /** All warnings encountered */
  warnings: ValidationError[];

  /** Summary message */
  message: string;
}

/**
 * Create a validation error
 */
export function createError(
  code: ValidationErrorCode,
  message: string,
  path: string,
  value?: any,
  expected?: any,
  severity: ValidationSeverity = 'error'
): ValidationError {
  return {
    code,
    message,
    path,
    severity,
    ...(value !== undefined && { value }),
    ...(expected !== undefined && { expected }),
  };
}

/**
 * Combine validation errors and warnings into a result
 */
export function createValidationResult(
  errors: ValidationError[],
  warnings: ValidationError[] = []
): ValidationResult {
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;
  const valid = !hasErrors;

  const errorCount = errors.length;
  const warningCount = warnings.length;

  let message = '';
  if (valid && !hasWarnings) {
    message = 'Scene validation passed';
  } else if (valid && hasWarnings) {
    message = `Scene validation passed with ${warningCount} warning(s)`;
  } else {
    message = `Scene validation failed with ${errorCount} error(s)${warningCount > 0 ? ` and ${warningCount} warning(s)` : ''}`;
  }

  return {
    valid,
    hasErrors,
    hasWarnings,
    errors,
    warnings,
    message,
  };
}
