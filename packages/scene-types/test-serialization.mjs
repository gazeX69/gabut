/**
 * Test: Scene serialization/deserialization
 * Verifies that scene types are JSON serializable
 */

import type {
  VGZSceneSchema,
  VGZSceneLayer,
  VGZSceneEntity,
} from './dist/index.js';

// Create minimal valid scene
const scene: VGZSceneSchema = {
  id: 'test-scene',
  name: 'Test Scene',
  viewport: {
    width: 1024,
    height: 768,
  },
  version: 1,
  updatedAt: new Date().toISOString(),
  
  layers: [
    {
      id: 'layer-1',
      name: 'Ground',
      type: 'tilemap',
      zIndex: 0,
      visible: true,
      locked: false,
      opacity: 1.0,
      version: 1,
      tileData: {
        width: 32,
        height: 24,
        tileSize: 32,
        tiles: Array(768).fill(0),
        tilesetIds: ['tileset-1'],
      },
    } as VGZSceneLayer,
    {
      id: 'layer-2',
      name: 'Objects',
      type: 'entity',
      zIndex: 1,
      visible: true,
      locked: false,
      opacity: 1.0,
      version: 1,
      entityIds: ['entity-1'],
    } as VGZSceneLayer,
  ],
  
  entities: {
    'entity-1': {
      id: 'entity-1',
      name: 'Test Entity',
      type: 'prop',
      transform: {
        position: { x: 100, y: 200 },
        rotation: 45,
        scale: { x: 1.5, y: 1.5 },
      },
      visible: true,
      assetId: 'sprite-1',
      properties: {
        interactive: true,
        customValue: 42,
      },
      version: 1,
    } as VGZSceneEntity,
  },
  
  assets: [
    {
      id: 'tileset-1',
      type: 'tileset',
      path: 'assets/tileset.json',
      metadata: {
        width: 32,
        height: 32,
        columns: 16,
      },
      version: 1,
    },
    {
      id: 'sprite-1',
      type: 'sprite',
      path: 'assets/sprite.png',
      metadata: {
        width: 64,
        height: 64,
      },
      version: 1,
    },
  ],
  
  editorMeta: {
    selectedEntityIds: ['entity-1'],
    selectedLayerIds: ['layer-2'],
    camera: {
      x: 512,
      y: 384,
      zoom: 1.0,
    },
    version: 1,
  },
};

// Test 1: Serialize to JSON
console.log('Test 1: Serialize to JSON');
try {
  const json = JSON.stringify(scene, null, 2);
  console.log('✓ Serialization successful');
  console.log(`  Size: ${json.length} bytes`);
} catch (error) {
  console.error('✗ Serialization failed:', error);
  process.exit(1);
}

// Test 2: Parse from JSON
console.log('\nTest 2: Parse from JSON');
try {
  const json = JSON.stringify(scene);
  const parsed = JSON.parse(json) as VGZSceneSchema;
  console.log('✓ Parsing successful');
  console.log(`  Scene ID: ${parsed.id}`);
  console.log(`  Layers: ${parsed.layers.length}`);
  console.log(`  Entities: ${Object.keys(parsed.entities).length}`);
  console.log(`  Assets: ${parsed.assets.length}`);
} catch (error) {
  console.error('✗ Parsing failed:', error);
  process.exit(1);
}

// Test 3: Round-trip (serialize + parse)
console.log('\nTest 3: Round-trip test');
try {
  const json = JSON.stringify(scene);
  const roundtrip = JSON.parse(json) as VGZSceneSchema;
  
  // Verify structure integrity
  if (roundtrip.id !== scene.id) throw new Error('ID mismatch');
  if (roundtrip.layers.length !== scene.layers.length) throw new Error('Layer count mismatch');
  if (Object.keys(roundtrip.entities).length !== Object.keys(scene.entities).length) {
    throw new Error('Entity count mismatch');
  }
  if (roundtrip.assets.length !== scene.assets.length) throw new Error('Asset count mismatch');
  
  console.log('✓ Round-trip successful - all data preserved');
} catch (error) {
  console.error('✗ Round-trip failed:', error);
  process.exit(1);
}

// Test 4: Nested structure verification
console.log('\nTest 4: Nested structure verification');
try {
  const json = JSON.stringify(scene);
  const parsed = JSON.parse(json) as VGZSceneSchema;
  
  const entity = parsed.entities['entity-1'];
  if (!entity) throw new Error('Entity not found');
  if (entity.transform.position.x !== 100) throw new Error('Position mismatch');
  if (entity.properties?.customValue !== 42) throw new Error('Properties mismatch');
  if (!parsed.editorMeta) throw new Error('EditorMeta missing');
  if (parsed.editorMeta.camera.zoom !== 1.0) throw new Error('Camera zoom mismatch');
  
  console.log('✓ Nested structures verified');
  console.log(`  Entity position: (${entity.transform.position.x}, ${entity.transform.position.y})`);
  console.log(`  Entity scale: (${entity.transform.scale.x}, ${entity.transform.scale.y})`);
  console.log(`  Custom properties: ${JSON.stringify(entity.properties)}`);
} catch (error) {
  console.error('✗ Verification failed:', error);
  process.exit(1);
}

console.log('\n=== All Tests Passed ===');
console.log('✓ Types are JSON serializable');
console.log('✓ No circular references');
console.log('✓ Data integrity preserved');
