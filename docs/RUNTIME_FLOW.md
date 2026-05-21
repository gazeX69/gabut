# Runtime Flow

This document details the initialization lifecycles, data validation stages, renderer startup steps, and error handling flows in the VGZ game engine.

---

## 1. Runtime Lifecycle Phases

The runtime boots using a state machine managed by `RuntimeBoot` (`apps/runtime/src/boot.ts`). The system progresses through the following phases:

```
                  ┌──────────────┐
                  │     IDLE     │
                  └──────┬───────┘
                         │
                         ▼
             ┌───────────────────────┐
             │    LOADING_PROJECT    │
             └───────────┬───────────┘
                         │
         ┌───────────────┴───────────────┐
         ▼ (Success)                     ▼ (Failure)
┌─────────────────┐              ┌───────────────┐
│  PROJECT_READY  │              │               │
└────────┬────────┘              │               │
         │                       │               │
         ▼                       │               │
┌─────────────────┐              │               │
│  LOADING_SCENE  │              │     ERROR     │
└────────┬────────┘              │   (Terminal)  │
         │                       │               │
         ▼ (Success)             │               │
┌─────────────────┐              │               │
│   SCENE_READY   │              │               │
└────────┬────────┘              │               │
         │                       │               │
         ▼ (Success)             │               │
┌─────────────────┐              └───────▲───────┘
│      READY      │                      │
│ (Boot Complete) ├──────────────────────┘
└─────────────────┘      (Failure)
```

1.  **`IDLE`**: Initial state on initialization.
2.  **`LOADING_PROJECT`**: Fetching the root JSON config file.
3.  **`PROJECT_READY`**: JSON successfully loaded and schema checks passed.
4.  **`LOADING_SCENE`**: Loading the active scene (defaults to `startSceneId`).
5.  **`SCENE_READY`**: Scene data located and map boundaries/layer arrays validated.
6.  **`READY`**: Bootstrap complete. Context generated and Phaser instance created.
7.  **`ERROR`**: Boot sequence aborted. Details the failing phase and root cause code.

---

## 2. Boot & Loader Sequence Details

### Step 1: Entrypoint Execution (`main.ts`)
*   `initializeRuntime()` triggers automatically on script load.
*   Instantiates `RuntimeBoot` with a config (`RuntimeBootConfig`).
*   Runs `RuntimeBoot.boot()`.

### Step 2: Project Loading & Schema Checks (`projectLoader.ts`)
The loader handles two modes defined by `options.source`:
*   **`url` source**:
    *   Initiates an HTTP `fetch` request.
    *   Utilizes an `AbortController` coupled to a timeout (default `5000`ms) to reject hanging requests.
*   **`json` source**:
    *   Consumes the passed JSON object directly (used for development and inline boots).
*   **Validations**:
    *   Ensures project is an object with required fields: `id` (string), `startSceneId` (string), `scenes` (array), `settings` (object), and `version` (number).
    *   Verifies `settings.title` (string), `settings.resolution.width` (number), `settings.resolution.height` (number), and `settings.tileSize` (number).
    *   Checks version equality: `version === 1`. Rejects older or newer formats with `VERSION_INCOMPATIBLE`.

### Step 3: Scene Parsing & Map Verification (`sceneLoader.ts`)
*   Retrieves the scene matching the requested `sceneId` (defaulting to the project's `startSceneId`).
*   Ensures the scene contains required fields: `id` (string), `name` (string), `version` (number), and `map` (object).
*   **Deep Map Verification**:
    *   Verifies map dimensions are positive: `width > 0` and `height > 0`.
    *   Ensures that `layers`, `entities`, and `tilesets` are arrays.
    *   Iterates through each layer to ensure it contains an `id` (string) and a `data` array.
    *   In the future, will verify that `layer.data.length` matches `width * height` exactly.

### Step 4: Phaser Startup
Once `RuntimeBoot` transitions to `READY`, `main.ts` retrieves the validated `RuntimeContext` and boots the Phaser instance:
1.  Sets canvas target container to `#game`.
2.  Applies screen resolution settings (`width` and `height`) from `RuntimeContext.config`.
3.  Hooks a start scene (`BootScene`) in Phaser.
4.  Launches Phaser's engine, executing `BootScene.create()`.

---

## 3. Error Propagation Flow

If any loading or validation stage fails, the process behaves as follows:

```
[Loader Failure]
      │
      ▼
Create LoadResult with Error Code (e.g. 'SCHEMA_MISMATCH', 'SCENE_NOT_FOUND')
      │
      ▼
RuntimeBoot catches error → sets phase to 'ERROR'
      │
      ▼
Records 'startedAt', 'completedAt', and calculates 'duration'
      │
      ▼
Dispatches 'onError(error)' callback to main runtime handler
      │
      ▼
main.ts logs failure and cancels Phaser initialization (canvas is NOT created)
```

### Actionable Error Payload Example:
```json
{
  "phase": "LOADING_SCENE",
  "code": "SCENE_NOT_FOUND",
  "message": "Scene not found: scene-2",
  "details": {
    "sceneId": "scene-2",
    "availableScenes": ["scene-start", "scene-combat"]
  }
}
```

---

## 4. Future Hot-Reload Architecture

The separation between data validation (`RuntimeBoot`) and rendering (Phaser canvas) creates a clean path for scene hot-reloading:

1.  **Editor-to-Runtime Event**: The visual editor sends updated scene/map JSON via a message bridge.
2.  **Runtime Interception**: A loader listener parses the incoming JSON and executes `loadScene` with validation checks.
3.  **Context Update**: If validation passes, `RuntimeBoot` updates its active `scene` memory.
4.  **Phaser Reset**: The runtime tells Phaser to restart the current scene, drawing the updated tile arrays and spawning modified entity sprites, without refreshing the browser page.
