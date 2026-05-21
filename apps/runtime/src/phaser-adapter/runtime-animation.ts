/**
 * Minimal Runtime Sprite Animation Foundation
 * @module apps/runtime/phaser-adapter
 */

export interface AnimationClip {
  id: string;
  textureKey: string;
  frames: number[]; // Frame indices in the spritesheet
  fps: number;
  loop: boolean;
}

export interface RuntimeAnimationState {
  clipId: string;
  playing: boolean;
  currentFrameIndex: number; // Index into the clip's frames array
  elapsedMs: number;
  loop: boolean;
}

export const DEMO_ANIMATION_CLIPS: Record<string, AnimationClip> = {
  'hero-idle': {
    id: 'hero-idle',
    textureKey: 'valid-player-sprite',
    frames: [0], // Assuming frame 0 is idle
    fps: 1,
    loop: true
  },
  'hero-walk': {
    id: 'hero-walk',
    textureKey: 'valid-player-sprite',
    frames: [0, 1, 0, 2], // Simple walk cycle
    fps: 8,
    loop: true
  }
};
