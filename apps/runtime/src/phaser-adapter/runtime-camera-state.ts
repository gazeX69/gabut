/**
 * Runtime Camera State
 * Pure runtime abstraction for camera mathematically driven by components.
 * @module apps/runtime/phaser-adapter
 */

export class RuntimeCameraState {
  public x = 0;
  public y = 0;
  public zoom = 1;
  public rotation = 0;
  public width = 0;
  public height = 0;

  public followingEntityId?: string;
  private isDisposed = false;

  setPosition(x: number, y: number) {
    if (this.isDisposed) return;
    this.x = x;
    this.y = y;
  }

  setZoom(zoom: number) {
    if (this.isDisposed) return;
    this.zoom = zoom;
  }

  setRotation(rotation: number) {
    if (this.isDisposed) return;
    this.rotation = rotation;
  }

  followEntity(entityId: string) {
    if (this.isDisposed) return;
    this.followingEntityId = entityId;
  }

  stopFollow() {
    if (this.isDisposed) return;
    this.followingEntityId = undefined;
  }

  dispose() {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.followingEntityId = undefined;
  }
}
