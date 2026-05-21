# Scene Schema Architecture - Minimal Scalable Design

**Date**: May 21, 2026  
**Status**: Design Phase  
**Target**: TypeScript + JSON Serialization  

---

## A. ARCHITECTURE EXPLANATION

### Core Principle: Asset-Oriented Data Model

The scene schema separates **data** (what exists) from **behavior** (what it does).

```
Scene = {
  metadata: {id, name, version}
  layers: LayerStack          # Rendering/spatial organization
  entities: EntityRegistry     # Game objects (will support ECS later)
  references: AssetRegistry    # Links to external resources
  editorMeta: EditorMetadata  # Undo/redo, selection, UI state (editor-only)
}
```

### Key Design Decisions

| Decision | Reasoning | Future Benefit |
|----------|-----------|----------------|
| **Layer Stack** | Explicit z-ordering for rendering | Easy to add shadow/light layers later |
| **Entity Registry** | Separate from layers, referenced by ID | Supports entity instantiation (prefabs) |
| **Asset References** | Central registry of external resources | Asset manager only needs to walk one place |
| **EditorMeta Separation** | Gameplay code ignores this field | Undo/redo, collaboration, UI state isolated |
| **Version Field** | Schema versioning at every level | Schema migration strategy |
| **Transform Separate** | position, rotation, scale as first-class | Physics/animation systems can plug in |

### Why This Works

✅ **Minimal**: Only essential data in core schema  
✅ **Serializable**: Pure JSON, no circular refs  
✅ **ECS-Ready**: Entities are containers for future components  
✅ **Undo/Redo-Ready**: EditorMeta tracks changes separately  
✅ **Multiplayer-Ready**: Entities can be diff'd and synced  
✅ **Prefab-Ready**: Entities can be nested/templated later  

---

## B. RECOMMENDED FOLDER STRUCTURE

### Packages Structure

```
packages/
├── scene-types/                    # ← NEW: Scene schema definitions
│   ├── src/
│   │   ├── index.ts
│   │   ├── scene.ts               # VGZScene root type
│   │   ├── layer.ts               # Layer types
│   │   ├── entity.ts              # Entity types
│   │   ├── transform.ts           # Position/rotation/scale
│   │   ├── reference.ts           # Asset reference types
│   │   └── editorMeta.ts          # Editor-only metadata
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── scene-validators/              # ← NEW: Schema validation
│   ├── src/
│   │   ├── index.ts
│   │   ├── validate-scene.ts
│   │   ├── validate-layer.ts
│   │   ├── validate-entity.ts
│   │   └── migration.ts           # Schema version migration
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
└── scene-utils/                   # ← NEW: Helper utilities
    ├── src/
    │   ├── index.ts
    │   ├── scene-builder.ts       # Fluent API for scene creation
    │   ├── query.ts               # Entity/layer querying
    │   └── diff.ts                # Scene diffing for sync/undo
    ├── package.json
    ├── tsconfig.json
    └── README.md
```

### Apps Structure

```
apps/
├── runtime/
│   └── src/
│       └── loaders/
│           └── sceneRenderer.ts   # Convert scene JSON → Phaser scene
│
└── editor/
    └── src/
        ├── components/
        │   ├── SceneEditor.tsx    # Scene view + controls
        │   ├── LayerPanel.tsx     # Layer list/visibility
        │   ├── EntityInspector.tsx # Entity properties
        │   └── AssetBrowser.tsx   # Asset reference picker
        │
        └── store/
            ├── sceneStore.ts      # Zustand: scene state
            ├── editorState.ts     # Zustand: undo/redo/selection
            └── undoRedo.ts        # Undo/redo manager
```

---

## C. TYPE DEFINITIONS

### Minimal Core Schema

