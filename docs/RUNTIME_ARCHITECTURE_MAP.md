# Runtime Architecture Map

**Date**: May 21, 2026  
**Status**: Complete Foundation Phase  

---

## 1. System Dependency Graph

### Execution Flow (Boot → Runtime)

```
┌─────────────────────────────────────────────────────────────────┐
│                      main.ts (Entry Point)                      │
│                   Browser JavaScript Execution                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  RuntimeBoot   │  Phase Machine
                    │   (boot.ts)    │
                    └────────┬───────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
    ┌─────────────────┐ ┌──────────────┐ (error)
    │ projectLoader   │ │  sceneLoader │ ──→ Error Result
    └────────┬────────┘ └──────┬───────┘
             │                 │
             ▼                 ▼
    ┌────────────────────────────────────┐
    │     RuntimeContext (Locked)        │
    │  project, scene, config (immutable)│
    └────────────────────────────────────┘
             │
             ▼
    ┌────────────────────────────────────┐
    │  initializePhaserWithScene()        │
    │   Create Phaser.Game instance      │
    └────────────────────────────────────┘
             │
             ▼
    ┌────────────────────────────────────┐
    │      BootScene (Phaser Scene)      │
    │  preload() → create() → update()   │
    └────────┬──────────────────────────┘
             │
    ┌────────┴──────────────────────────────┐
    │                                       │
    ▼                                       ▼
Mount Phase                         Game Loop Phase
├─ Asset Preloader                 ├─ RuntimeSceneLoop.tick()
├─ Phaser Scene Adapter            ├─ Component.onUpdate()
├─ Entity Spawner                  ├─ Trigger Processing
├─ Input Bridge                    ├─ Camera Update
├─ Audio Bridge                    ├─ Collision Detection
└─ UI Layer Init                   └─ Render Pass
```

---

## 2. Package Ownership & Boundaries

```
┌──────────────────────────────────────────────────────────────────┐
│                    RUNTIME APPLICATION LAYER                     │
│                 (@rpg-maker-vgz/runtime - Phaser)               │
│                                                                  │
│  apps/runtime/src/                                              │
│  ├─ main.ts (Bootstrap orchestrator)                            │
│  ├─ boot.ts (RuntimeBoot state machine)                         │
│  ├─ loaders/ (Project/Scene loading with validation)           │
│  ├─ phaser-adapter/ (Phaser isolation layer)                   │
│  ├─ gameplay/ (Player control, collision, interaction)         │
│  ├─ rendering/ (Tilemap, assets, depth sorting)                │
│  ├─ ui/ (Screen-space UI API)                                  │
│  ├─ audio/ (Sound/music management)                            │
│  └─ scenes/ (Phaser scene implementations)                     │
└──────────────────────────────────────────────────────────────────┘
                           ▲
                    ┌──────┴─────────┐
                    │                │ (imports contracts)
          ┌─────────┴────────┐   ┌───┴──────────────┐
          ▼                  ▼   ▼                  ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  @vgz/runtime-   │  │  @vgz/shared-    │  │  @vgz/scene-     │
│  types           │  │  types           │  │  types           │
│                  │  │                  │  │                  │
│ • RuntimePhase   │  │ • VGZProject     │  │ • VGZScene       │
│ • RuntimeContext │  │ • VGZScene       │  │ • VGZLayer       │
│ • LoadResult     │  │ • VGZMap         │  │ • VGZEntity      │
│ • RuntimeBoot    │  │ • VGZEntity      │  │ • VGZTransform   │
│                  │  │ • VGZMapLayer    │  │ • VGZAssetRef    │
│                  │  │ • Settings       │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
          ▲                  ▲                     ▲
          │                  │ (implements)       │
          │                  │                    │
          └──────────────────┴────────────────────┘
                             │
                    ┌────────┴──────────┐
                    ▼                   ▼
        ┌──────────────────────┐  ┌────────────────┐
        │ @vgz/scene-validator │  │ @vgz/engine-   │
        │                      │  │ runtime        │
        │ validateScene()      │  │                │
        │ ValidationResult     │  │ RuntimeScene   │
        │ (Deep validation)    │  │ (Immutable     │
        │                      │  │  descriptors)  │
        └──────────────────────┘  └────────────────┘
```

