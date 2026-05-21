/**
 * Phaser Asset Preloader
 * Bridges RuntimeScene asset descriptors to Phaser's LoaderPlugin.
 * @module apps/runtime/phaser-adapter
 */

import type Phaser from 'phaser';
import type { RuntimeScene, RuntimeAssetDescriptor } from '@vgz/engine-runtime';

/**
 * Structured error for an asset that failed to preload
 */
export interface RuntimeAssetLoadError {
  readonly assetId: string;
  readonly assetPath: string;
  readonly reason: string;
}

/**
 * Result of the preload operation
 */
export interface PreloadResult {
  readonly loaded: string[];
  readonly skipped: string[];
  readonly failed: RuntimeAssetLoadError[];
}

const IMAGE_ASSET_TYPES = new Set(['sprite', 'image', 'tileset']);
const AUDIO_ASSET_TYPES = new Set(['audio']);

/**
 * Collect image and audio assets from a RuntimeScene.
 */
export function collectSceneAssets(runtimeScene: RuntimeScene): {
  images: RuntimeAssetDescriptor[];
  audio: RuntimeAssetDescriptor[];
  skipped: string[];
} {
  const images: RuntimeAssetDescriptor[] = [];
  const audio: RuntimeAssetDescriptor[] = [];
  const skipped: string[] = [];

  for (const asset of runtimeScene.assets.values()) {
    if (IMAGE_ASSET_TYPES.has(asset.type)) {
      images.push(asset);
    } else if (AUDIO_ASSET_TYPES.has(asset.type)) {
      audio.push(asset);
    } else {
      skipped.push(asset.id);
      console.debug(`[PhaserAdapter] Skipped unsupported asset type: ${asset.type} for id: ${asset.id}`);
    }
  }

  return { images, audio, skipped };
}

async function preloadImages(
  phaserScene: Phaser.Scene,
  images: RuntimeAssetDescriptor[],
  skipped: string[],
  loaded: string[],
  failed: RuntimeAssetLoadError[]
): Promise<void> {
  let assetsToLoad = 0;

  for (const asset of images) {
    if (phaserScene.textures.exists(asset.id)) {
      console.debug(`[PhaserAdapter] Texture already loaded: ${asset.id}`);
      skipped.push(asset.id);
      continue;
    }
    phaserScene.load.image(asset.id, asset.path);
    assetsToLoad++;
  }

  if (assetsToLoad === 0) return;

  await new Promise<void>((resolve) => {
    const fileErrorListener = (file: Phaser.Loader.File) => {
      console.warn(`[PhaserAdapter] Failed to load image: ${file.key} at ${file.url}`);
      failed.push({
        assetId: file.key,
        assetPath: typeof file.url === 'string' ? file.url : 'unknown',
        reason: 'HTTP Error or Invalid File',
      });
    };

    const completeListener = () => {
      phaserScene.load.off('loaderror', fileErrorListener);
      phaserScene.load.off('complete', completeListener);

      for (const asset of images) {
        if (skipped.includes(asset.id) || failed.some((f) => f.assetId === asset.id)) continue;
        if (phaserScene.textures.exists(asset.id) && phaserScene.textures.get(asset.id).key !== '__MISSING') {
          loaded.push(asset.id);
        } else {
          failed.push({
            assetId: asset.id,
            assetPath: asset.path,
            reason: 'Texture invalid or missing',
          });
        }
      }
      resolve();
    };

    phaserScene.load.on('loaderror', fileErrorListener);
    phaserScene.load.once('complete', completeListener);
    phaserScene.load.start();
  });
}

async function preloadAudio(
  phaserScene: Phaser.Scene,
  audio: RuntimeAssetDescriptor[],
  skipped: string[],
  loaded: string[],
  failed: RuntimeAssetLoadError[]
): Promise<void> {
  let assetsToLoad = 0;

  for (const asset of audio) {
    if (phaserScene.cache.audio.exists(asset.id)) {
      console.debug(`[PhaserAdapter] Audio already loaded: ${asset.id}`);
      skipped.push(asset.id);
      continue;
    }
    phaserScene.load.audio(asset.id, asset.path);
    assetsToLoad++;
  }

  if (assetsToLoad === 0) return;

  await new Promise<void>((resolve) => {
    const fileErrorListener = (file: Phaser.Loader.File) => {
      console.warn(`[PhaserAdapter] Failed to load audio: ${file.key} at ${file.url}`);
      failed.push({
        assetId: file.key,
        assetPath: typeof file.url === 'string' ? file.url : 'unknown',
        reason: 'HTTP Error or Invalid Audio File',
      });
    };

    const completeListener = () => {
      phaserScene.load.off('loaderror', fileErrorListener);
      phaserScene.load.off('complete', completeListener);

      for (const asset of audio) {
        if (skipped.includes(asset.id) || failed.some((f) => f.assetId === asset.id)) continue;
        if (phaserScene.cache.audio.exists(asset.id)) {
          console.debug(`[PhaserAdapter] Loaded audio: ${asset.id}`);
          loaded.push(asset.id);
        } else {
          failed.push({
            assetId: asset.id,
            assetPath: asset.path,
            reason: 'Audio invalid or missing',
          });
        }
      }
      resolve();
    };

    phaserScene.load.on('loaderror', fileErrorListener);
    phaserScene.load.once('complete', completeListener);
    phaserScene.load.start();
  });
}

/**
 * Preloads image and audio assets into a Phaser Scene.
 */
export async function preloadRuntimeSceneAssets(
  phaserScene: Phaser.Scene,
  runtimeScene: RuntimeScene
): Promise<PreloadResult> {
  const { images, audio, skipped } = collectSceneAssets(runtimeScene);
  const loaded: string[] = [];
  const failed: RuntimeAssetLoadError[] = [];
  const skippedAll = [...skipped];

  try {
    await preloadImages(phaserScene, images, skippedAll, loaded, failed);
  } catch (err) {
    console.warn('[PhaserAdapter] Image preload error (non-fatal):', err);
  }

  try {
    await preloadAudio(phaserScene, audio, skippedAll, loaded, failed);
  } catch (err) {
    console.warn('[PhaserAdapter] Audio preload error (non-fatal):', err);
  }

  return { loaded, skipped: skippedAll, failed };
}
