  # VGZ Project Filesystem Conventions

**Date**: May 20, 2026  
**Status**: Established  
**Version**: 1.0  

---

## Overview

VGZ projects are self-contained directories containing game data in JSON format and organized asset structures.

---

## Root Project Structure

```
projects/
├── demo-project/         # Example project
├── my-game-1/           # Production project
├── another-game/        # Another project
└── PROJECT_CONVENTIONS.md
```

Each project follows the same internal structure.

---

## Project Internal Structure

```
{projectId}/
├── project.json                          # Root VGZProject definition (required)
│
├── assets/
│   ├── tilesets/                        # Tileset definitions and metadata
│   │   ├── tileset-1.json              # Tileset definition
│   │   ├── tileset-2.json
│   │   └── [images will go here]        # Future: actual tileset images
│   │
│   ├── animations/                      # Animation definitions
│   │   ├── animation-1.json
│   │   └── [animation frames]           # Future: animation frame images
│   │
│   ├── audio/                           # Audio files and references
│   │   ├── music/
│   │   └── sfx/
│   │
│   └── sprites/                         # Character and object sprites
│       ├── npc-1.json                   # Sprite definition
│       └── [sprite images]              # Future: sprite images
│
├── scenes/                              # Scene definitions (optional, can be inline in project.json)
│   ├── scene-1.json                     # Optional: separate scene files
│   └── scene-2.json
│
├── maps/                                # Map definitions (optional, can be inline in scene)
│   ├── map-1.json                       # Optional: separate map files
│   └── map-2.json
│
├── dialogues/                           # Dialogue definitions (future)
│   ├── dialogue-1.json
│   └── dialogue-2.json
│
├── quests/                              # Quest definitions (future)
│   ├── quest-1.json
│   └── quest-2.json
│
├── saves/                               # Save game data
│   ├── save-1.json
│   ├── save-2.json
│   └── auto-save.json
│
├── README.md                            # Project documentation
└── .gitkeep                             # Placeholder for empty directories
```

---

## File Conventions

### project.json

**Purpose**: Root VGZProject definition (required)

**Format**: JSON matching `@vgz/shared-types` `VGZProject` interface

**Example**:
```json
{
  "id": "my-game",
  "settings": {
    "title": "My Game",
    "resolution": { "width": 1024, "height": 768 },
    "tileSize": 32
  },
  "scenes": [...],
  "startSceneId": "scene-1",
  "version": 1
}
```

**Requirements**:
- Must be valid VGZProject
- Must include all required fields
- Must have version field (currently 1)
- Must be loadable by runtime

### Scene Definitions

**Format**: Inline in `project.json` scenes array OR separate JSON files

**If inline**:
```json
{
  "id": "scene-1",
  "name": "Starting Area",
  "map": { ... },
  "version": 1
}
```

**If separate** (`scenes/scene-1.json`):
- Reference in project.json by ID only
- Runtime loads from project.json array (currently inline only)

### Map Definitions

**Format**: Inline in scene.map OR separate JSON files

**If inline**:
```json
{
  "id": "map-1",
  "name": "Area Name",
  "width": 20,
  "height": 15,
  "tilesets": [...],
  "layers": [...],
  "entities": [...],
  "version": 1
}
```

### Asset References

**Convention**: `projects/{projectId}/assets/{assetType}/{assetId}`

**Examples**:
- `projects/my-game/assets/tilesets/grass`
- `projects/my-game/assets/animations/walk-cycle`
- `projects/my-game/assets/audio/music/theme`

**Benefits**:
- Consistent naming across editor and runtime
- Asset manager can construct paths deterministically
- Supports runtime asset loading without hardcoding
- Supports multiple projects without conflicts

### Tileset Asset Path

**Convention**: `projects/{projectId}/assets/tilesets/{tilesetId}`

**Example**: `projects/demo-project/assets/tilesets/grass`

**Files**:
- `assets/tilesets/grass.json` - Tileset metadata
- `assets/tilesets/grass.png` - Tileset image (future)

---

## Data Formats

### VGZProject

Root project container. Must match `@vgz/shared-types` VGZProject interface.

**Fields**:
- `id: string` - Unique project identifier
- `settings: VGZProjectSettings` - Game configuration
- `scenes: VGZScene[]` - All scenes
- `startSceneId: string` - Entry scene
- `version: number` - Schema version (1)
- `updatedAt?: string` - ISO 8601 timestamp
- `editorMeta?: object` - Editor-only state

### VGZScene

Playable scene definition. Must match `@vgz/shared-types` VGZScene interface.

**Fields**:
- `id: string` - Unique scene ID
- `name: string` - Display name
- `map: VGZMap` - Map data
- `metadata?: object` - Camera and transition config
- `version: number` - Schema version (1)

### VGZMap

