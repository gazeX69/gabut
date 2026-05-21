# Editor Architecture Map

## 1. Overview

The VGZ Editor is designed as a React-based shell that surrounds and orchestrates the existing Phaser-based game runtime. The editor and runtime run in completely isolated environments, communicating exclusively via a `postMessage` bridge.

**Current Phase:** Minimal Visual Editor Foundation (Readonly)

## 2. Editor/Runtime Boundaries

### Editor (React)
- Runs the outer layout (`EditorLayout.tsx`).
- Owns the UI orchestration: Toolbar, Hierarchy, Inspector.
- Maintains the current editor state (e.g., `selectedEntityId`).
- **Never** imports or interacts with Phaser APIs directly.
- **Never** mutates the runtime scene data directly.

### Runtime (Phaser iframe)
- Runs inside an isolated `<iframe>` (`RuntimeViewport.tsx`).
- Owns all rendering, physics, and gameplay loops.
- Owns the authoritative state of the loaded `RuntimeScene`.
- Listens for selection events from the editor to highlight entities.

### The Bridge (`useRuntimeBridge.ts`)
- Sends messages: `REQUEST_SCENE_DATA`, `SELECT_ENTITY`, `DESELECT_ENTITY`.
- Receives messages: `SCENE_DATA`, `SCENE_LOADED`, `ENTITY_SELECTED`, `ENTITY_DESELECTED`.
- Uses only serializable messages defined in `@vgz/shared-types`.

## 3. Minimal Tilemap Paint Foundation Phase

The editor is expanding from pure transform editing into **Minimal Tilemap Paint Foundation**, introducing controlled mutation of tilemaps.
- **Viewport Click Selection**: Entities can be selected by clicking them directly in the runtime viewport.
- **Transform Editing Boundary**: Transforms (x/y position, rotation, scale) and visibility can be mutated from the Inspector.
- **Tilemap Painting**: When Paint Mode is enabled, clicking on the runtime viewport paints the selected tile index onto the currently active tilemap layer.
- **Runtime Tile Paint Boundary**: The editor sends `EDITOR_PAINT_TILE` to the runtime, which securely resolves the layer, validates bounds, updates the Phaser tilemap visually, and mutates the inner runtime tile array. The runtime broadcasts `RUNTIME_TILE_UPDATED` back to keep editor local copies in sync.

## 4. Minimal Sprite Animation Runtime Foundation

The editor introduces a **Minimal Sprite Animation Runtime Foundation**, establishing looping sprite animations for entities.
- **Animation Model**: Lightweight runtime-only structures (`AnimationClip`, `RuntimeAnimationState`) define frame arrays and loop configurations. There is **no animator graph**, **no blend tree**, and **no state machine**.
- **Playback Integration**: `RuntimeMountedEntity` holds optional animation state, updated safely each frame within `RuntimeSceneLoop`.
- **Inspector Control**: The Inspector Panel provides basic clip assignment, Play, and Stop functionality.
- **Preview Support**: Selecting a clip and playing it updates the runtime immediately for visual preview, ensuring stable loop operation.
- **Bridge Messages**: Uses `EDITOR_PLAY_ANIMATION` and `RUNTIME_ANIMATION_CHANGED` to synchronize preview state ephemerally without persisting to scene data.
- **No Timeline Editor**: There is no UI timeline, curve editor, or keyframe track editor.
- **Non-Persistent Editing**: Like transform edits and tile paints, the `RuntimeScene` descriptors remain immutable. There is still **no save system** and changes are strictly ephemeral.

## 5. Minimal Asset Browser Foundation

The editor includes a **Minimal Asset Browser Foundation**, making it a content-authoring tool rather than a static demo.
- **Asset Browser Panel**: A bottom panel displaying a readonly list of assets registered in the `VGZScene`. Shows ID, type, and path.
- **Entity Asset Assignment**: The Inspector allows assigning an `assetId` to a selected entity from the registry.
- **Runtime Sync Boundary**: Assigning an asset sends `EDITOR_ASSIGN_ASSET` to the runtime. The runtime securely updates the Phaser texture, resets any running animations to avoid visual mismatches, and broadcasts `RUNTIME_ASSET_UPDATED`.
- **Readonly Asset Registry**: The editor receives the asset list exclusively through the initial `SCENE_DATA` bridge message. It never accesses Phaser's internal cache or loaders.
- **Deferred Complexity**: There is no drag-and-drop import pipeline, no filesystem watcher, and no atlas slicing editor. Changes remain non-persistent.

## 6. Minimal Entity Creation & Prefab Foundation

The editor allows dynamically authoring scene content through a **Minimal Entity Creation & Prefab Foundation**.
- **Prefab Template Model**: Lightweight data structures (`PrefabTemplate`) define hardcoded preset configurations for heroes, chests, walls, and trees. There is no prefab inheritance, nested prefabs, or visual prefab editor.
- **Entity Creation**: The `PrefabBrowserPanel` allows creating an instance of a prefab. The editor sends `EDITOR_CREATE_ENTITY`, and the runtime safely generates a unique ID, builds the descriptor, creates the Phaser GameObject, and mounts it into the scene dynamically.
- **Hierarchy Manipulation**: The `HierarchyPanel` allows duplicating or deleting selected entities. Deletion performs a deep cleanup of components, collision bounds, trigger zones, and physics bodies to ensure the runtime loop remains stable.
- **State Synchronization**: Upon runtime confirmation (`RUNTIME_ENTITY_CREATED` or `RUNTIME_ENTITY_DELETED`), the editor patches its local immutable scene copy.
- **Deferred Complexity**: There is no generic entity creation from scratch, no runtime redesign to ECS, and changes remain purely transient and unsaved.

## 7. Forbidden Direct Phaser Access

To maintain strict modularity and prevent the React editor from breaking the runtime loop, direct Phaser access is strictly forbidden in the editor codebase:
- `import Phaser from 'phaser'` is banned in `apps/editor`.
- The editor cannot query the DOM of the Phaser canvas directly.
- React components must never hold references to Phaser `GameObject`s, `Scene`s, or `Camera`s.
- All selection states are communicated by sending entity IDs over the bridge, allowing the runtime adapter to handle the actual visual highlighting.
