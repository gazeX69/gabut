# Architecture Map

This document maps out the current architecture of the VGZ game engine, detailing the monorepo structure, dependency graph, runtime orchestration, and integration boundaries.

---

## 1. Monorepo Structure & Package Ownership

The repository is configured as a monorepo using **pnpm workspaces**. The responsibility of each directory is separated cleanly:

```
rpg-maker-vgz/
├── apps/
│   ├── runtime/             # Phaser runtime application (Vite + TypeScript)
│   └── editor/              # [Placeholder] React editor application
├── packages/
│   ├── shared-types/        # Serializable data contracts (Project, Scene, Map, Entity)
│   ├── runtime-types/       # Lifecycle & boot state types
│   └── engine-core/         # [Placeholder] Intended for core gameplay systems
├── projects/
│   └── demo-project/        # Example project JSON configs & assets metadata
└── docs/                    # Engine architectural documentation
```

### Module Ownership:
*   **`@vgz/shared-types`**: Owns data serialization contracts. Crucial for ensuring that save files, project JSONs, and editor data match the same schemas. It must not depend on any rendering libraries (e.g., Phaser) or framework runtimes.
*   **`@vgz/runtime-types`**: Owns state definitions for the bootstrap process and loader results. It is the type foundation for booting the engine on any platform.
*   **`@rpg-maker-vgz/runtime`**: Owns the platform execution layer. Currently implemented as a Phaser-based browser runtime. Responsible for orchestrating the boot sequence and rendering the game map.
*   **`@vgz/editor`**: [Placeholder] Will own the React-based visual editor interface, allowing layout creation and exporting projects conforming to `@vgz/shared-types`.
*   **`@vgz/engine-core`**: [Planned] Will own non-rendering gameplay systems (e.g., ECS, state propagation, systems tick loop).

---

## 2. Dependency Direction

To prevent circular dependencies and high coupling, the monorepo strictly enforces a one-way dependency chain:

```
┌───────────────────────────────────────┐
│          @rpg-maker-vgz/runtime       │
└──────────────────┬───────────┬────────┘
                   │           │
                   │ (boot/load│ (data schemas)
                   │  contracts│
                   ▼           ▼
┌──────────────────────┐   ┌──────────────────────┐
│  @vgz/runtime-types  │──→│  @vgz/shared-types   │
└──────────────────────┘   └──────────────────────┘
                               ▲
                               │ (data schemas)
┌──────────────────────┐       │
│      @vgz/editor     ├───────┘
│     [Placeholder]    │
└──────────────────────┘
```

*   **Rule 1**: `@vgz/shared-types` must remain a leaf node. It cannot import from any other package in the monorepo.
*   **Rule 2**: `@vgz/runtime-types` can import *only* from `@vgz/shared-types`.
*   **Rule 3**: `@rpg-maker-vgz/runtime` imports from both `runtime-types` and `shared-types` to load and boot projects.
*   **Rule 4**: Neither shared nor runtime packages can import from `@rpg-maker-vgz/runtime` or Phaser. Phaser is completely confined to the runtime app layer.

---

## 3. Runtime Core & Loader Flow

The engine runtime is built as a data-driven lifecycle that validates configuration schemas prior to initializing the graphic renderer.

### Loading Flow:
1.  **Project Initialization**:
    *   `RuntimeBoot` initiates the boot process.
    *   `loadProject` reads the `project.json` config (either via a URL request or directly from a JSON object).
    *   `validateProjectSchema` checks the structure (presence of `id`, `startSceneId`, `scenes`, `version`, `settings`).
    *   Version check ensures the project is `version === 1`.
2.  **Scene & Map Resolution**:
    *   `loadScene` matches the requested `sceneId` with `VGZProject.scenes`.
    *   `validateScene` verifies that scene metadata is correct.
    *   `validateMap` runs deep validation on map size, layers structure, layer size (`width * height`), tilesets, and entities.
3.  **Boot Completion & Phaser Startup**:
    *   A `RuntimeContext` is assembled, locking down the validated project data, active scene configuration, and screen resolution settings.
    *   Phaser's game configuration is constructed using this context, and `initializePhaserWithScene()` starts the Phaser canvas.

---

## 4. Shared Types Data Flow

The `shared-types` package acts as the schema registry. Here is how data models relate to each other:

```
 VGZProject
  ├── settings (resolution, tileSize, title, description, author)
  ├── startSceneId (string pointer)
  └── scenes (Array of VGZScene)
       └── VGZScene
            ├── metadata (cameraMode, cameraPosition)
            └── map (VGZMap)
                 ├── width, height, spawn, backgroundColor
                 ├── tilesets (Array of VGZMapTileset: id, name, assetPath, tile dimensions)
                 ├── layers (Array of VGZMapLayer: id, name, type, data array)
                 └── entities (Array of VGZEntity: id, name, type, position, scale, rotation)
```

---

## 5. Editor Status

The visual editor (`apps/editor`) is in a **placeholder state**.
*   **Current state**: Minimal Vite + React application setup containing only a single template component (`App.tsx`).
*   **Integration boundary**: There is currently no active connection, bridge, or IPC (Inter-Process Communication) established between `apps/editor` and `apps/runtime`.
*   **Target interaction**: The editor is planned to load and modify the `project.json` structure, serving it to the runtime (running in an `iframe` or separate process) for hot-reloading and visual playtesting.

---

## 6. Future Extension Points

1.  **Phaser Asset Pipeline**:
    *   The `RuntimeContext` exposes tilesets with an `assetPath` (e.g. `projects/demo-project/assets/tilesets/grass`).
    *   An Asset Loader must be built in Phaser's preload lifecycle to parse these paths, load the actual tileset PNG images, and construct tilemap images dynamically.
2.  **Entity Spawning & ECS**:
    *   Phaser currently renders a static text string.
    *   A Spawner System must read `VGZMap.entities` from the context and instantiate the corresponding sprites, applying their scale, rotation, and z-order.
3.  **Visual Editor Data Bridge**:
    *   Define postMessage API schemas in `@vgz/shared-types` so the React editor can send direct scene updates to the Phaser runtime in real-time.