### Dependency Direction (Enforced at Build-Time)

```
Applications (Runtime/Editor)
    │
    ├─→ Runtime-Types (Boot lifecycle)
    │      │
    │      └─→ Shared-Types (Data schemas)
    │
    ├─→ Shared-Types (Data schemas) ← LEAF NODE (no imports)
    │
    ├─→ Scene-Types (VGZScene structure)
    │      │
    │      └─→ Shared-Types (Base references)
    │
    ├─→ Scene-Validator (Validation logic)
    │      │
    │      └─→ Scene-Types
    │           └─→ Shared-Types
    │
    └─→ Engine-Runtime (Scene descriptors)
           │
           └─→ Shared-Types
```

**Rule**: Never import downward. Packages form a DAG (Directed Acyclic Graph).

---

## 3. Mutable vs Immutable Layers

### Immutable Runtime State

```
RuntimeContext (created during boot, never modified)
├─ project: VGZProject
│  ├─ id: string (project ID)
│  ├─ version: 1 (schema version)
│  ├─ startSceneId: string
│  ├─ settings: {
│  │  ├─ title: string
│  │  ├─ resolution: { width, height }
│  │  ├─ tileSize: number
│  │  └─ ...
│  └─ scenes: VGZScene[]
│
├─ scene: VGZScene
│  ├─ id: string (scene ID)
│  ├─ name: string
│  ├─ version: 1
│  └─ map: VGZMap
│     ├─ width, height (dimensions)
│     ├─ spawn: { x, y }
│     ├─ layers: VGZMapLayer[]
│     │  └─ data: number[] (tile indices, immutable)
│     ├─ entities: VGZEntity[] (original definitions)
│     └─ tilesets: VGZMapTileset[]
│
└─ config: {
   ├─ width: number (canvas width)
   ├─ height: number (canvas height)
   └─ tileSize: number (pixels per tile)

// Once RuntimeContext is created, it NEVER changes
// Scene transitions create a NEW RuntimeContext
```

### Mutable Runtime State

```
MountedScene (created during gameplay, highly mutable)
├─ sceneId: string
├─ isDisposed: boolean
├─ mountedEntities: Map<entityId, RuntimeMountedEntity>
│  └─ each entity:
│     ├─ entityId: string
│     ├─ phaserObject: Phaser.GameObjects.Sprite | Container
│     ├─ destroyed: boolean
│     ├─ components: RuntimeComponent[]
│     │  ├─ [0] SpinComponent
│     │  │  └─ runtimeData: { angle, speed }
│     │  ├─ [1] FloatComponent
│     │  │  └─ runtimeData: { yOffset, speed }
│     │  └─ [custom] UserComponent
│     │     └─ runtimeData: { customField: any }
│     ├─ updateHandler: (entity, deltaMs, loop) => void
│     └─ runtimeData: Record<string, unknown>
│
├─ mountedLayers: Map<layerId, RuntimeMountedLayer>
│  └─ each layer:
│     ├─ layerId: string
│     ├─ phaserLayer: Phaser.Tilemaps.TilemapLayer
│     ├─ visible: boolean (mutable)
│     ├─ alpha: number (mutable)
│     ├─ depth: number (mutable)
│     └─ scrollFactorX/Y: number (parallax)
│
├─ uiLayer: RuntimeUILayer
│  └─ elements: Map<elementId, RuntimeUIElement>
│     ├─ text: RuntimeUIText
│     │  ├─ content: string (mutable)
│     │  ├─ gameObject: Phaser.GameObjects.Text
│     │  └─ visible: boolean (mutable)
│     └─ panel: RuntimeUIPanel
│        ├─ gameObject: Phaser.GameObjects.Container
│        └─ visible: boolean (mutable)
│
├─ audioLayer: RuntimeAudioLayer
│  ├─ sounds: Map<soundId, RuntimePlayingSound>
│  │  └─ each sound:
│  │     ├─ soundId: string
│  │     ├─ playing: boolean (mutable)
│  │     ├─ volume: number (mutable)
│  │     └─ phaserSound: Phaser.Sound.BaseSound
│  ├─ music: RuntimeMusicState
│  │  ├─ playing: boolean (mutable)
│  │  ├─ volume: number (mutable)
│  │  └─ phaserSound: Phaser.Sound.BaseSound
│  └─ masterVolume: number (mutable)
│
├─ cameraState: RuntimeCameraState
│  ├─ followTarget: RuntimeMountedEntity | null (mutable)
│  ├─ position: { x, y } (mutable)
│  ├─ zoom: number (mutable)
│  └─ worldBounds: { width, height } (immutable)
│
└─ inputState: RuntimeInputState
   ├─ keysDown: Set<KeyCode> (mutable)
   ├─ keysPressed: Set<KeyCode> (mutable per frame)
   └─ lastInputTime: number (mutable)

// MountedScene is completely rebuilt on scene transitions
// All references are released and garbage-collected
```

