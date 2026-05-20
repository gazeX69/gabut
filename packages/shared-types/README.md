# @vgz/shared-types

Shared type definitions and serialization contracts for VGZ.

## Purpose

Defines the data structures for:
- Editor project creation and editing
- Runtime project loading and execution
- Save/load serialization
- Editor/Runtime data contracts

## What's Included

### VGZProject
Root project definition. Contains all scenes and project settings.

```typescript
import type { VGZProject } from '@vgz/shared-types'
```

### VGZScene
Playable scene definition. Contains map data and scene metadata.

```typescript
import type { VGZScene } from '@vgz/shared-types'
```

### VGZMap
Map/level definition. Contains tilemap data and entity placement.

```typescript
import type { VGZMap } from '@vgz/shared-types'
```

### VGZEntity
Serializable entity type. Represents NPCs, objects, triggers, props.

```typescript
import type { VGZEntity } from '@vgz/shared-types'
```

## What's NOT Included

This package contains **serialization contracts only**.

It does NOT include:
- Gameplay logic
- Behavior systems
- Event systems
- Save/load systems
- ECS components
- Runtime systems

For runtime systems, see `@vgz/engine-core`.

## Architecture Boundaries

**shared-types is consumed by:**
- Editor (for project structure)
- Runtime (for scene/entity loading)
- Save system (for serialization)

**shared-types must NOT:**
- Import from other packages
- Contain gameplay logic
- Depend on Phaser
- Depend on React
- Include system implementations

## Schema Versioning

All types include a `version` field for migration safety.

When making breaking changes:
1. Increment the version field
2. Document the change
3. Update save migration logic
4. Do NOT silently change structure

## Usage

### Editor
```typescript
import type { VGZProject } from '@vgz/shared-types'

// Create new project structure
const project: VGZProject = {
  id: 'project-1',
  settings: { /* ... */ },
  scenes: [],
  startSceneId: 'scene-1',
  version: 1
}
```

### Runtime
```typescript
import type { VGZProject } from '@vgz/shared-types'

// Load and consume project
async function loadProject(projectId: string): Promise<VGZProject> {
  const response = await fetch(`/projects/${projectId}.json`)
  return response.json()
}
```

## Contributing

When adding types:
- Keep them minimal
- Prefer explicit interfaces
- Add version fields
- Document edge cases
- Update this README
- Do NOT add gameplay logic

## File Structure

```
src/
  entity.ts      # VGZEntity definition
  map.ts         # VGZMap definition
  scene.ts       # VGZScene definition
  project.ts     # VGZProject definition
  index.ts       # Public exports
```