```typescript
// packages/scene-types/src/index.ts

import type { VGZMap } from '@vgz/shared-types';

/**
 * Canonical scene schema
 * - Separates data (entities, layers) from behavior (gameplay logic)
 * - Ready for ECS, prefabs, multiplayer, undo/redo
 * - Version 1.0 (schema migration path established)
 */
export interface VGZSceneSchema {
  /** Scene identifier */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Rendering canvas dimensions (pixels) */
  viewport: {
    width: number;
    height: number;
  };
  
  /** Scene layers (ordered bottom-to-top) */
  layers: VGZSceneLayer[];
  
  /** All entities in scene (referenced by layer) */
  entities: Record<string, VGZSceneEntity>;
  
  /** Asset references (tilesets, sprites, audio) */
  assets: VGZAssetReference[];
  
  /** Editor-only state (not loaded by runtime) */
  editorMeta?: VGZSceneEditorMeta;
  
  /** Schema version (for migrations) */
  version: 1;
  
  /** ISO timestamp */
  updatedAt: string;
}

/**
 * Layer: Rendering units with z-ordering
 * - Can contain entities OR tile data
 * - Supports future: shadow layers, light layers, particle layers
 */
export interface VGZSceneLayer {
  /** Layer unique identifier */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Layer type */
  type: 'tilemap' | 'entity' | 'particle' | 'light' | 'shadow';
  
  /** Z-order (0 = bottom, higher = front) */
  zIndex: number;
  
  /** Is layer visible in editor/runtime */
  visible: boolean;
  
  /** Is layer locked in editor */
  locked: boolean;
  
  /** Layer opacity (0-1) */
  opacity: number;
  
  /** Entity layer: list of entity IDs (in this layer) */
  entityIds?: string[];
  
  /** Tilemap layer: tile data (if type=tilemap) */
  tileData?: VGZSceneLayerTileData;
  
  /** Schema version */
  version: 1;
}

/**
 * Tilemap data for a layer
 * - Supports multiple tilesets
 * - Pure indices (no rendering info)
 */
export interface VGZSceneLayerTileData {
  /** Tile grid dimensions */
  width: number;
  height: number;
  
  /** Tile size (pixels) */
  tileSize: number;
  
  /** Flat array of tile indices [0, 0, 1, 2, 0, ...] */
  tiles: number[];
  
  /** Tileset references used in this layer */
  tilesetIds: string[];
  
  /** Schema version */
  version: 1;
}

/**
 * Entity: A game object in the scene
 * - Minimal data: transform + type + metadata
 * - Ready for component system: can add properties[] later
 */
export interface VGZSceneEntity {
  /** Entity unique identifier */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Entity type (semantic for editor grouping) */
  type: 'actor' | 'prop' | 'trigger' | 'decoration';
  
  /** Position in world space */
  position: {
    x: number;
    y: number;
  };
  
  /** Rotation in degrees (0-360) */
  rotation: number;
  
  /** Scale factor (1.0 = normal) */
  scale: {
    x: number;
    y: number;
  };
  
  /** Is entity visible */
  visible: boolean;
  
  /** Sprite/asset reference ID */
  assetId?: string;
  
  /** Custom properties (key-value store for gameplay) */
  properties?: Record<string, any>;
  
  /** Schema version */
  version: 1;
}

/**
 * Asset: Reference to external resource
 * - Tells asset manager what to load
 * - Single source of truth for all resources
 */
export interface VGZAssetReference {
  /** Asset unique identifier */
  id: string;
  
  /** Asset type */
  type: 'tileset' | 'sprite' | 'animation' | 'audio' | 'font';
  
  /** Path to asset file (relative or absolute) */
  path: string;
  
  /** Metadata for asset (type-specific) */
  metadata?: {
    width?: number;
    height?: number;
    frameCount?: number;
    duration?: number;
    [key: string]: any;
  };
  
  /** Schema version */
  version: 1;
}

/**
 * Editor metadata: UI state, undo/redo info, collaboration data
 * - NOT loaded by runtime
 * - Preserved only in editor
 * - Separate from gameplay data
 */
export interface VGZSceneEditorMeta {
  /** Selected entity IDs */
  selectedEntityIds: string[];
  
  /** Selected layer IDs */
  selectedLayerIds: string[];
  
  /** Camera position in editor */
  cameraPosition: {
    x: number;
    y: number;
    zoom: number;
  };
  
  /** Undo/redo history */
  history?: {
    past: VGZSceneChange[];
    future: VGZSceneChange[];
  };
  
  /** Collaboration: who last modified what */
  lastModified?: {
    userId: string;
    entityId?: string;
    timestamp: string;
  }[];
  
  /** Custom editor state (extensible) */
  customState?: Record<string, any>;
  
  /** Schema version */
  version: 1;
}

/**
 * Change: Represents a single undo/redo change
 * - For undo/redo implementation
 * - For multiplayer sync
 */
export interface VGZSceneChange {
  /** Change identifier */
  id: string;
  
  /** Change type */
  type: 'create' | 'update' | 'delete' | 'reorder';
  
  /** What changed (entity ID, layer ID, etc) */
  target: string;
  
  /** Data before change */
  before: any;
  
  /** Data after change */
  after: any;
  
  /** When it happened */
  timestamp: string;
  
  /** Who made the change */
  userId?: string;
}
```

