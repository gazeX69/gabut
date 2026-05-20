# Runtime Lifecycle Foundation

**Date**: May 20, 2026  
**Status**: Complete  
**Phase**: Type Foundation → Runtime Lifecycle  

---

## Overview

Established the minimal runtime lifecycle foundation for VGZ. Enables safe project loading, scene loading, and boot orchestration. No gameplay systems, pure data flow and state management.

---

## Architecture

### Boot Sequence

```
┌─────────────────────────────────────────────────┐
│ 1. Load Project (VGZProject from JSON/API)      │
│    - Fetch or deserialize                       │
│    - Validate schema                            │
│    - Check version compatibility                │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 2. Load Scene (VGZScene from project)           │
│    - Find scene by ID                           │
│    - Validate scene structure                   │
│    - Validate map data                          │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 3. Boot Complete (RuntimeContext available)     │
│    - Project available                          │
│    - Scene available                            │
│    - Config ready                               │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 4. Initialize Phaser with scene data            │
│    - Create Phaser.Game                         │
│    - Pass scene context to future systems       │
└─────────────────────────────────────────────────┘
```

### Data Flow

```
VGZProject (serialized)
    │
    ├─→ ProjectLoader (validate)
    │
VGZProject (validated)
    │
    ├─→ RuntimeBoot (state machine)
    │       │
    │       └─→ SceneLoader (validate)
    │
VGZScene (validated)
    │
    └─→ RuntimeContext
            │
            └─→ Phaser Initialization
            └─→ Future Gameplay Systems
```

### Runtime Phases

```
IDLE
  ↓
LOADING_PROJECT ─ (success) ─→ PROJECT_READY
  ↓ (error)
ERROR

PROJECT_READY
  ↓
LOADING_SCENE ─ (success) ─→ SCENE_READY
  ↓ (error)
ERROR

SCENE_READY
  ↓
READY (boot complete)
```

---

## Files Created

### Packages

#### `packages/runtime-types/`
Minimal lifecycle types (NO GAMEPLAY LOGIC)

```
runtime-types/
├── package.json           # Package definition
├── tsconfig.json          # TypeScript config
├── README.md              # Package docs
└── src/
    ├── loader.ts          # Project/scene load contracts
    ├── boot.ts            # Boot orchestration contracts
    └── index.ts           # Public exports
```

**Exports:**
- `LoadResult<T>` - Result pattern for safe loading
- `ProjectLoadOptions` - Project loading configuration
- `SceneLoadOptions` - Scene loading configuration
- `RuntimePhase` - Boot state phases
- `RuntimeBootState` - Current boot state
- `RuntimeBootConfig` - Boot configuration
- `RuntimeContext` - Post-boot context for gameplay systems

### Apps

#### `apps/runtime/src/loaders/`
Safe loading implementations

```
loaders/
├── projectLoader.ts       # Load & validate VGZProject
└── sceneLoader.ts         # Load & validate VGZScene
```

**Handles:**
- URL loading with timeout
- JSON parsing and validation
- Schema validation with helpful errors
- Type-safe result patterns (success/error)
- No execution, only data validation

#### `apps/runtime/src/`
Boot orchestration

```
src/
├── boot.ts                # RuntimeBoot class & lifecycle
└── main.ts                # Runtime initialization (updated)
```

**Features:**
- Minimal state machine (IDLE → LOADING → READY)
- Phase callbacks for monitoring
- Error callbacks with details
- Context retrieval for gameplay systems
- No Phaser logic, only data flow

---

## Key Contracts

### LoadResult<T> Pattern

```typescript
type LoadResult<T> = 
  | { success: true; data: T }
  | { success: false; error: { code, message, details? } }
```

**Benefits:**
- Type-safe success/failure discrimination
- No null checks needed
- Clear error codes and details
- Composable for chaining loads

### RuntimeBootConfig

```typescript
interface RuntimeBootConfig {
  projectSource: 'url' | 'json'
  projectData: string | VGZProject
  sceneId?: string                    // Defaults to project.startSceneId
  validate?: boolean                   // Default true
  timeout?: number                     // Default 5000ms
  onPhaseChange?: (phase) => void
  onError?: (error) => void
}
```

### RuntimeContext

```typescript
interface RuntimeContext {
  project: VGZProject
  scene: VGZScene
  config: {
    width: number
    height: number
    tileSize: number
  }
  phase: RuntimePhase
}
```

---

## What's NOT Included

❌ Gameplay logic  
❌ Player systems  
❌ Movement systems  
❌ Collision systems  
❌ Entity systems  
❌ Behavior trees  
❌ Event systems  
❌ Combat systems  
❌ AI systems  
❌ Save systems  
❌ Phaser scene setup  

All of these go in:
- `packages/engine-core` (gameplay systems)
- `packages/*-system` (specific systems)
- `apps/runtime` (future: Phaser integration)

---

## Validation Strategy

### Project Validation
- ✅ Required fields present (id, startSceneId, settings, scenes)
- ✅ Field types correct (string, array, object, number)
- ✅ Version compatibility (v1 only, with migration path)
- ✅ Settings completeness (title, resolution, tileSize)

### Scene Validation
- ✅ Scene exists in project
- ✅ Scene structure valid (id, name, version, map)
- ✅ Map data present and structured
- ✅ Map dimensions valid (positive width/height)
- ✅ Map layers valid (array of proper objects)
- ✅ Map entities valid (array)
- ✅ Map tilesets valid (array)

