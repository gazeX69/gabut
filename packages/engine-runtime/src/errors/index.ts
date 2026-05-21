/**
 * Error types and factories for the runtime loading pipeline
 * @module engine-runtime/errors
 */

export type {
  RuntimeLoadErrorCode,
  RuntimeLoadError,
  DescriptorBuildErrorCode,
  RegistryResolutionErrorCode,
  RuntimeLoadResult,
} from './runtime-errors.js';

export {
  DescriptorBuildError,
  RegistryResolutionError,
  createRuntimeLoadError,
  success,
  failure,
} from './runtime-errors.js';
