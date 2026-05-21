# Active Bug & Risk Watchlist

This document tracks identified architectural vulnerabilities, scalability limits, and potential failure points within the current game engine setup.

---

## 1. Lifecycle & Bootstrap Risks

### A. Phase Desynchronization on Scene Change
*   **Vulnerability**: Currently, `main.ts` initializes the `RuntimeBoot` orchestrator, receives a `RuntimeContext`, and starts Phaser (`initializePhaserWithScene`). However, Phaser scene changes (e.g., transitioning from `SceneA` to `SceneB`) are handled within Phaser scenes directly.
*   **Risk**: Bypassing `RuntimeBoot` during in-game scene transitions causes `RuntimeBootState` to remain stuck on the starting scene context. The data state desynchronizes, leading to potential crashes in systems relying on `RuntimeContext`.
*   **Mitigation Target**: Develop a central runtime event listener. Scene transition requests should trigger a partial reload through `SceneLoader`, update the `RuntimeBoot` context, and then trigger the Phaser scene swap.

### B. High Network Latency & Timeout Failure
*   **Vulnerability**: The project loader uses fetch requests with a default timeout limit of `5000`ms.
*   **Risk**: If a mobile network suffers from high latency, the project boot immediately errors out, leaving a blank canvas. There is no automatic retry mechanism or fallback.
*   **Mitigation Target**: Add a retry counter inside the project loader and provide a pre-boot UI loading view.

---

## 2. Resource & Coupling Risks

### A. Missing Asset File Format Resolution
*   **Vulnerability**: Tilesets define paths like `projects/demo-project/assets/tilesets/grass` without explicit file extensions (such as `.png` or `.json`).
*   **Risk**: When the asset pipeline is implemented, loader scripts might assume hardcoded extensions, breaking cases where tilesets use alternative graphic formats.
*   **Mitigation Target**: Update the tileset schema to include explicit image types, or require a standard directory search.

### B. Phaser Hard-Coupling in Runner Application
*   **Vulnerability**: Phaser classes are loaded and instanced directly inside the runner entry point (`main.ts`).
*   **Risk**: Upgrading Phaser versions or migrating to a different renderer (such as PixiJS or a native app canvas) will require rewriting the engine entry point.
*   **Mitigation Target**: Keep Phaser game instantiation strictly inside isolated script components, calling them through a generic `Renderer` interface.

---

## 3. Memory & Performance Risks

### A. Phaser Canvas Leaks on Vite Dev Hot-Reload
*   **Vulnerability**: In development mode, Vite hot-swaps code changes, triggering re-execution of `main.ts` without destroying previous Phaser instances.
*   **Risk**: Multiple canvas elements, WebGL rendering contexts, and audio systems remain active in the browser tab, leading to performance degradation and page crashes.
*   **Mitigation Target**: Keep a reference to the active `Phaser.Game` instance in a window property. Before booting a new game, invoke `game.destroy(true)` to release textures and sound channels.

### B. Unchecked Array Allocations on JSON Parsing
*   **Vulnerability**: Map layer tile indices are serialized as a flat 1D array (`number[]`) directly inside JSON.
*   **Risk**: Large maps (e.g., 200x200 tiles across 5 layers) produce configurations with hundreds of thousands of integers. Loading these blocks blocks JavaScript's main thread during the boot validation stage, causing frame drop issues.
*   **Mitigation Target**: Establish map dimension limits (e.g. max 100x100 tiles per layer), or implement tile chunking/binary encoding.

---

## 4. Visual Editor Integration Risks

### A. Data Desynchronization across iframe IPC boundaries
*   **Vulnerability**: The planned visual editor and game runner are separate web applications. Communication will utilize `window.postMessage`.
*   **Risk**: Edits made in the editor panel (e.g., placing tiles, repositioning actors) must synchronize with the game runtime frame rates. Message race conditions can corrupt runtime states.
*   **Mitigation Target**: Implement an transaction-based state update system where modifications require confirmation handshakes between both windows.
