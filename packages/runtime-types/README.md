# @vgz/runtime-types

Runtime lifecycle type definitions for VGZ.

Defines the contracts for:
- Project loading
- Scene loading
- Boot orchestration
- Runtime context

## What's Included

### Loader Types
Safe project and scene loading contracts.

```typescript
import type { 
  LoadResult,
  ProjectLoadOptions,
  SceneLoadOptions 
} from '@vgz/runtime-types/loader'
```

### Boot Types
Runtime initialization lifecycle.

```typescript
import type { 
  RuntimePhase,
  RuntimeBootState,
  RuntimeBootConfig,
  RuntimeBootResult,
  RuntimeContext 
} from '@vgz/runtime-types/boot'
```

## What's NOT Included

This package contains **lifecycle contracts only**.

It does NOT include:
- Gameplay logic
- Behavior systems
- Event systems
- ECS components
- Rendering logic
- Animation systems
- Combat systems

For gameplay systems, see `@vgz/engine-core`.
For runtime implementation, see `apps/runtime`.

## Usage

### Runtime Boot Flow

```typescript
import type { RuntimeBootConfig } from '@vgz/runtime-types'

const config: RuntimeBootConfig = {
  projectSource: 'url',
  projectData: '/projects/game-1.json',
  sceneId: 'start',
  validate: true,
  timeout: 5000
}

// Boot orchestrates: Load Project → Load Scene → Ready
```

### Load Result Pattern

```typescript
import type { LoadResult } from '@vgz/runtime-types'

interface Result extends LoadResult<T> {
  if (result.success) {
    // result.data is available
    useData(result.data)
  } else {
    // result.error is available
    handleError(result.error)
  }
}
```

## Architecture Boundaries

**runtime-types is consumed by:**
- Runtime app (initialization and lifecycle)
- Gameplay systems (context after boot)

**runtime-types must NOT:**
- Import from gameplay packages
- Contain gameplay logic
- Depend on Phaser
- Depend on React

## Contributing

When adding types:
- Keep them minimal
- Focus on lifecycle contracts
- Update this README
- Do NOT add gameplay logic
- Ensure @vgz/shared-types purity

## File Structure

```
src/
  loader.ts    # Project/scene loading types
  boot.ts      # Boot orchestration types
  index.ts     # Public exports
```
