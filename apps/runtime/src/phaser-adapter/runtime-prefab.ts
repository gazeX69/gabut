export interface PrefabTemplate {
  id: string;
  name: string;
  assetId: string;
  entityType: 'npc' | 'prop' | 'interactive' | 'decoration';
  defaultTransform: {
    scaleX: number;
    scaleY: number;
    zOrder: number;
  };
  collision?: {
    solid: boolean;
    bodySize?: { width: number; height: number };
    bodyOffset?: { x: number; y: number };
  };
  animation?: {
    clipId: string;
    playing: boolean;
  };
  interactive?: boolean;
}

export const DEMO_PREFABS: Record<string, PrefabTemplate> = {
  'hero': {
    id: 'hero',
    name: 'Hero Character',
    assetId: 'hero',
    entityType: 'npc',
    defaultTransform: { scaleX: 1, scaleY: 1, zOrder: 10 },
    collision: { solid: true, bodySize: { width: 16, height: 16 }, bodyOffset: { x: 8, y: 16 } },
    animation: { clipId: 'hero-idle', playing: true }
  },
  'chest': {
    id: 'chest',
    name: 'Treasure Chest',
    assetId: 'chest',
    entityType: 'interactive',
    defaultTransform: { scaleX: 1, scaleY: 1, zOrder: 5 },
    collision: { solid: true },
    interactive: true
  },
  'wall': {
    id: 'wall',
    name: 'Brick Wall',
    assetId: 'wall',
    entityType: 'prop',
    defaultTransform: { scaleX: 1, scaleY: 1, zOrder: 5 },
    collision: { solid: true }
  },
  'tree': {
    id: 'tree',
    name: 'Oak Tree',
    assetId: 'tree',
    entityType: 'decoration',
    defaultTransform: { scaleX: 1, scaleY: 1, zOrder: 15 },
    collision: { solid: true, bodySize: { width: 16, height: 8 }, bodyOffset: { x: 8, y: 24 } }
  }
};
