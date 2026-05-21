/**
 * Phaser Tilemap Renderer
 * Static orthogonal tilemap layers from RuntimeScene tileData only.
 * @module apps/runtime/phaser-adapter
 */

import type Phaser from 'phaser';
import type { RuntimeLayerDescriptor, RuntimeAssetDescriptor } from '@vgz/engine-runtime';

export interface TilemapRenderResult {
  readonly tilemap: Phaser.Tilemaps.Tilemap;
  readonly tilemapLayer: Phaser.Tilemaps.TilemapLayer;
}

export interface TilemapRenderOptions {
  readonly layer: RuntimeLayerDescriptor;
  readonly tilesetAsset: RuntimeAssetDescriptor | undefined;
  readonly depth: number;
}

function readNumber(meta: Readonly<Record<string, unknown>>, key: string, fallback: number): number {
  const value = meta[key];
  return typeof value === 'number' && value > 0 ? value : fallback;
}

/** 0 = empty; positive ids map to Phaser tile index (id - 1). */
function tileIdToPhaserIndex(tileId: number): number {
  if (!Number.isFinite(tileId) || tileId <= 0) return -1;
  return Math.floor(tileId) - 1;
}

/**
 * Ensures a tileset texture exists under asset.id (preload key).
 * Creates a small canvas fallback when missing so runtime never crashes.
 */
function ensureTilesetTexture(
  scene: Phaser.Scene,
  assetId: string,
  tileWidth: number,
  tileHeight: number,
  columns: number
): boolean {
  if (
    scene.textures.exists(assetId) &&
    scene.textures.get(assetId).key !== '__MISSING'
  ) {
    return true;
  }

  const cols = Math.max(1, columns);
  const rows = 4;
  const width = cols * tileWidth;
  const height = rows * tileHeight;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.warn(`[PhaserTilemap] Could not create fallback texture for '${assetId}'`);
    return false;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const index = r * cols + c;
      const x = c * tileWidth;
      const y = r * tileHeight;
      if (index === 0) {
        ctx.fillStyle = '#1e1e1e';
      } else if (index === 1) {
        ctx.fillStyle = '#4caf50';
      } else if (index === 2) {
        ctx.fillStyle = '#2196f3';
      } else {
        ctx.fillStyle = `hsl(${(index * 37) % 360}, 55%, 42%)`;
      }
      ctx.fillRect(x, y, tileWidth, tileHeight);
      ctx.strokeStyle = '#333';
      ctx.strokeRect(x, y, tileWidth, tileHeight);
    }
  }

  if (scene.textures.exists(assetId)) {
    scene.textures.remove(assetId);
  }
  scene.textures.addCanvas(assetId, canvas);
  console.warn(`[PhaserTilemap] Using fallback tileset texture for '${assetId}'`);
  return true;
}

/**
 * Renders one static orthogonal tilemap layer. Failures are isolated (returns null).
 */
export function renderStaticTilemapLayer(
  scene: Phaser.Scene,
  options: TilemapRenderOptions
): TilemapRenderResult | null {
  const { layer, tilesetAsset, depth } = options;
  const tileData = layer.tileData;

  if (!tileData) {
    console.warn(`[PhaserTilemap] Layer '${layer.id}' has no tileData`);
    return null;
  }

  const { width, height, tileSize, tiles } = tileData;
  if (width <= 0 || height <= 0 || tileSize <= 0) {
    console.warn(`[PhaserTilemap] Layer '${layer.id}' has invalid dimensions`);
    return null;
  }

  const tilesetId = tileData.tilesetIds[0];
  if (!tilesetId) {
    console.warn(`[PhaserTilemap] Layer '${layer.id}' has no tilesetIds`);
    return null;
  }
  if (tileData.tilesetIds.length > 1) {
    console.warn(
      `[PhaserTilemap] Layer '${layer.id}' has multiple tilesets; only the first is supported`
    );
  }

  const meta = tilesetAsset?.metadata ?? {};
  const tileWidth = readNumber(meta, 'tileWidth', tileSize);
  const tileHeight = readNumber(meta, 'tileHeight', tileSize);
  const columns = readNumber(meta, 'columns', 8);
  const textureKey = tilesetAsset?.id ?? tilesetId;

  if (!ensureTilesetTexture(scene, textureKey, tileWidth, tileHeight, columns)) {
    return null;
  }

  try {
    const tilemap = scene.make.tilemap({
      tileWidth,
      tileHeight,
      width,
      height,
    });

    const phaserTileset = tilemap.addTilesetImage(
      textureKey,
      textureKey,
      tileWidth,
      tileHeight,
      0,
      0
    );

    if (!phaserTileset) {
      console.warn(`[PhaserTilemap] Could not bind tileset '${textureKey}' for layer '${layer.id}'`);
      tilemap.destroy();
      return null;
    }

    const tilemapLayer = tilemap.createLayer(layer.id, phaserTileset, 0, 0);
    if (!tilemapLayer) {
      console.warn(`[PhaserTilemap] Could not create layer '${layer.id}'`);
      tilemap.destroy();
      return null;
    }

    const expected = width * height;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        if (index >= tiles.length) continue;
        const phaserIndex = tileIdToPhaserIndex(tiles[index]);
        if (phaserIndex < 0) continue;
        tilemapLayer.putTileAt(phaserIndex, x, y);
      }
    }

    tilemapLayer.setDepth(depth);
    tilemapLayer.setVisible(layer.visible);
    tilemapLayer.setAlpha(layer.opacity);

    return { tilemap, tilemapLayer };
  } catch (err) {
    console.warn(`[PhaserTilemap] Failed to render layer '${layer.id}':`, err);
    return null;
  }
}