---

## 4. Execution Phase Timeline

### Phase 1: Project Boot (0-100ms)

```
Timeline:
├─ T+0ms: main.ts executes
├─ T+5ms: RuntimeBoot instantiated
├─ T+10ms: Load project from URL/JSON
│         • Fetch project JSON
│         • Parse JSON
│         • Validate schema
├─ T+50ms: PROJECT_READY (project loaded)
├─ T+60ms: Load scene
│         • Find scene in project
│         • Validate map structure
│         • Check layer dimensions
├─ T+80ms: SCENE_READY
├─ T+90ms: READY
└─ T+100ms: RuntimeContext created, boot.getContext() available

Current: Boot takes ~100ms (depends on network)
Future: Hot-scene-load: ~20ms (no network)
```

### Phase 2: Scene Mount (100-200ms)

```
Timeline:
├─ T+100ms: initializePhaserWithScene() called
├─ T+105ms: Phaser.Game config constructed
├─ T+110ms: BootScene preload() runs
│          • Collect assets from tilesets
│          • Collect assets from entities
│          • Preload textures (async in browser)
├─ T+150ms: Asset loading completes
├─ T+155ms: BootScene create() runs
│          • Create Phaser tilemap
│          • Render all tilemap layers
│          • Spawn player entity
│          • Spawn NPC entities
│          • Attach cameras
│          • Attach input listeners
│          • Attach interaction zones
├─ T+195ms: create() completes
├─ T+200ms: First update() frame starts

Current: Mount takes ~100ms (blocking)
Future: Streaming assets could reduce this
```

### Phase 3: Gameplay Loop (per frame, ≈16.67ms @ 60fps)

```
Frame [N] Timeline (assuming 60 FPS):
├─ T+0.0ms: Frame start
├─ T+1.0ms: Phaser physics step (gravity, velocity)
├─ T+2.0ms: Collision detection (AABB)
├─ T+3.0ms: Trigger overlap detection
├─ T+4.0ms: RuntimeSceneLoop.tick(16.67)
│          • Snapshot entities
│          • For each entity:
│            ├─ Call updateHandler
│            └─ For each component:
│               ├─ Snapshot components
│               └─ Call onUpdate(16.67)
│          • Skip disposed entities safely
├─ T+8.0ms: Camera position lerp update
├─ T+9.0ms: Trigger callbacks fire (if enabled)
├─ T+10.0ms: UI layer update (text content, visibility)
├─ T+11.0ms: Audio manager update (volume sync, cleanup)
├─ T+12.0ms: Phaser render pass
│           • Render all depth-sorted objects
│           • Draw to canvas/WebGL
└─ T+16.67ms: Frame end, repeat

Budget: 16.67ms max
Used: ~13.0ms (typical)
Headroom: ~3.67ms (safe)

Safe to add: Light gameplay logic, pathfinding
Risky to add: Complex physics, AI decision trees
```

