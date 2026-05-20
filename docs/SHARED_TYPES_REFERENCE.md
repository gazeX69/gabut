# Shared Types Quick Reference

## Import All

```typescript
import type { 
  VGZProject, 
  VGZScene, 
  VGZMap, 
  VGZEntity 
} from '@vgz/shared-types'
```

## VGZProject - Root

```typescript
interface VGZProject {
  id: string                          // Unique project ID
  settings: VGZProjectSettings        // Game configuration
  scenes: VGZScene[]                  // All scenes
  startSceneId: string                // Entry scene ID
  version: number                     // Schema version
  updatedAt?: string                  // ISO 8601 timestamp
  editorMeta?: { ... }                // Editor-only state
}
```

**Used by**: Editor (project management), Runtime (scene loading), Save system  
**Consumers**: Editor UI, Runtime loader, Save/load systems

---

## VGZScene - Playable Scene

```typescript
interface VGZScene {
  id: string                          // Unique scene ID
  name: string                        // Display name
  map: VGZMap                         // Map data
  metadata?: {
    cameraMode?: 'fixed' | 'follow'
    cameraPosition?: { x, y }
  }
  version: number                     // Schema version
}
```

**Used by**: Editor (scene editing), Runtime (scene execution)  
**Consumer**: Scene loader

---

## VGZMap - Level Data

```typescript
interface VGZMap {
  id: string                          // Unique map ID
  name: string                        // Display name
  width: number                       // Tiles wide
  height: number                      // Tiles tall
  tilesets: VGZMapTileset[]           // Tileset references
  layers: VGZMapLayer[]               // Terrain/collision/decoration
  entities: VGZEntity[]               // NPCs, objects, triggers
  spawn?: { x, y }                    // Player spawn point
  backgroundColor?: string            // Hex color
  version: number                     // Schema version
}
```

**Used by**: Editor (map editing), Runtime (rendering), Pathfinding systems  
**Note**: Tiles are grid coordinates, not pixels

---

## VGZEntity - Game Object

```typescript
interface VGZEntity {
  id: string                          // Unique within scene
  name: string                        // Display name
  type: 'npc' | 'object' | 'trigger' | 'prop'
  position: { x, y }                  // Tile coordinates
  zOrder?: number                     // Render order
  rotation?: number                   // Degrees 0-360
  scale?: { x, y }                    // Default 1.0
  visible?: boolean                   // Default true
  editorMeta?: {
    locked?: boolean
    hidden?: boolean
    color?: string
  }
}
```

**Used by**: Editor (entity placement), Runtime (entity loading)  
**Note**: No behavior or gameplay logic here

---

## Minimal Valid VGZProject

```typescript
const project: VGZProject = {
  id: 'game-1',
  settings: {
    title: 'My Game',
    resolution: { width: 1024, height: 768 },
    tileSize: 32
  },
  scenes: [
    {
      id: 'start',
      name: 'Start Scene',
      map: {
        id: 'map-1',
        name: 'Starting Area',
        width: 20,
        height: 15,
        tilesets: [],
        layers: [],
        entities: [],
        version: 1
      },
      version: 1
    }
  ],
  startSceneId: 'start',
  version: 1
}
```

---

## Type Relationships

```
┌─────────────────────────────────────┐
│          VGZProject                 │
│  (game.vgz JSON file)               │
│  - id, settings, version            │
│  - scenes[]                         │
└──────────────────┬──────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │     VGZScene[]       │
        │  - id, name, map     │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │      VGZMap          │
        │  - width, height     │
        │  - layers[]          │
        │  - entities[]        │
        │  - tilesets[]        │
        └──────────┬───────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
    ┌────────────┐      ┌─────────────┐
    │ VGZEntity[]│      │ VGZMapLayer[]
    │ - NPC      │      │ - terrain   │
    │ - trigger  │      │ - collision │
    │ - object   │      │ - decoration
    └────────────┘      └─────────────┘
```

---

## What's NOT Here

❌ Gameplay logic  
❌ Behavior systems  
❌ Event systems  
❌ Save/load code  
❌ Phaser integration  
❌ ECS components  

These go in `@vgz/engine-core` and specific system packages.

---

## Extending Types

**DO**: Add optional fields with `?`
```typescript
// Safe extension
interface VGZEntity {
  // ... existing fields
  customColor?: string  // New optional field
}
```

**DON'T**: Remove required fields or change types
```typescript
// Breaking change - requires version bump + migration
interface VGZEntity {
  position: { x: number; y: number; z: number }  // Was 2D, now 3D!
}
```

**Always**: Increment version field when making breaking changes

---

## Schema Versions

Current: **1**

When incrementing:
1. Update type version
2. Document change
3. Add migration utility
4. Update this reference

Example future version:
```typescript
// Version 1 → 2: Added metadata
if (entity.version === 1) {
  entity.metadata = entity.metadata || {}
  entity.version = 2
}
```

---

## Files by Consumer

### Editor
- ✅ Import all types
- ✅ Create/modify VGZProject
- ✅ Use editorMeta for UI state
- ❌ Don't add gameplay logic

### Runtime
- ✅ Load VGZProject
- ✅ Consume VGZScene → VGZMap
- ✅ Iterate VGZEntity[]
- ❌ Don't modify project during play

### Save System
- ✅ Serialize/deserialize VGZProject
- ✅ Handle version migrations
- ✅ Validate against types
- ❌ Don't add new fields

---

## Compilation

```bash
# Build types
cd packages/shared-types
pnpm run build

# Output: dist/*.d.ts, dist/*.js, dist/*.js.map
```

---

## Questions?

See:
- `packages/shared-types/README.md` - Detailed documentation
- `docs/SHARED_TYPES_FOUNDATION.md` - Design decisions
- `docs/ai/ARCHITECTURE_MAP.md` - Where shared-types fits
- `docs/ai/BOUNDARY_RULES.md` - What's allowed/forbidden