### Integration with Existing Types

```typescript
// Scene in VGZMap context

export interface VGZMapWithScene extends VGZMap {
  /** Reference to scene schema if using new architecture */
  sceneSchemaId?: string;
  
  /** Backward compatible: old entity format */
  entities: VGZEntity[];
  
  /** New: scene schema (optional, migration period) */
  sceneSchema?: VGZSceneSchema;
}
```

---

## D. SERIALIZATION FLOW

### Runtime: JSON → Phaser Scene

```
┌─────────────────────────────────────────────────────┐
│  1. Load VGZSceneSchema from JSON                    │
├─────────────────────────────────────────────────────┤
│  2. Validate schema (check version, required fields)│
├─────────────────────────────────────────────────────┤
│  3. Load/resolve asset references                   │
│     - For each asset in assets[]                    │
│     - Fetch actual files                            │
│     - Register with asset manager                   │
├─────────────────────────────────────────────────────┤
│  4. Iterate layers (in z-order)                      │
│     - For tilemap layers: create Phaser tilemap     │
│     - For entity layers: iterate entityIds[]        │
├─────────────────────────────────────────────────────┤
│  5. For each entity in layer                        │
│     - Look up in entities{}                         │
│     - Create Phaser sprite/game object              │
│     - Apply transform (position, rotation, scale)   │
│     - Attach custom properties                      │
├─────────────────────────────────────────────────────┤
│  6. Phaser Scene ready (with all objects placed)    │
└─────────────────────────────────────────────────────┘
```

### Editor: Phaser Scene → JSON

```
┌─────────────────────────────────────────────────────┐
│  1. User edits in editor                            │
├─────────────────────────────────────────────────────┤
│  2. Change recorded to editorMeta.history.past      │
├─────────────────────────────────────────────────────┤
│  3. Entities/layers updated in memory               │
├─────────────────────────────────────────────────────┤
│  4. Serialize to VGZSceneSchema JSON                │
├─────────────────────────────────────────────────────┤
│  5. Validate schema before save                     │
├─────────────────────────────────────────────────────┤
│  6. Write to projects/{id}/scenes/{sceneId}.json    │
├─────────────────────────────────────────────────────┤
│  7. Strip editorMeta before runtime export          │
└─────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
Editor (React + Zustand)
    ↓
SceneStore (in-memory VGZSceneSchema + EditorMeta)
    ↓
Serialize + Validate
    ↓
JSON File (projects/.../scenes/scene-name.json)
    ↓
Runtime Loader
    ↓
Deserialize + Validate
    ↓
Asset Resolution
    ↓
Phaser Scene Creation
    ↓
Game Running
```

---

## E. FUTURE EXTENSION STRATEGY

### Phase 2: Component System (Minimal ECS)

```typescript
// Future: Extend VGZSceneEntity with components

export interface VGZSceneEntityWithComponents extends VGZSceneEntity {
  components: {
    collider?: {
      type: 'box' | 'circle';
      size: { width: number; height: number };
    };
    animator?: {
      animationId: string;
      speed: number;
    };
    audio?: {
      soundId: string;
      loop: boolean;
    };
    // More components...
  };
}
```

**Impact**: Add `components` field to VGZSceneEntity → bump version to 2  
**Backward Compat**: Version 1 entities have empty/undefined components

---

### Phase 3: Prefabs

```typescript
// Prefabs = reusable entity templates

export interface VGZPrefab {
  id: string;
  name: string;
  baseEntity: VGZSceneEntity;  // Template
  overrides?: Record<string, any>; // Customizations
  version: 1;
}

// In scene:
export interface VGZSceneEntity {
  // ... existing fields ...
  prefabId?: string;           // If instantiated from prefab
  prefabOverrides?: Record<string, any>;
}
```

**Impact**: Entities reference prefabs, reduce duplication  
**Storage**: Prefabs live in `projects/{id}/prefabs/`

---

### Phase 4: Multiplayer/Sync

```typescript
// Track changes for sync

export interface VGZSceneWithSync extends VGZSceneSchema {
  // Track which entities/layers changed
  pendingChanges?: VGZSceneChange[];
  
  // Last synced version
  syncVersion?: number;
  
  // Conflict resolution info
  conflicts?: {
    entityId: string;
    localVersion: number;
    remoteVersion: number;
  }[];
}
```