### Phase 4: Scene Transition (200-300ms)

```
Timeline:
├─ T+0ms: Scene transition requested
│         • Player presses "door" portal
│         • InteractionSystem fires onInteraction callback
├─ T+5ms: RuntimeSceneTransition initiated
├─ T+10ms: Current scene cleanup
│         • AudioLayer.stop() all sounds
│         • RuntimeUILayer.destroyAll()
│         • MountedScene.dispose()
│         • Phaser scene.stop()
├─ T+50ms: Load new scene
│         • RuntimeBoot.loadScene(newSceneId)
│         • Validate new scene
├─ T+100ms: Mount new scene
│          • (same as Phase 2, 100ms)
├─ T+200ms: New scene ready
│          • Player entity spawned at new spawn point
│          • Camera positioned
│          • First update() frame starts
└─ T+300ms: Fully transitioned

User experience: ~200ms black screen (acceptable)
Current: Works without crashes ✅
Future: Fade transition animation recommended
```

---

## 5. Component System Ownership

### Component Lifecycle

```
Component Creation
  ↓
entity.components.push(component)
  ↓
RuntimeMountedEntity.attachComponent(component)
  ├─ Set component.mountedEntity = this
  ├─ Set component.mountedScene = this.scene
  └─ Call component.onAttach()
       └─ Component initializes runtimeData
  ↓
Next tick: RuntimeSceneLoop.tick()
  ├─ Call component.onUpdate(deltaMs)
  │  └─ Component reads/writes runtimeData
  │  └─ Component reads entity.phaserObject
  └─ Repeat every frame
  ↓
Component Removal
  ├─ entity.components.remove(component)
  ├─ Call component.onDetach()
  ├─ Clear component references
  └─ Garbage collect
```

### Component Access Pattern (Safe)

```
// During onUpdate(deltaMs)
export class SpinComponent implements RuntimeComponent {
  id = 'spin-1'
  type = 'spin'
  enabled = true
  runtimeData: { angle: number, speed: number }

  onUpdate(deltaMs: number) {
    // ✅ SAFE: Read from runtimeData
    const newAngle = this.runtimeData.angle + (this.runtimeData.speed * deltaMs)
    
    // ✅ SAFE: Update phaserObject via mounted entity
    if (this.mountedEntity?.phaserObject) {
      this.mountedEntity.phaserObject.rotation = newAngle
      this.runtimeData.angle = newAngle
    }
    
    // ❌ UNSAFE: Do NOT create/destroy entities here
    // (iteration snapshots prevent modification)
    
    // ❌ UNSAFE: Do NOT access RuntimeContext directly
    // (immutable, use entity.runtimeData instead)
  }
}
```

### Component Safety Guarantees

- **No Phaser imports** in component code (use mountedEntity proxy)
- **No RuntimeContext mutation** (immutable by design)
- **No entity creation/destruction** during onUpdate (snapshot iteration)
- **Exceptions caught** per-component (errors do not halt loop)
- **Safe cleanup** on scene disposal (all references released)

---

## 6. Input Abstraction Boundary

### Physical Input → Abstract State → Gameplay Logic

```
Browser KeyboardEvent
  ↓
RuntimeInputState (abstract wrapper)
├─ keysDown: Set<string>         // W, A, S, D, Space, E, ArrowUp, ArrowLeft...
├─ keysPressed: Set<string>      // New this frame
├─ lastInputTime: number         // ms since epoch
└─ isKeyDown(code: string): boolean
  
   // Gameplay code never sees Phaser input directly
   ↓
PlayerController
├─ readInput from RuntimeInputState
├─ Calculate movement vector
│  └─ Normalize diagonal movement
└─ Apply velocity to sprite
   
   // Same for interaction system
   ↓
InteractionSystem
├─ readInput from RuntimeInputState
├─ Check for E/Space press
└─ Fire callback if overlap active

// NO Phaser.Input.Keyboard references in gameplay/
```

