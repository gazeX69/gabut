/**
 * Runtime Input State
 * Engine-agnostic input tracker for keys and pointer events.
 * @module apps/runtime/phaser-adapter
 */

export class RuntimeInputState {
  public pressedKeys = new Set<string>();
  public justPressedKeys = new Set<string>();
  public justReleasedKeys = new Set<string>();

  public pointerX = 0;
  public pointerY = 0;
  public pointerDown = false;
  public pointerJustDown = false;
  public pointerJustUp = false;

  private isDisposed = false;

  /** Check if a key is currently held down */
  isKeyDown(key: string): boolean {
    return this.pressedKeys.has(key.toUpperCase());
  }

  /** Check if a key was pressed this exact frame */
  wasKeyPressed(key: string): boolean {
    return this.justPressedKeys.has(key.toUpperCase());
  }

  /** Check if a key was released this exact frame */
  wasKeyReleased(key: string): boolean {
    return this.justReleasedKeys.has(key.toUpperCase());
  }

  /**
   * Clears per-frame state. 
   * Called automatically by the RuntimeSceneLoop at the very end of the tick.
   */
  resetFrameState() {
    if (this.isDisposed) return;
    this.justPressedKeys.clear();
    this.justReleasedKeys.clear();
    this.pointerJustDown = false;
    this.pointerJustUp = false;
  }

  dispose() {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.pressedKeys.clear();
    this.justPressedKeys.clear();
    this.justReleasedKeys.clear();
  }
}
