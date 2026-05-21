# Current System State

This document details the exact implementation status of the VGZ game engine as of May 21, 2026. It serves as a reality check to distinguish between completed systems, partial implementations, placeholders, and planned systems.

---

## 1. System Implementation Grid

| Subsystem | Folder / File | Status | Description |
| :--- | :--- | :--- | :--- |
| **Serialization Schemas** | `packages/shared-types` | **Implemented** | Full type schemas for project, scene, tilemaps, layers, entities. |
| **Lifecycle Contracts** | `packages/runtime-types` | **Implemented** | Types for loaders, boot phases, context structures. |
| **Project Loader** | `apps/runtime/src/loaders/projectLoader.ts` | **Implemented** | Handles fetching JSON, schema validation, and error translation. |
| **Scene Loader** | `apps/runtime/src/loaders/sceneLoader.ts` | **Implemented** | Handles scene querying and deep map layer validation. |
| **Boot Orchestrator** | `apps/runtime/src/boot.ts` | **Implemented** | Step-by-step state machine (`RuntimeBoot`). |
| **Phaser Bridge** | `apps/runtime/src/main.ts` | **Implemented** | Executes `RuntimeBoot`, creates Phaser canvas with physics, preloads tilesets, draws map, spawns player, configures camera follow, and renders debug HUD. |
| **Demo Project Data** | `projects/demo-project` | **Partial** | Valid `project.json` with terrain + collision layers and tileset metadata. Image assets (PNGs) are missing, triggering runtime fallbacks. |
| **Editor Interface** | `apps/editor` | **Placeholder** | Basic Vite + React template. Contains no actual editor features or type references. |
| **Gameplay Core** | `packages/engine-core` | **Placeholder** | Empty directory containing only a `.gitkeep` file. |
| **Asset Loader** | `apps/runtime/src/rendering` | **Implemented** | Dynamic image preloader in Phaser Scene. Handles missing assets gracefully via canvas fallbacks. |
| **Tilemap Renderer** | `apps/runtime/src/rendering/tilemapRenderer.ts` | **Implemented** | Compiles `VGZMapLayer` data arrays into dynamic Phaser Tilemaps. |
| **Collision System** | `apps/runtime/src/gameplay/collisionBuilder.ts` | **Implemented** | Reads `type: 'collision'` layers, enables tile collision via `setCollisionByExclusion`, registers Arcade Physics colliders against the player sprite. |
| **Player Controller** | `apps/runtime/src/gameplay/playerController.ts` | **Implemented** | WASD + Arrow key input, smooth delta movement, diagonal normalization, configurable speed, placeholder sprite. |
| **Spawn Resolver** | `apps/runtime/src/gameplay/spawnResolver.ts` | **Implemented** | Resolves player spawn from `map.spawn` or map center fallback. |
| **Camera System** | `apps/runtime/src/main.ts` | **Implemented** | Camera follows player with smooth lerp (0.1). World and physics bounds locked to map dimensions. |
| **Debug HUD** | `apps/runtime/src/main.ts` | **Implemented** | Live overlay showing project name, scene, player position, collision count, FPS, nearby entity, and last interaction event. Fixed to camera viewport. |
| **Entity Spawner** | `apps/runtime/src/main.ts` | **Partial** | Spawns non-breaking shape placeholders (circles/squares) and text labels for map entities. |
| **Interaction System** | `apps/runtime/src/gameplay/interactionSystem.ts` | **Implemented** | Physics overlap zones for `trigger` (auto-fire on enter) and `object` (E/Space key press). Popup display with cooldown. Per-frame state tracking of nearby entities. |
| **Save State System** | None | **Missing** | No system is present to serialize runtime mutations back to a save format. |

---

## 2. Status Classification Details

### A. Implemented Systems (Production-Ready)
*   **Schema Contracts (`@vgz/shared-types`)**: Full static schema definitions. Ready to serialize/deserialize engine states.
*   **Lifecycle State Machine (`RuntimeBoot`)**: Moves safely through bootstrap phases:
    `IDLE` → `LOADING_PROJECT` → `PROJECT_READY` → `LOADING_SCENE` → `SCENE_READY` → `READY` (or `ERROR`).
    Gracefully handles abort states, HTTP network failures, timeout constraints (default 5000ms), and parsing anomalies.
*   **Data Validation Loaders**: Deeply checks data integrity. For example, `sceneLoader.ts` verifies that the dimensions of `VGZMapLayer.data` match the expected grid bounds (`width * height`).
*   **Player Movement & Physics**: Arcade Physics enabled with zero gravity. Player moves via WASD/Arrows at 160px/s with diagonal normalization. Collides against `type: 'collision'` tilemap layers. Camera follows player smoothly.

### B. Partially Implemented Systems
*   **Demo Assets**: Configuration descriptors (e.g. `grass.json`) exist, but the visual assets themselves (tileset PNGs) are not present.
*   **Entity Visualization**: Entities render as colored shape primitives with name labels. No sprite-based or animation-based rendering yet.

### C. Placeholders
*   **Vite + React Editor (`apps/editor`)**: A default React starter workspace. Visual node layout editors, tileset pickers, entity configuration inspector panels, and communication scripts with the runtime are **unimplemented**.
*   **Engine Core (`packages/engine-core`)**: Reserved as a clean container package to implement non-visual gameplay state management (ECS, stats, movement logic, save-load serialization controllers). Currently empty.

### D. Missing / Planned Systems
*   **Character Sprites & Animation**: Player is rendered as a colored rectangle placeholder.
*   **Scene Transitions**: No system to switch between scenes at runtime.
*   **Dialog System**: No dialog trees, text boxes, or branching conversation UI.
*   **Save/Load**: No system to persist or restore runtime state.
*   **Scripting Engine**: No programmable event/action pipeline beyond built-in interaction callbacks.

---

## 3. Stability & Capability Audit

*   **Runtime Stability Level**: **Gameplay-Stable**. The compiler verification succeeds (0 errors), the boot lifecycle is robust, and the Arcade Physics pipeline runs at 60fps.
*   **Gameplay Capability**: **Basic Movement + Interaction**. A player entity spawns, moves with keyboard input, collides with wall tiles, and interacts with trigger/object entities. Camera follows the player. A live debug HUD displays runtime metrics.
*   **Editor Capability**: **None**. Projects cannot be visually edited yet; they must be written manually by editing raw `project.json` files.