**Benefit**: Can swap keyboard with gamepad/touch without changing gameplay code.

---

## 7. Camera Abstraction Boundary

### Physical Rendering → Abstract Camera → Gameplay Query

```
Phaser Camera (in scene)
  ↓
RuntimeCameraState (abstract API)
├─ followTarget: RuntimeMountedEntity | null
├─ getWorldPoint(screenX, screenY): { x, y }
├─ getScreenPoint(worldX, worldY): { x, y }
├─ setFollow(entity, smoothFactor)
├─ setPosition(x, y)
├─ setZoom(factor)
└─ update(deltaMs)  // Apply lerp each frame

   // Gameplay code queries camera state
   ↓
InteractionSystem
├─ Get camera position
└─ Calculate nearby entities relative to viewport

   // Component code uses camera indirectly
   ├─ Via updateHandler callback
   └─ Via runtimeData cache

// NO Phaser.Cameras references in gameplay/
```

**Benefit**: Camera code is isolated, rendering-agnostic.

---

## 8. Collision System Ownership

### Data Layer (Immutable)

```
VGZMapLayer (schema)
├─ id: string
├─ name: string
├─ type: 'terrain' | 'collision' | 'entity'
└─ data: number[]  (tile indices, immutable)
   └─ Loaded once, never modified
```

### Physics Layer (Mutable)

```
Phaser.Tilemaps.TilemapLayer
├─ Synced from VGZMapLayer at scene start
├─ Collision flags set based on tile values
└─ Physics body shapes created

Arcade Physics
├─ Collision detection runs every physics step
├─ Player sprite collision tested against layers
└─ Contact results cached for this frame
```

### Query Layer (Runtime)

```
RuntimeCollisionBounds (abstract geometry)
├─ entity.aabb: { x, y, width, height }
├─ isSolidCollider(entity): boolean
├─ hasActiveCollision(entity, layer): boolean
└─ entitiesOverlap(entity1, entity2): boolean

// Gameplay queries collision state
InteractionSystem
├─ Check overlaps with triggers
├─ Fire callbacks if yes
└─ Track nearby entities for tooltip

// Physics automatically handles collisions
// Gameplay never directly creates collision bodies
```

---

## 9. Rendering Pipeline Ownership

### Data → Assets → Rendering

```
VGZMap (immutable data)
├─ width, height (dimensions)
├─ tilesets: Array of { id, name, assetPath }
└─ layers: Array of { id, data[], type }

Asset Preloader
├─ Collects tileset asset paths
├─ Fetches/loads textures from disk
├─ Registers textures in Phaser
└─ Creates fallback canvas textures if missing

Tilemap Renderer
├─ For each VGZMapLayer:
│  ├─ Create Phaser.Tilemaps.TilemapLayer
│  ├─ Populate with tile indices from layer.data
│  ├─ Set texture key from tileset
│  └─ Set depth/z-order
└─ Tilemap ready for rendering

Phaser Render Pass
├─ Draw all layers in depth order
├─ Apply camera transform
└─ Output to canvas/WebGL

// Gameplay code never touches rendering
// Only sets entity.phaserObject.visible, position, etc
```

---

## 10. Quick Reference: Who Owns What

