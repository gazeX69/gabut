/**
 * Phaser Input Bridge
 * Connects Phaser DOM/Input events to the agnostic RuntimeInputState.
 * @module apps/runtime/phaser-adapter
 */

import type Phaser from 'phaser';
import type { RuntimeInputState } from './runtime-input-state.js';

export class PhaserInputBridge {
  private isDisposed = false;
  
  // Bound listener references so we can remove them safely
  private onKeyDown: (event: KeyboardEvent) => void;
  private onKeyUp: (event: KeyboardEvent) => void;
  private onPointerDown: (pointer: Phaser.Input.Pointer) => void;
  private onPointerUp: (pointer: Phaser.Input.Pointer) => void;
  private onPointerMove: (pointer: Phaser.Input.Pointer) => void;

  constructor(private phaserScene: Phaser.Scene, private state: RuntimeInputState) {
    
    this.onKeyDown = (event: KeyboardEvent) => {
      if (this.isDisposed || event.repeat) return;
      const key = event.key.toUpperCase();
      this.state.pressedKeys.add(key);
      this.state.justPressedKeys.add(key);
    };

    this.onKeyUp = (event: KeyboardEvent) => {
      if (this.isDisposed) return;
      const key = event.key.toUpperCase();
      this.state.pressedKeys.delete(key);
      this.state.justReleasedKeys.add(key);
    };

    this.onPointerDown = (pointer: Phaser.Input.Pointer) => {
      if (this.isDisposed) return;
      this.state.pointerDown = true;
      this.state.pointerJustDown = true;
      this.state.pointerX = pointer.worldX;
      this.state.pointerY = pointer.worldY;
    };

    this.onPointerUp = (pointer: Phaser.Input.Pointer) => {
      if (this.isDisposed) return;
      this.state.pointerDown = false;
      this.state.pointerJustUp = true;
      this.state.pointerX = pointer.worldX;
      this.state.pointerY = pointer.worldY;
    };

    this.onPointerMove = (pointer: Phaser.Input.Pointer) => {
      if (this.isDisposed) return;
      this.state.pointerX = pointer.worldX;
      this.state.pointerY = pointer.worldY;
    };

    // Bind keyboard (using DOM directly on the input plugin config)
    if (this.phaserScene.input.keyboard) {
      this.phaserScene.input.keyboard.on('keydown', this.onKeyDown);
      this.phaserScene.input.keyboard.on('keyup', this.onKeyUp);
    }

    // Bind pointer
    this.phaserScene.input.on('pointerdown', this.onPointerDown);
    this.phaserScene.input.on('pointerup', this.onPointerUp);
    this.phaserScene.input.on('pointermove', this.onPointerMove);
  }

  dispose() {
    if (this.isDisposed) return;
    this.isDisposed = true;

    if (this.phaserScene.input) {
      if (this.phaserScene.input.keyboard) {
        this.phaserScene.input.keyboard.off('keydown', this.onKeyDown);
        this.phaserScene.input.keyboard.off('keyup', this.onKeyUp);
      }
      this.phaserScene.input.off('pointerdown', this.onPointerDown);
      this.phaserScene.input.off('pointerup', this.onPointerUp);
      this.phaserScene.input.off('pointermove', this.onPointerMove);
    }
  }
}
