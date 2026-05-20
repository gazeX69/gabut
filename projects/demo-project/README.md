# Demo Project

Minimal VGZ demo project for runtime loading and validation.

## Project Structure

```
demo-project/
├── project.json          # Root project definition (VGZProject)
├── assets/
│   └── tilesets/         # Tileset assets and metadata
│       └── grass.json    # Grass tileset configuration
├── scenes/               # Scene data (optional, can be inline)
└── maps/                 # Map data (optional, can be inline)
```

## Project Details

- **Title**: VGZ Demo Project
- **Resolution**: 1024x768
- **Tile Size**: 32x32 pixels
- **Starting Scene**: scene-start

## Scenes

### scene-start
Entry scene for the demo project.

Map: Demo Map (20x15 tiles)
- Terrain layer with grass tiles
- Spawn point at (10, 10)
- Welcome sign object at (10, 8)
- Entrance trigger at (10, 12)

## Assets

### Tilesets

#### Grass Tileset
- File: `assets/tilesets/grass.json`
- Tile Size: 32x32 pixels
- Grid: 16x16 (256 tiles)
- Tiles: empty (0), grass (1), water (2)

## Runtime Usage

```typescript
import { RuntimeBoot } from '@vgz/runtime/boot'

const boot = new RuntimeBoot({
  projectSource: 'url',
  projectData: '/projects/demo-project/project.json'
})

const result = await boot.boot()
if (result.success) {
  const context = boot.getContext()
  // context.project.settings.title === 'VGZ Demo Project'
  // context.scene.name === 'Starting Area'
}
```

## Development Notes

- This is a minimal valid project for testing runtime loading
- All JSON matches shared-types schema exactly
- No actual image assets, only metadata
- Ready for editor integration once editor is built
- Ready for gameplay system integration
