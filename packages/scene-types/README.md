# @vgz/scene-types

Canonical scene schema type definitions for the VGZ game engine.

Pure TypeScript types for serializable JSON scene format. Implements the architecture defined in `SCENE_SCHEMA_ARCHITECTURE.md`.

## Features

✅ **Minimal & Focused**: Only essential data structures  
✅ **Serializable**: Pure JSON, no circular references  
✅ **Framework-Agnostic**: No Phaser/engine-specific code  
✅ **ECS-Ready**: Entities support future component system  
✅ **Editor-Ready**: Separate EditorMeta for UI state  
✅ **Undo/Redo-Ready**: History structure prepared  
✅ **Multiplayer-Ready**: Change tracking included  
✅ **Prefab-Ready**: Entity structure supports templates  

## Type Hierarchy

```
VGZSceneSchema (root)
├── VGZViewport
├── VGZSceneLayer[]
│   ├── VGZSceneLayerTileData (if type=tilemap)
│   └── entityIds[] (if type=entity)
├── VGZSceneEntity{} (indexed by id)
│   ├── VGZTransform
│   │   ├── VGZPosition
│   │   └── VGZScale
│   └── VGZComponentData (future)
├── VGZAssetReference[]
│   └── VGZAssetMetadata (optional)
└── VGZSceneEditorMeta? (editor-only)
    ├── VGZEditorCamera
    ├── VGZSceneHistory
    │   ├── VGZSceneChange[] (past)
    │   └── VGZSceneChange[] (future)
    └── VGZSceneCollaborationMeta[]
```

## Quick Start

### Import Types

```typescript
import type {
  VGZSceneSchema,
  VGZSceneLayer,
  VGZSceneEntity,
  VGZTransform,
  VGZAssetReference,
  VGZSceneEditorMeta,
} from '@vgz/scene-types';
```

### Create a Scene

```typescript
const scene: VGZSceneSchema = {
  id: 'scene-village',
  name: 'Village Square',
  viewport: {
    width: 1024,
    height: 768,
  },
  version: 1,
  updatedAt: new Date().toISOString(),
  layers: [
    {
      id: 'layer-ground',
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
        tiles: [...300 tiles...],
        tilesetIds: ['tileset-grass'],
      },
    },
  ],
  entities: {
    'entity-tree': {
      id: 'entity-tree',
      name: 'Old Tree',
      type: 'decoration',
      transform: {
        position: { x: 256, y: 128 },
        rotation: 0,
        scale: { x: 1.0, y: 1.0 },
      },
      visible: true,
      assetId: 'sprite-tree',
      version: 1,
    },
  },
  assets: [
    {
      id: 'tileset-grass',
      type: 'tileset',
      path: 'projects/village/assets/tilesets/grass',
      metadata: {
        width: 32,
        height: 32,
        columns: 16,
      },
      version: 1,
    },
  ],
};
```

### Serialize to JSON

```typescript
const json = JSON.stringify(scene, null, 2);
```

### Deserialize from JSON

```typescript
const scene: VGZSceneSchema = JSON.parse(json);
```

## Types Reference

### VGZSceneSchema

Root scene container.

**Fields**:
- `id: string` - Unique scene identifier
- `name: string` - Display name
- `viewport: VGZViewport` - Rendering canvas size
- `layers: VGZSceneLayer[]` - Ordered layer stack
- `entities: Record<string, VGZSceneEntity>` - All entities indexed by ID
- `assets: VGZAssetReference[]` - Central asset registry
- `editorMeta?: VGZSceneEditorMeta` - Editor-only state (stripped for runtime)
- `version: 1` - Schema version
- `updatedAt: string` - ISO timestamp

### VGZSceneLayer

Rendering unit with z-ordering.

**Fields**:
- `id: string` - Layer identifier
- `name: string` - Display name
- `type: 'tilemap' | 'entity' | 'particle' | 'light' | 'shadow'` - Layer type
- `zIndex: number` - Rendering order (0 = bottom)
- `visible: boolean` - Is visible
- `locked: boolean` - Is locked in editor
- `opacity: number` - Opacity (0-1)
- `entityIds?: string[]` - Entity layer: entity IDs (references into entities{})
- `tileData?: VGZSceneLayerTileData` - Tilemap layer: tile grid
- `version: 1` - Schema version

