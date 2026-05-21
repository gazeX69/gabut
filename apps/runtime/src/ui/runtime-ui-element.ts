/**
 * Runtime UI element models (mutable, runtime-only, not serialized).
 * @module apps/runtime/ui
 */

export type RuntimeUIElementType = 'text' | 'panel';

/** Shared runtime wrapper; gameObject is opaque outside the UI bridge. */
export interface RuntimeUIElementBase {
  readonly id: string;
  readonly type: RuntimeUIElementType;
  visible: boolean;
  destroyed: boolean;
  /** Internal Phaser object handle — do not use outside phaser-ui-factory / RuntimeUILayer */
  gameObject: unknown;
}

export interface RuntimeUIText extends RuntimeUIElementBase {
  readonly type: 'text';
  content: string;
}

export interface RuntimeUIPanel extends RuntimeUIElementBase {
  readonly type: 'panel';
  width: number;
  height: number;
}

export type RuntimeUIElement = RuntimeUIText | RuntimeUIPanel;

export function isRuntimeUIText(el: RuntimeUIElement): el is RuntimeUIText {
  return el.type === 'text';
}