**Impact**: Add sync metadata to scene  
**Storage**: Changes replicated to other clients

---

### Phase 5: Undo/Redo

```typescript
// Implemented in editor, reads from editorMeta

class UndoRedoManager {
  undo(scene: VGZSceneSchema): VGZSceneSchema {
    const change = scene.editorMeta?.history?.past.pop();
    if (change) {
      // Apply reverse of change
      // Move current to future
    }
    return updatedScene;
  }
}
```

**Impact**: EditorMeta.history already prepared  
**Storage**: Changes stored in-memory during session

---

### Phase 6: Visual Scripting (Future)

```typescript
// Add event/action system to entities

export interface VGZSceneEntity {
  // ... existing fields ...
  behaviors?: {
    triggers: {
      event: 'on-collision' | 'on-interact' | 'on-timer';
      actions: {
        type: 'play-animation' | 'move' | 'emit-event';
        params: Record<string, any>;
      }[];
    }[];
  };
}
```

**Impact**: Add behaviors field to entity  
**Not Implemented Yet**: Schema ready, implementation deferred

---

## F. MINIMAL IMPLEMENTATION CHECKLIST

### Phase 1: Schema Definition (Week 1)

- [ ] Create `packages/scene-types/`
- [ ] Define `VGZSceneSchema` interface
- [ ] Define `VGZSceneLayer` interface
- [ ] Define `VGZSceneEntity` interface
- [ ] Define `VGZAssetReference` interface
- [ ] Define `VGZSceneEditorMeta` interface (stub)
- [ ] Export all types from index.ts
- [ ] Write README with schema overview
- [ ] Create example scene JSON
- [ ] TypeScript compilation: ✅

### Phase 2: Validation (Week 1-2)

- [ ] Create `packages/scene-validators/`
- [ ] Implement `validateScene()`
- [ ] Implement `validateLayer()`
- [ ] Implement `validateEntity()`
- [ ] Implement `validateAssetReference()`
- [ ] Add version check
- [ ] Add error reporting
- [ ] Unit tests: ✅
- [ ] Integration tests: ✅

### Phase 3: Utilities (Week 2)

- [ ] Create `packages/scene-utils/`
- [ ] Implement `SceneBuilder` (fluent API)
- [ ] Implement layer querying
- [ ] Implement entity querying
- [ ] Implement scene diffing (for sync prep)
- [ ] Unit tests: ✅

### Phase 4: Runtime Integration (Week 2-3)

- [ ] Create `sceneRenderer.ts` in runtime
- [ ] Parse VGZSceneSchema from JSON
- [ ] Validate schema
- [ ] Resolve asset references
- [ ] Create Phaser scene from schema
  - [ ] Create layers (z-order)
  - [ ] Create tilemap (if type=tilemap)
  - [ ] Create entities as sprites
  - [ ] Apply transforms
- [ ] Integration tests: ✅

### Phase 5: Editor Integration (Week 3-4)

- [ ] Create `apps/editor/src/store/sceneStore.ts` (Zustand)
- [ ] Create scene state management
- [ ] Create `SceneEditor.tsx` component
- [ ] Create `LayerPanel.tsx` component
- [ ] Create `EntityInspector.tsx` component
- [ ] Create `AssetBrowser.tsx` component
- [ ] Implement serialize → JSON
- [ ] Implement deserialize ← JSON
- [ ] Manual testing: ✅

### Phase 6: Export/Import (Week 4)

- [ ] Create file export (Scene → JSON file)
- [ ] Create file import (JSON file → Scene)
- [ ] Implement save to projects/
- [ ] Implement load from projects/
- [ ] Version validation on load
- [ ] Error handling: ✅

### Phase 7: Documentation (Week 4)

- [ ] Document schema architecture (this file)
- [ ] Document type definitions
- [ ] Document serialization flow
- [ ] Document future extension points
- [ ] Create developer guide
- [ ] Create migration guide (for prefabs, etc)

---

## G. EXAMPLE: MINIMAL SCENE JSON