### VGZSceneEntity

Game object in scene.

**Fields**:
- `id: string` - Entity identifier
- `name: string` - Display name
- `type: 'actor' | 'prop' | 'trigger' | 'decoration'` - Entity type
- `transform: VGZTransform` - Position/rotation/scale
- `visible: boolean` - Is visible
- `assetId?: string` - Sprite reference
- `properties?: Record<string, any>` - Custom properties
- `components?: VGZComponentData` - Future: component data
- `version: 1` - Schema version

### VGZTransform

Position, rotation, and scale.

**Fields**:
- `position: VGZPosition` - {x, y} in pixels
- `rotation: number` - Degrees (0-360)
- `scale: VGZScale` - {x, y} scale factors

### VGZAssetReference

External resource reference.

**Fields**:
- `id: string` - Asset identifier
- `type: 'tileset' | 'sprite' | 'animation' | 'audio' | 'font' | 'particle'` - Asset type
- `path: string` - File path
- `metadata?: VGZAssetMetadata` - Type-specific metadata
- `version: 1` - Schema version

### VGZSceneEditorMeta

Editor-only metadata (NOT loaded by runtime).

**Fields**:
- `selectedEntityIds: string[]` - Selected entity IDs
- `selectedLayerIds: string[]` - Selected layer IDs
- `camera: VGZEditorCamera` - Camera position/zoom
- `history?: VGZSceneHistory` - Undo/redo history
- `lastModified?: VGZSceneCollaborationMeta[]` - Collaboration tracking
- `customState?: Record<string, any>` - Extensible
- `version: 1` - Schema version

## Design Principles

### 1. Separation of Concerns
- **Data**: Scene structure (layers, entities, assets)
- **UI State**: EditorMeta (not loaded by runtime)
- **Behavior**: Not encoded in schema (added by systems)

### 2. Pure JSON Serialization
- No circular references
- No functions or methods
- No Date objects (use ISO strings)
- Fully JSON.stringify/parse compatible

### 3. Version Strategy
- Every type has `version: 1`
- Enables schema migration
- Backward compatibility path

### 4. Extensibility Points
1. **Components**: Can add to VGZSceneEntity.components
2. **Properties**: Custom data via VGZSceneEntity.properties
3. **Custom Editor State**: VGZSceneEditorMeta.customState
4. **Asset Metadata**: VGZAssetMetadata[key]

## Future Extensions

### Phase 2: Component System
```typescript
entity.components = {
  collider: { type: 'box', size: {...} },
  animator: { animationId: 'walk', speed: 1.0 },
};
```

### Phase 3: Prefabs
```typescript
entity.prefabId = 'prefab-npc-merchant';
entity.prefabOverrides = { position: {...} };
```

### Phase 4: Behaviors (Visual Scripting)
```typescript
entity.behaviors = {
  triggers: [
    { event: 'on-collision', actions: [...] }
  ]
};
```

## No Runtime Logic

This package contains **only type definitions**. It does NOT include:
- ❌ Phaser integration
- ❌ Asset loading
- ❌ Scene rendering
- ❌ Validation logic
- ❌ Gameplay systems
- ❌ Animation
- ❌ Physics
- ❌ Serialization utilities

These are implemented in separate packages:
- `@vgz/scene-validators` - Validation
- Runtime app - Phaser rendering
- Gameplay systems - Entity behavior

## See Also

- `SCENE_SCHEMA_ARCHITECTURE.md` - Full architecture design
- `packages/scene-validators/` - Schema validation (future)
- `apps/runtime/` - Runtime integration (future)
- `apps/editor/` - Editor UI (future)

---

**Status**: ✅ Type definitions only (no logic)  
**Framework-Agnostic**: Yes (pure TypeScript)  
**Serializable**: Yes (pure JSON)  
**Ready for**: Editor + Runtime integration