### Error Reporting
- Specific error codes (SCENE_NOT_FOUND, SCHEMA_MISMATCH, etc.)
- Human-readable messages
- Details object for programmatic handling
- Available scene IDs in error details

---

## Usage Example

### Basic Boot

```typescript
import { RuntimeBoot } from './boot'

const boot = new RuntimeBoot({
  projectSource: 'url',
  projectData: '/projects/my-game.json',
  validate: true,
  timeout: 5000
})

const result = await boot.boot()
if (result.success) {
  const context = boot.getContext()
  // Use context for gameplay systems
}
```

### Boot with Callbacks

```typescript
const boot = new RuntimeBoot({
  projectSource: 'json',
  projectData: projectObject,
  onPhaseChange: (phase) => {
    console.log(`Boot phase: ${phase}`)
  },
  onError: (error) => {
    console.error(`Boot failed: ${error.message}`)
  }
})

await boot.boot()
```

### Direct Bootstrap

```typescript
import { bootRuntime } from './boot'

try {
  const context = await bootRuntime({
    projectSource: 'url',
    projectData: '/projects/game.json'
  })
  
  // Ready to use context
  initializeGameplay(context)
} catch (error) {
  handleBootError(error)
}
```

---

## Architecture Boundaries

### Runtime Type Contracts
- ✅ Consumed by: Runtime app, gameplay systems
- ✅ Depends on: shared-types only
- ✅ Exported: Minimal, explicit types
- ❌ Never: Contains gameplay logic

### Runtime Loaders
- ✅ Purpose: Safe data loading only
- ✅ Validates: Schema, structure, fields
- ✅ Returns: LoadResult with error details
- ❌ Never: Executes or modifies data

### Runtime Boot
- ✅ Purpose: Orchestrates load sequence
- ✅ Manages: State machine, phases, context
- ✅ Provides: RuntimeContext for gameplay
- ❌ Never: Creates Phaser scenes

### Main.ts
- ✅ Purpose: Lifecycle initialization
- ✅ Calls: Boot sequence
- ✅ Initializes: Phaser after boot
- ❌ Never: Contains gameplay logic

---

## Error Handling

### Load Failures
```typescript
const result = await loadProject(...)
if (!result.success) {
  // result.error.code: 'NETWORK_ERROR' | 'TIMEOUT' | 'SCHEMA_MISMATCH' | etc.
  // result.error.message: Human-readable description
  // result.error.details: Programmatic details
}
```

### Boot Failures
```typescript
const result = await boot.boot()
if (!result.success) {
  const error = result.state.error
  // error.phase: Which phase failed
  // error.code: Error code
  // error.message: Description
}
```

---

## Dependency Analysis

### runtime-types depends on:
- ✅ @vgz/shared-types (type imports only)
- ❌ No other packages

### apps/runtime depends on:
- ✅ @vgz/shared-types (VGZProject, VGZScene types)
- ✅ @vgz/runtime-types (RuntimeBootConfig, etc.)
- ✅ Phaser (renderer only, no data coupling)

### No Circular Dependencies
- runtime-types → shared-types (one direction)
- runtime → runtime-types → shared-types (acyclic)
- runtime → phaser (unrelated dependency)

---

## Compliance Checklist

### Governance Compliance
✅ Minimal, safe changes  
✅ Preserved architecture boundaries  
✅ No gameplay logic in lifecycle systems  
✅ No ECS or behavior systems  
✅ No event systems  
✅ No save systems  
✅ Zero Phaser coupling in loaders/boot  
✅ Clean data flow (load → validate → context)  

### Boundary Rules
✅ Runtime: Consumes project data  
✅ Packages: Reusable, isolated  
✅ Data: Serializable, versionable  
✅ No hidden coupling  
✅ No circular dependencies  
✅ Explicit APIs only  

### Separation of Concerns
✅ Loading: Only data, no execution  
✅ Boot: State management only  
✅ Phaser: Initialized after boot, receives context  
✅ Gameplay: Future systems receive context  

---

## Future Integration Points

### Gameplay Systems
Runtime context will be passed to:
- Entity system (entities from scene)
- Tilemap system (map data from scene)
- Camera system (camera config from scene)
- Event system (systems communicate via events)
- Save system (serializes current state)

### Scene Management
Future systems:
- Scene transitions (load different scene)
- Multiple maps per scene (current: 1:1)
- Persistent scene state (save/load)
- Dynamic entity creation (runtime)

### Asset Loading
Future integration:
- Asset manager (loads tilesets from assetPath)
- Animation system (loads from entity data)
- Dialogue system (loads from entity data)
- Audio system (loads references)

---

## Success Metrics

✅ **Boot succeeds** with valid project  
✅ **Boot fails gracefully** with invalid project  
✅ **Phase callbacks** fire in correct order  
✅ **Error details** available for debugging  
✅ **Context available** after successful boot  
✅ **Phaser initializes** with correct dimensions  
✅ **No errors** on compile  
✅ **Type safe** throughout  

---

## Summary

Established a minimal, governance-compliant runtime lifecycle foundation:

1. **@vgz/runtime-types** - Lifecycle contracts
2. **ProjectLoader** - Safe project loading with validation
3. **SceneLoader** - Safe scene loading with validation
4. **RuntimeBoot** - State machine orchestration
5. **main.ts** - Lifecycle initialization

**Status**: Production Ready  
**Next Phase**: Integrate with Phaser scenes and gameplay systems
