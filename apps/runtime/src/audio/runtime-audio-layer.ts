/**
 * Runtime Audio Layer
 * Screen-space-agnostic SFX/music API; Phaser details stay in phaser-audio-bridge.
 * @module apps/runtime/audio
 */

import type Phaser from 'phaser';
import {
  clampVolume,
  isAudioAssetLoaded,
  isPhaserSoundPlaying,
  playPhaserSound,
  setPhaserSoundVolume,
  stopPhaserSound,
} from '../phaser-adapter/phaser-audio-bridge.js';
import {
  createDefaultMusicState,
  type RuntimeMusicState,
  type RuntimePlayingSound,
} from './runtime-audio-element.js';

export type { RuntimePlayingSound, RuntimeMusicState } from './runtime-audio-element.js';

export interface PlaySoundOptions {
  volume?: number;
  loop?: boolean;
}

export interface PlayMusicOptions {
  volume?: number;
  loop?: boolean;
}

export class RuntimeAudioLayer {
  private readonly sounds = new Map<string, RuntimePlayingSound>();
  private music: RuntimeMusicState = createDefaultMusicState();
  private masterVolume = 1;
  private soundCounter = 0;
  private layerDisposed = false;

  constructor(
    private readonly phaserScene: Phaser.Scene,
    private readonly isSceneDisposed: () => boolean
  ) {}

  getMasterVolume(): number {
    return this.masterVolume;
  }

  getMusicState(): Readonly<RuntimeMusicState> {
    return this.music;
  }

  private canPlay(): boolean {
    return !this.layerDisposed && !this.isSceneDisposed();
  }

  setMasterVolume(volume: number): void {
    if (this.layerDisposed) return;
    this.masterVolume = clampVolume(volume);

    for (const sound of this.sounds.values()) {
      if (!sound.destroyed && sound.playing) {
        setPhaserSoundVolume(sound.phaserSound, sound.volume * this.masterVolume);
      }
    }

    if (this.music.playing && this.music.phaserSound) {
      setPhaserSoundVolume(this.music.phaserSound, this.music.volume * this.masterVolume);
    }
  }

  playSound(assetId: string, options?: PlaySoundOptions): string | null {
    if (!this.canPlay() || !assetId) return null;
    if (!isAudioAssetLoaded(this.phaserScene, assetId)) {
      console.warn(`[RuntimeAudio] Missing audio asset '${assetId}'`);
      return null;
    }

    const volume = clampVolume(options?.volume ?? 1);
    const loop = options?.loop ?? false;
    const effective = volume * this.masterVolume;

    try {
      const phaserSound = playPhaserSound(this.phaserScene, assetId, effective, loop);
      if (!phaserSound) return null;

      const id = `sfx-${++this.soundCounter}`;
      const entry: RuntimePlayingSound = {
        id,
        assetId,
        volume,
        loop,
        playing: true,
        destroyed: false,
        phaserSound,
      };

      phaserSound.once('complete', () => {
        if (!loop) {
          entry.playing = false;
          entry.destroyed = true;
          this.sounds.delete(id);
        }
      });

      this.sounds.set(id, entry);
      return id;
    } catch (err) {
      console.warn(`[RuntimeAudio] playSound '${assetId}' failed:`, err);
      return null;
    }
  }

  stopSound(soundId: string): boolean {
    const entry = this.sounds.get(soundId);
    if (!entry) return false;
    if (entry.destroyed) return true;

    entry.playing = false;
    entry.destroyed = true;
    stopPhaserSound(entry.phaserSound);
    entry.phaserSound = null;
    this.sounds.delete(soundId);
    return true;
  }

  stopAll(): void {
    for (const id of [...this.sounds.keys()]) {
      this.stopSound(id);
    }
  }

  playMusic(assetId: string, options?: PlayMusicOptions): boolean {
    if (!this.canPlay() || !assetId) return false;
    this.stopMusic();

    if (!isAudioAssetLoaded(this.phaserScene, assetId)) {
      console.warn(`[RuntimeAudio] Missing music asset '${assetId}'`);
      return false;
    }

    const volume = clampVolume(options?.volume ?? 0.5);
    const loop = options?.loop ?? true;
    const effective = volume * this.masterVolume;

    try {
      const phaserSound = playPhaserSound(this.phaserScene, assetId, effective, loop);
      if (!phaserSound) return false;

      this.music = {
        assetId,
        volume,
        loop,
        playing: true,
        destroyed: false,
        phaserSound,
      };
      return true;
    } catch (err) {
      console.warn(`[RuntimeAudio] playMusic '${assetId}' failed:`, err);
      return false;
    }
  }

  stopMusic(): void {
    if (this.music.phaserSound) {
      stopPhaserSound(this.music.phaserSound);
    }
    this.music = createDefaultMusicState();
  }

  /** Stop all SFX and music; safe to call multiple times. */
  dispose(): void {
    if (this.layerDisposed) return;
    this.layerDisposed = true;
    this.stopAll();
    this.stopMusic();
  }

  /** Sync playing flags (optional housekeeping). */
  tick(): void {
    if (this.layerDisposed) return;
    for (const [id, sound] of this.sounds) {
      if (sound.destroyed) continue;
      if (!isPhaserSoundPlaying(sound.phaserSound)) {
        if (!sound.loop) {
          sound.playing = false;
          sound.destroyed = true;
          this.sounds.delete(id);
        }
      }
    }
    if (this.music.playing && this.music.phaserSound && !isPhaserSoundPlaying(this.music.phaserSound)) {
      this.music.playing = false;
    }
  }
}