Level/area definition. Must match `@vgz/shared-types` VGZMap interface.

**Fields**:
- `id: string` - Unique map ID
- `name: string` - Display name
- `width: number` - Width in tiles
- `height: number` - Height in tiles
- `tilesets: VGZMapTileset[]` - Tileset references
- `layers: VGZMapLayer[]` - Terrain layers
- `entities: VGZEntity[]` - Placed objects
- `spawn?: object` - Player spawn point
- `backgroundColor?: string` - Hex color
- `version: number` - Schema version (1)

### VGZEntity

Serialized game object. Must match `@vgz/shared-types` VGZEntity interface.

**Fields**:
- `id: string` - Unique ID within scene
- `name: string` - Display name
- `type: string` - Entity type (npc|object|trigger|prop)
- `position: object` - Tile coordinates {x, y}
- `zOrder?: number` - Rendering order
- `rotation?: number` - Rotation in degrees
- `scale?: object` - Scale {x, y}
- `visible?: boolean` - Visibility flag
- `editorMeta?: object` - Editor-only metadata

---

## Directory Purposes

### assets/
Holds all game assets and their metadata.

**Subdirectories**:
- `tilesets/` - Tilemap graphics and definitions
- `animations/` - Character and object animations
- `audio/` - Music and sound effects
- `sprites/` - Character and NPC sprites
- `particles/` - Particle effect definitions
- `fonts/` - Custom fonts

### scenes/
Optional: Separate scene definition files.

**Usage**:
- If scenes are large, store separately
- Reference by ID in project.json
- Runtime loads from project.json array (currently)

### maps/
Optional: Separate map definition files.

**Usage**:
- If maps are large, store separately
- Reference by ID in scene.map
- Runtime loads from scene.map (currently)

### saves/
Game save data (populated at runtime).

**Subdirectories**:
- `{slot-1}.json` - Named save slot
- `auto-save.json` - Auto-save backup

### dialogues/
Optional: Dialogue definitions (future system).

**Format**:
- One file per dialogue
- JSON with branches and conditions

### quests/
Optional: Quest definitions (future system).

**Format**:
- One file per quest
- JSON with objectives and rewards

---

## Validation

### Runtime Loading

Projects are validated by `@vgz/runtime` on load:

```typescript
const result = await loadProject({
  source: 'url',
  url: '/projects/my-game/project.json'
})

if (result.success) {
  // Project valid, scenes can be loaded
  const scene = await loadScene({
    project: result.data,
    sceneId: 'scene-1'
  })
}
```

### Validation Rules

**Project**:
- Required fields present
- Field types correct
- startSceneId exists in scenes
- Version compatible (v1)

**Scene**:
- Scene exists in project
- Map data present and valid
- Tileset references valid

**Map**:
- Dimensions positive
- Layer data arrays valid
- Entity IDs unique within map
- Spawn point within bounds (optional validation)

---

## Naming Conventions

### Project IDs
- Lowercase with hyphens: `demo-project`, `my-game-1`
- No spaces or special characters
- 3-30 characters recommended

### Scene IDs
- Lowercase with hyphens: `scene-start`, `forest-area-1`
- Unique within project
- Meaningful names preferred

### Map IDs
- Lowercase with hyphens: `map-forest-1`, `map-village`
- Unique within project
- Should match area/scene

### Entity IDs
- Lowercase with hyphens: `entity-npc-1`, `entity-trigger-door`
- Unique within map/scene
- Type information optional but helpful

### Asset IDs
- Lowercase with hyphens: `tileset-grass`, `animation-walk`
- Should match asset type
- Version numbers optional: `tileset-grass-v2`

---

## Future Expandability

These structures support future:
- Multiple maps per scene
- Nested scenes or subscenes
- Dialogue trees and branches
- Quest systems and chains
- Inventory and item definitions
- NPC and behaviour definitions
- Event trigger systems
- Save/load systems
- Custom metadata per entity type

All without breaking the current serialization contracts.

---

## Example: Minimal Valid Project

See `demo-project/` for a complete, minimal, valid VGZ project.

**Contains**:
- ✅ Valid project.json
- ✅ One scene
- ✅ One map
- ✅ One tileset definition
- ✅ Two entities (object, trigger)
- ✅ Asset folder structure

**Ready for**:
- ✅ Runtime loading
- ✅ Editor integration
- ✅ Gameplay system integration

---

## Summary

VGZ projects:
1. Are self-contained directories
2. Use consistent naming conventions
3. Store all data as JSON
4. Follow shared-types schemas exactly
5. Support future expansion
6. Are loadable by runtime immediately
7. Are editable by editor when ready
8. Are serialization-stable for saves

This structure enables:
- Clean data organization
- Asset path conventions
- Runtime loading without hardcoding
- Editor project creation
- Version control integration
- Future system expansion
