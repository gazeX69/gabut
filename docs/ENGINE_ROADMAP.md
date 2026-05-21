# Engine Roadmap

This document outlines the sequential phases of development for the VGZ engine. The roadmap is structured according to strict technical dependencies rather than desired features.

---

## 1. Dependency Tree of Engine Milestones

A visual representation of the prerequisites for each milestone:

```
[Phase 1: Foundation & Boot] (Complete)
             │
             ▼
[Phase 2: Asset Pipeline] (Complete)
             │
             ▼
[Phase 3: Tilemap Rendering & Camera] (Completed)
             │
             ▼
[Phase 4: Spawner & Gameplay Core]
        ┌────┴────────────────────────┐
        ▼                             ▼
[Phase 5: Save & Serialization]  [Phase 6: React Visual Editor]
        │                             │
        └─────────────┬───────────────┘
                      ▼
[Phase 7: Plugins & Optimization]
```

---

## 2. Detailed Roadmap Phases

### Phase 1: Foundation & Boot (STATUS: COMPLETED)
*   **Focus**: Establish types, monorepo linkage, loaders, and boot state machinery.
*   **Deliverables**:
    *   `shared-types` and `runtime-types` packages.
    *   Validated project/scene JSON parser.
    *   State machine transition engine (`RuntimeBoot`).
    *   Basic Phaser project bindings with dynamic canvas creation.

### Phase 2: Phaser Asset Pipeline (STATUS: COMPLETED)
*   **Prerequisite**: Phase 1 (requires validated project JSON coordinates).
*   **Focus**: Load graphic files dynamically before rendering the canvas.
*   **Tasks**:
    *   [x] Build a Phaser-based asset loading script.
    *   [x] Read `VGZMap.tilesets` and request the target assets (e.g. loading `grass.png` from `projects/demo-project/assets/tilesets/grass.json`).
    *   [ ] Load character spritesheets and prop textures dynamically.

### Phase 3: Tilemap Rendering & Camera Control (STATUS: COMPLETED)
*   **Prerequisite**: Phase 2 (requires loaded textures).
*   **Focus**: Render the tile arrays on screen.
*   **Tasks**:
    *   [x] Read layers array (`VGZMap.layers`).
    *   [x] Build a parser to load data arrays (1D tile indices) into Phaser Tilemap layers.
    *   [x] Implement layer-specific drawing (Terrain layer, Collision layer, Decoration layer).
    *   [x] Configure Phaser Camera modes (`fixed` or `follow` player) based on scene metadata.

### Phase 4: Actor Spawner & Gameplay Core (STATUS: PARTIAL)
*   **Prerequisite**: Phase 3 (requires visual layout canvas).
*   **Focus**: Instantiate interactable objects and initialize the gameplay loop.
*   **Tasks**:
    *   [ ] Establish `@vgz/engine-core` package.
    *   [x] Spawn character sprites for items in `VGZMap.entities` matching their coordinate data, scale, rotation, and Z-orders.
    *   [x] Apply player input controllers (keyboard / gamepad virtual bindings).
    *   [x] Bind collision geometry using Phaser's arcade physics or custom bounding boxes against layers marked as `type: 'collision'`.

### Phase 5: State Serialization & Save/Load (STATUS: PLANNED)
*   **Prerequisite**: Phase 4 (requires mutable actors).
*   **Focus**: Keep track of and save the game state.
*   **Tasks**:
    *   Define `VGZSaveState` schema in `shared-types` (activeScene, position, quest states, item inventories).
    *   Implement standard file operations to write/read save game configurations to the filesystem.

### Phase 6: React Visual Editor Development (STATUS: PLANNED)
*   **Prerequisite**: Phase 4 (requires functional engine canvas).
*   **Focus**: Build the Visual Designer Tooling.
*   **Tasks**:
    *   Implement user interface panels in `apps/editor` using React (Tileset selector, map drawing tool, Entity inspector).
    *   Create an `iframe` bridge between the editor UI and the runtime window.
    *   Build a JSON compiler to write visual modifications back to the local `project.json` file.
    *   Add hot-reloading support so that clicking "Edit" immediately changes Phaser rendering in real-time.

### Phase 7: Plugin System & Optimization (STATUS: PLANNED)
*   **Prerequisite**: Phases 5 & 6.
*   **Focus**: Performance tuning and modular expansion interfaces.
*   **Tasks**:
    *   Define the engine plugin lifecycle interface (`onBoot`, `onSceneLoad`, `onEntitySpawn`).
    *   Optimize tile rendering using frustum culling.
    *   Bundle asset files to compress overall game size.
