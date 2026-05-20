# Runtime Lifecycle Quick Reference

## Boot Sequence

```
Project (JSON/URL)
    ↓
ProjectLoader (validate)
    ↓
Project (validated)
    ↓
RuntimeBoot (state machine)
    ├─ Load Scene
    ├─ Validate Scene
    └─ Create Context
    ↓
RuntimeContext
    ├─ project: VGZProject
    ├─ scene: VGZScene
    └─ config: { width, height, tileSize }
    ↓
Phaser Game (initialized)
    ↓
Gameplay Systems (future)
```

---

## Types Quick Start

### Load Result Pattern

```typescript
import type { LoadResult } from '@vgz/runtime-types'

// Success case
const result = await loadProject(...)
if (result.success) {
  const project = result.data  // VGZProject
}

// Error case
if (!result.success) {
  const error = result.error  // { code, message, details? }
}
```

### Boot Configuration

```typescript
import type { RuntimeBootConfig } from '@vgz/runtime-types'

const config: RuntimeBootConfig = {
  projectSource: 'url',                    // or 'json'
  projectData: '/projects/game.json',      // URL or VGZProject
  sceneId: 'level-1',                      // Optional, defaults to startSceneId
  validate: true,                          // Default true
  timeout: 5000,                           // ms
  onPhaseChange: (phase) => {              // Optional callback
    console.log(`Boot: ${phase}`)
  },
  onError: (error) => {                    // Optional callback
    console.error(`Boot error: ${error.message}`)
  }
}
```

### Boot Phases

```typescript
type RuntimePhase = 
  | 'IDLE'             // Starting state
  | 'LOADING_PROJECT'  // Fetching project
  | 'PROJECT_READY'    // Project loaded
  | 'LOADING_SCENE'    // Loading scene
  | 'SCENE_READY'      // Scene loaded
  | 'READY'            // Boot complete
  | 'ERROR'            // Boot failed
```

### Runtime Context

```typescript
interface RuntimeContext {
  project: VGZProject          // Full project
  scene: VGZScene              // Current scene
  config: {
    width: number              // From project.settings
    height: number
    tileSize: number
  }
  phase: RuntimePhase           // Current phase
}
```

---

## Usage Examples

### Basic Boot

```typescript
import { RuntimeBoot, isBootReady } from './boot'

const boot = new RuntimeBoot({
  projectSource: 'json',
  projectData: myProject,
  validate: true
})

const result = await boot.boot()

if (isBootReady(result)) {
  const context = boot.getContext()
  // Use context for gameplay
}
```

### Boot with Monitoring

```typescript
const boot = new RuntimeBoot({
  projectSource: 'url',
  projectData: '/projects/game.json',
  onPhaseChange: (phase) => {
    updateUI(`Booting: ${phase}`)
  },
  onError: (error) => {
    showError(`Boot failed: ${error.message}`)
  }
})

await boot.boot()
```

### Direct Load Functions

```typescript
import { loadProject } from './loaders/projectLoader'
import { loadScene } from './loaders/sceneLoader'

// Load project
const projectResult = await loadProject({
  source: 'url',
  url: '/projects/game.json',
  timeout: 5000
})

if (projectResult.success) {
  const project = projectResult.data
  
  // Load scene
  const sceneResult = loadScene({
    project,
    sceneId: 'scene-1',
    validate: true
  })
  
  if (sceneResult.success) {
    const scene = sceneResult.data
    // Use scene
  }
}
```

### Error Handling

```typescript
// Type guards
import { isProjectLoadSuccess, isProjectLoadFailure } from './loaders/projectLoader'

const result = await loadProject(options)

if (isProjectLoadSuccess(result)) {
  // TypeScript narrows to success type
  const project = result.data
} else if (isProjectLoadFailure(result)) {
  // TypeScript narrows to failure type
  const error = result.error
  console.error(`${error.code}: ${error.message}`)
}
```

---

## File Locations

### Package: runtime-types
```
packages/runtime-types/
├── src/loader.ts    # LoadResult, ProjectLoadOptions, SceneLoadOptions
├── src/boot.ts      # RuntimeBootConfig, RuntimeBootState, RuntimePhase, etc.
└── src/index.ts     # All public exports
```

### App: runtime
```
apps/runtime/src/
├── loaders/projectLoader.ts   # loadProject()
├── loaders/sceneLoader.ts     # loadScene()
├── boot.ts                    # RuntimeBoot class
└── main.ts                    # Lifecycle initialization
```

---

## Error Codes

### Project Load
- `INVALID_URL` - URL not provided for source=url
- `NETWORK_ERROR` - HTTP request failed
- `TIMEOUT` - Request exceeded timeout
- `INVALID_JSON` - JSON parse failed
- `SCHEMA_MISMATCH` - Required fields missing/wrong type
- `VERSION_INCOMPATIBLE` - Project version not supported

### Scene Load
- `SCENE_NOT_FOUND` - Scene ID not in project
- `INVALID_SCENE_DATA` - Scene fields invalid
- `MAP_VALIDATION_FAILED` - Map data invalid

---

## No Gameplay Logic Here

This foundation handles ONLY:
- ✅ Safe loading
- ✅ Schema validation
- ✅ State management
- ✅ Context creation

It does NOT include:
- ❌ Player systems
- ❌ Entity systems
- ❌ Collision
- ❌ Movement
- ❌ Combat
- ❌ AI
- ❌ Events
- ❌ Save/load
- ❌ Phaser scenes

---

## Integration Points

### Gameplay Systems
After boot, systems receive `RuntimeContext`:

```typescript
interface RuntimeContext {
  project: VGZProject    // Access settings
  scene: VGZScene        // Access entities, map
  config: {...}          // Game config
  phase: RuntimePhase    // Current boot phase
}
```

### Scene Manager (Future)
Load different scene:
```typescript
// Not yet implemented
const newScene = loadScene({
  project,
  sceneId: 'level-2'
})
```

### Asset Manager (Future)
Access asset paths:
```typescript
const tilesetPath = scene.map.tilesets[0].assetPath
// "projects/game-1/assets/tilesets/tileset-1"
```

---

## Validation Details

### What Gets Validated

**Project:**
- All required fields present
- Field types correct
- Version number present
- startSceneId valid

**Scene:**
- Scene exists in project
- Scene structure complete
- Map data present
- Map dimensions positive
- Layers array valid
- Entities array valid
- Tilesets array valid

### What Doesn't Get Validated

- ❌ Asset paths accessible
- ❌ Asset files exist
- ❌ Tileset images exist
- ❌ Entity references valid (happens at gameplay)
- ❌ Collision data integrity
- ❌ Event references valid

These will be validated by respective systems later.

---

## Quick Troubleshooting

### Boot stuck on LOADING_PROJECT
- Check network connection
- Verify project URL is correct
- Check timeout setting

### Scene not found
- Verify sceneId matches project.scenes[].id
- Check if scene was added to project

### Validation fails
- Check project.json against schema
- Verify required fields present
- Check field types (strings as strings, arrays as arrays)

### Phaser not initializing
- Check boot completed successfully
- Verify context available
- Check Phaser config valid

---

## Next Steps

1. **Entity System** - Use scene.map.entities[]
2. **Tilemap Renderer** - Use scene.map.layers[]
3. **Asset Manager** - Load from asset paths
4. **Scene Manager** - Handle scene transitions
5. **Save System** - Persist runtime state

All future systems receive `RuntimeContext` from boot phase.
