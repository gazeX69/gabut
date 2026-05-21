/**
 * Phaser Object Factory
 * Creates basic Phaser GameObjects from RuntimeEntityDescriptors.
 * @module apps/runtime/phaser-adapter
 */

import Phaser from 'phaser';
import type { RuntimeEntityDescriptor, RuntimeAssetDescriptor } from '@vgz/engine-runtime';

const TYPE_COLORS: Record<string, number> = {
  actor: 0xe53935, // red
  prop: 0xffb300,  // amber
  trigger: 0x00e676, // green
  decoration: 0x90a4ae // grey
};

/**
 * Creates a Phaser GameObject for the given entity descriptor.
 * Only supports sprites (if texture is loaded) or colored rectangle placeholders.
 */
export function createEntityObject(
  scene: Phaser.Scene,
  entity: RuntimeEntityDescriptor,
  asset?: RuntimeAssetDescriptor
): Phaser.GameObjects.GameObject {
  
  let mainObj: Phaser.GameObjects.GameObject;
  
  // Try to use a sprite if we have an asset ID and the texture exists in Phaser
  if (entity.assetId && scene.textures.exists(entity.assetId) && scene.textures.get(entity.assetId).key !== '__MISSING') {
    const sprite = scene.add.sprite(entity.transform.position.x, entity.transform.position.y, entity.assetId);
    sprite.setAngle(entity.transform.rotation);
    sprite.setScale(entity.transform.scale.x, entity.transform.scale.y);
    mainObj = sprite;
  } else {
    // Fallback to placeholder rectangle
    const color = TYPE_COLORS[entity.type] ?? 0xffffff;
    const size = 32;
    
    // Create a container to hold the rect + label
    const container = scene.add.container(entity.transform.position.x, entity.transform.position.y);
    container.setAngle(entity.transform.rotation);
    container.setScale(entity.transform.scale.x, entity.transform.scale.y);
    
    const rect = scene.add.rectangle(0, 0, size, size, color);
    
    const label = scene.add.text(0, -size/2 - 5, entity.name, {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#000000'
    }).setOrigin(0.5);
    
    container.add([rect, label]);
    mainObj = container;
  }

  (mainObj as any).setVisible(entity.visible);
  
  return mainObj;
}