```json
{
  "id": "scene-village",
  "name": "Village Square",
  "viewport": {
    "width": 1024,
    "height": 768
  },
  "version": 1,
  "updatedAt": "2026-05-21T10:00:00Z",
  
  "layers": [
    {
      "id": "layer-ground",
      "name": "Ground",
      "type": "tilemap",
      "zIndex": 0,
      "visible": true,
      "locked": false,
      "opacity": 1.0,
      "version": 1,
      "tileData": {
        "width": 32,
        "height": 24,
        "tileSize": 32,
        "tiles": [1, 1, 1, 1, 0, 0, 0, 1, ...768 more tiles...],
        "tilesetIds": ["tileset-grass"]
      }
    },
    {
      "id": "layer-objects",
      "name": "Objects",
      "type": "entity",
      "zIndex": 1,
      "visible": true,
      "locked": false,
      "opacity": 1.0,
      "version": 1,
      "entityIds": ["entity-tree-1", "entity-fountain"]
    }
  ],
  
  "entities": {
    "entity-tree-1": {
      "id": "entity-tree-1",
      "name": "Old Tree",
      "type": "decoration",
      "position": { "x": 256, "y": 128 },
      "rotation": 0,
      "scale": { "x": 1.0, "y": 1.0 },
      "visible": true,
      "assetId": "sprite-tree",
      "version": 1
    },
    "entity-fountain": {
      "id": "entity-fountain",
      "name": "Fountain",
      "type": "prop",
      "position": { "x": 512, "y": 384 },
      "rotation": 0,
      "scale": { "x": 1.0, "y": 1.0 },
      "visible": true,
      "assetId": "sprite-fountain",
      "properties": {
        "interactive": true,
        "dialogKey": "fountain-greeting"
      },
      "version": 1
    }
  },
  
  "assets": [
    {
      "id": "tileset-grass",
      "type": "tileset",
      "path": "projects/village/assets/tilesets/grass",
      "metadata": {
        "width": 32,
        "height": 32,
        "columns": 16
      },
      "version": 1
    },
    {
      "id": "sprite-tree",
      "type": "sprite",
      "path": "projects/village/assets/sprites/tree",
      "metadata": {
        "width": 64,
        "height": 96
      },
      "version": 1
    },
    {
      "id": "sprite-fountain",
      "type": "sprite",
      "path": "projects/village/assets/sprites/fountain",
      "metadata": {
        "width": 48,
        "height": 48
      },
      "version": 1
    }
  ]
}
```

---

## H. RATIONALE: WHY THIS DESIGN

### ✅ Minimal
- Only essential data in core schema
- No gameplay logic encoded
- No renderer-specific data
- Pure data model

### ✅ Scalable
- Layers support 100s of entities efficiently
- Asset registry prevents duplication
- Entity IDs enable referencing
- Version fields enable migrations

### ✅ ECS-Ready
- Entities are lightweight containers
- Future component system: add to entity
- Properties bag: extensible without schema change
- Type field: support future entity variants

### ✅ Undo/Redo-Ready
- EditorMeta separated from gameplay data
- History already in schema
- Changes tracked per entity/layer
- No need to store full scene history

### ✅ Multiplayer-Ready
- EditorMeta has sync tracking
- Changes are granular (per entity)
- Conflicts detectable
- Diff-friendly structure

### ✅ Prefab-Ready
- Entities reference templates
- Overrides supported
- Reuse enabled
- Storage clear (prefabs/ directory)

### ✅ Serializable
- Pure JSON (no circular refs)
- TypeScript types match JSON structure
- Validator ensures correctness
- Version tracking supports migration

---

## I. COMPARISON: OLD vs NEW

| Aspect | Old (Current) | New (Proposed) |
|--------|--------------|----------------|
| Entity Storage | In VGZMap.entities[] | In VGZSceneSchema.entities{} |
| Layer System | Single flat list | Ordered layer stack |
| Z-Ordering | Implicit (array order) | Explicit zIndex field |
| Asset Management | No central registry | Central assets[] registry |
| Editor State | Not specified | EditorMeta field |
| Undo/Redo | Not supported | History prepared in editorMeta |
| Components | Not supported | Future: components field |
| Serialization | Inline in VGZMap | Separate scene files |
| Version Tracking | At map level | At every level |
| Extensibility | Limited | Multiple extension points |

---

## J. NEXT STEPS

1. **Review Design**: Get feedback on schema structure
2. **Create Packages**: Implement scene-types, scene-validators, scene-utils
3. **Update Demo Project**: Create scene-schema compliant example
4. **Runtime Integration**: Build sceneRenderer.ts
5. **Editor Integration**: Build scene editor UI
6. **Documentation**: Create developer guide

---

**Readiness**: 🟡 DESIGN PHASE → Ready for implementation review

**Questions**: 
- Should we migrate existing VGZMap scenes to VGZSceneSchema?
- How many layers do we expect per scene?
- What custom properties will gameplay systems need on entities?
