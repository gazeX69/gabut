/**
 * Phaser Audio Bridge
 * Isolates Phaser sound APIs from the runtime audio layer.
 * @module apps/runtime/phaser-adapter
 */

import type Phaser from 'phaser';

export function clampVolume(volume: number): number {
  if (!Number.isFinite(volume)) return 0;
  return Math.max(0, Math.min(1, volume));
}

export function isAudioAssetLoaded(scene: Phaser.Scene, assetId: string): boolean {
  return scene.cache.audio.exists(assetId);
}

export function playPhaserSound(
  scene: Phaser.Scene,
  assetId: string,
  volume: number,
  loop: boolean
): Phaser.Sound.BaseSound | null {
  if (!scene.sound || !isAudioAssetLoaded(scene, assetId)) {
    return null;
  }

  try {
    const sound = scene.sound.add(assetId, {
      volume: clampVolume(volume),
      loop,
    });
    if (!sound.play()) {
      sound.destroy();
      return null;
    }
    return sound;
  } catch (err) {
    console.warn(`[PhaserAudio] play failed for '${assetId}':`, err);
    return null;
  }
}

export function stopPhaserSound(sound: unknown): void {
  const s = sound as Phaser.Sound.BaseSound;
  if (!s || typeof s.stop !== 'function') return;
  try {
    if (s.isPlaying) s.stop();
    if (typeof s.destroy === 'function') s.destroy();
  } catch {
    // Isolated cleanup
  }
}

export function setPhaserSoundVolume(sound: unknown, volume: number): void {
  const s = sound as Phaser.Sound.WebAudioSound;
  if (!s) return;
  try {
    if (typeof s.setVolume === 'function') {
      s.setVolume(clampVolume(volume));
    }
  } catch {
    // Isolated
  }
}

export function isPhaserSoundPlaying(sound: unknown): boolean {
  const s = sound as Phaser.Sound.BaseSound;
  return Boolean(s && s.isPlaying);
}
