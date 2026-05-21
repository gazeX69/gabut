/**
 * Runtime audio element models (mutable, runtime-only, not serialized).
 * @module apps/runtime/audio
 */

/** Active one-shot or looping SFX instance. */
export interface RuntimePlayingSound {
  readonly id: string;
  readonly assetId: string;
  volume: number;
  loop: boolean;
  playing: boolean;
  destroyed: boolean;
  /** Internal Phaser sound — do not use outside phaser-audio-bridge */
  phaserSound: unknown;
}

/** Current background music track state. */
export interface RuntimeMusicState {
  assetId: string | null;
  volume: number;
  loop: boolean;
  playing: boolean;
  destroyed: boolean;
  /** Internal Phaser sound — do not use outside phaser-audio-bridge */
  phaserSound: unknown;
}

export function createDefaultMusicState(): RuntimeMusicState {
  return {
    assetId: null,
    volume: 0.5,
    loop: true,
    playing: false,
    destroyed: false,
    phaserSound: null,
  };
}