| Subsystem | Owner | Mutable | Accessible By |
|-----------|-------|---------|---|
| VGZProject | Boot (read-only) | ❌ | All (via RuntimeContext) |
| VGZScene | Boot (read-only) | ❌ | All (via RuntimeContext) |
| VGZMap | Boot (read-only) | ❌ | Asset preloader, renderer |
| MountedScene | Scene loop | ✅ | Only loop, adapters |
| MountedEntity.phaserObject | Scene loop | ✅ | Components (via proxy) |
| MountedEntity.components | Scene loop | ✅ | Only loop |
| Component.runtimeData | Component | ✅ | Only that component |
| RuntimeInputState | Input bridge | ✅ | Gameplay code (read-only) |
| RuntimeCameraState | Camera bridge | ✅ | Gameplay code (read-only) |
| RuntimeUILayer | UI layer | ✅ | Gameplay code (create/destroy) |
| RuntimeAudioLayer | Audio layer | ✅ | Gameplay code (play/stop) |
| Phaser.Game | Main | ✅ | Boot (read-only) |

---

## 11. Error Propagation Map

### Boot Errors

```
projectLoader.loadProject()
  ├─ INVALID_URL → Boot logs, returns error
  ├─ NETWORK_ERROR → Boot logs, returns error
  ├─ TIMEOUT → Boot logs, returns error
  ├─ INVALID_JSON → Boot logs, returns error
  ├─ SCHEMA_MISMATCH → Boot logs, returns error
  └─ VERSION_INCOMPATIBLE → Boot logs, returns error

sceneLoader.loadScene()
  ├─ SCENE_NOT_FOUND → Boot logs, returns error
  ├─ SCENE_MISSING_FIELD → Boot logs, returns error
  ├─ MAP_INVALID_DIMENSIONS → Boot logs, returns error
  └─ LAYER_INVALID_SIZE → Boot logs, returns error

RuntimeBoot.boot()
  ├─ Project phase error → state.phase = 'ERROR'
  ├─ Scene phase error → state.phase = 'ERROR'
  └─ state.error populated, onError() callback fired

main.ts
  ├─ Catch boot error
  ├─ Log error
  ├─ Do NOT create Phaser instance
  └─ Display error message
```

### Runtime Errors

```
Component.onUpdate()
  └─ Throw error
     ├─ Caught by RuntimeSceneLoop
     ├─ Logged to console
     ├─ Component remains attached
     └─ Next frame continues normally

Trigger callback
  └─ Throw error
     ├─ Caught by RuntimeSceneLoop
     ├─ Logged to console
     └─ Other triggers continue

Entity updateHandler
  └─ Throw error
     ├─ Caught by RuntimeSceneLoop
     ├─ Logged to console
     └─ Next entity continues

UI creation
  └─ Throw error
     ├─ Caught by RuntimeUILayer
     ├─ Returns null
     ├─ Logged as warning
     └─ Other UI continues

Audio play
  └─ Missing asset
     ├─ Checked by RuntimeAudioLayer
     ├─ Returns null (silent fail)
     └─ Game continues
```

---

## 12. Data Flow Diagram

### Complete Flow: Project JSON → Gameplay

```
project.json (disk)
  ↓
projectLoader.loadProject()
  ├─ HTTP fetch (if URL source)
  └─ JSON parse
  ↓
validateProjectSchema()
  ├─ Check required fields
  ├─ Validate types
  └─ Verify version === 1
  ↓
RuntimeBoot.state.project = VGZProject
  ↓
sceneLoader.loadScene()
  ├─ Find scene by ID
  └─ validateMap()
  ↓
RuntimeBoot.state.scene = VGZScene
  ↓
RuntimeContext {
  project: VGZProject,
  scene: VGZScene,
  config: { width, height, tileSize }
}
  ↓
initializePhaserWithScene(context)
  ├─ Create Phaser.Game
  ├─ Preload assets
  └─ Mount scene
  ↓
MountedScene {
  mountedEntities: Map<id, RuntimeMountedEntity>,
  mountedLayers: Map<id, RuntimeMountedLayer>,
  uiLayer: RuntimeUILayer,
  audioLayer: RuntimeAudioLayer
}
  ↓
RuntimeSceneLoop.tick()
  ├─ Update entities
  ├─ Update components
  ├─ Process triggers
  └─ Render
  ↓
Game Output (Canvas)
```

