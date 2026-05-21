# Module Boundaries & Architecture Rules

This document outlines the strict boundaries, forbidden coupling, dependency restrictions, and planned extension points for packages within the VGZ monorepo.

---

## 1. Package Responsibilities

Each package in the monorepo must have a single, well-defined responsibility:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          APPLICATIONS (RUNNERS)                         │
│                                                                         │
│  @rpg-maker-vgz/runtime                 @vgz/editor [Placeholder]       │
│  - Phaser canvas & rendering            - React web-based creator UI    │
│  - Dynamic scene transitions            - Visual layout configuration   │
│  - Input/audio bindings                 - Project JSON generator        │
└───────────────────┬─────────────────────────────────┬───────────────────┘
                    │                                 │
                    │ (Imports lifecycle/data types)  │ (Imports data types)
                    ▼                                 ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────┐
│        @vgz/runtime-types             │ │       @vgz/shared-types       │
│  - Boot & loader phase models         │ │  - Serializable data schemas  │
│  - Lifecycle context interfaces       │ │  - Project & Entity contracts │
│  - Success/Failure results models     │ │  - Save-state templates       │
└───────────────────┬───────────────────┘ └───────────────────────────────┘
                    │                                 ▲
                    │ (Imports data schemas)          │ (Imports data schemas)
                    └─────────────────────────────────┘
```

*   **`@vgz/shared-types` (Contracts Leaf)**: The single source of truth for raw data structures. Used for project serialization and IPC communication.
*   **`@vgz/runtime-types` (Lifecycle Leaf)**: Defines the phases, loaders, and bootstrap boundaries. Bridges data states with runtime engines.
*   **`@vgz/engine-core` (Gameplay Core - Planned)**: Responsible for physics coordinates updates, inventory state modifications, stats tracking, and quest progression calculations. Must be platform-agnostic.
*   **`@rpg-maker-vgz/runtime` (Visual Runner)**: Resolves paths, renders tilesets, initializes Phaser, and binds graphics.
*   **`@vgz/editor` (Visual Editor)**: React UI workspace for layout creation. Does not interfere with runtime loops.

---

## 2. Dependency Rules & Verification

To prevent circular dependencies and compilation loops, follow these rules:

1.  **Shared Purity**: `@vgz/shared-types` is a pure leaf. It is forbidden to import from any other package in the monorepo.
2.  **Runtime Types Boundary**: `@vgz/runtime-types` can import only from `@vgz/shared-types`.
3.  **Core Boundary**: `@vgz/engine-core` can import from `shared-types` (and optionally `runtime-types` for boot parameters). It must not import from Phaser or `@rpg-maker-vgz/runtime`.
4.  **No Downward Imports**: Packages must never import anything from the `apps/` directory.

---

## 3. Forbidden Coupling (Critical Constraints)

To preserve scalability and allow CLI compilation or headless execution, the following coupling is strictly forbidden:

### A. No Phaser Imports in Core Packages
Phaser is a large, client-side rendering library. It must never be imported in `@vgz/shared-types`, `@vgz/runtime-types`, or `@vgz/engine-core`.
*   **Why**: Doing so would prevent running core logic in Node.js (for headless testing, map validation scripts, or multiplayer servers).
*   **Correction**: If a data structure requires layout dimensions, represent them as simple numbers (`x`, `y`, `width`, `height`) rather than Phaser vector classes.

### B. No Environment/DOM Assumptions in Packages
Packages must not reference browser-only elements (`window`, `document`, `HTMLElement`).
*   **Why**: Code in packages must be compile-safe in headless runner modes (such as unit tests or server environments).
*   **Correction**: Keep loaders environment-agnostic. `projectLoader.ts` accepts a custom fetch handler or parses raw JSON objects directly.

---

## 4. Future Plugin System Boundary

To support modular additions (such as custom gameplay mechanics or plugins) without modifying engine-core code, a clear extension interface will be established:

1.  **Plugin Configuration**:
    *   Defined in `@vgz/shared-types` via a metadata array in `project.json` (e.g. `plugins: [{ id: "weather-system", settings: { rainDensity: 0.5 } }]`).
2.  **Lifecycle Hooks**:
    *   Plugins will implement a standard interface containing lifecycle hooks:
        ```typescript
        interface VGZPlugin {
          onBoot(context: RuntimeContext): void;
          onSceneLoad(scene: VGZScene): void;
          onEntitySpawn(entity: VGZEntity, sprite: unknown): void;
          onTick(delta: number): void;
        }
        ```
3.  **Isolation**:
    *   Plugins run within sandboxed system ticks. They receive the current `RuntimeContext` and state data, but cannot write directly to internal variables without going through authorized API gateways.
