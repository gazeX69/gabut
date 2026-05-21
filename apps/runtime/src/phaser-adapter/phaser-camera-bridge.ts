/**
 * Phaser Camera Bridge
 * Isolates Phaser's camera API from the runtime boundary.
 * @module apps/runtime/phaser-adapter
 */

import type Phaser from 'phaser';
import type { RuntimeCameraState } from './runtime-camera-state.js';

export class PhaserCameraBridge {
  private isDisposed = false;

  constructor(private phaserCamera: Phaser.Cameras.Scene2D.Camera, private state: RuntimeCameraState) {
    this.state.width = phaserCamera.width;
    this.state.height = phaserCamera.height;
    // We do not sync from Phaser on initialization because Phaser camera scroll might be uninitialized (e.g. 0,0 top left),
    // and we want centerOn semantics typically, but let's just initialize state based on current Phaser values
    // Assuming world coordinate system
    this.state.x = phaserCamera.midPoint.x;
    this.state.y = phaserCamera.midPoint.y;
    this.state.zoom = phaserCamera.zoom;
    this.state.rotation = (phaserCamera as Phaser.Cameras.Scene2D.Camera & { rotation?: number }).rotation ?? 0;
  }

  syncToPhaser() {
    if (this.isDisposed) return;

    try {
      this.phaserCamera.centerOn(this.state.x, this.state.y);
      this.phaserCamera.setZoom(this.state.zoom);
      this.phaserCamera.setRotation(this.state.rotation);
    } catch (err) {
      console.warn(`[PhaserCameraBridge] Failed to sync camera state:`, err);
    }
  }

  dispose() {
    this.isDisposed = true;
  }
}
