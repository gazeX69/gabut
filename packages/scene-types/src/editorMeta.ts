/**
 * Editor Metadata: UI state, undo/redo, collaboration
 * NOT loaded by runtime - editor-only data
 * Separated from gameplay data for clean architecture
 * @module scene-types/editorMeta
 */

/**
 * Camera state in editor view
 */
export interface VGZEditorCamera {
  /** X position (pixels) */
  x: number;

  /** Y position (pixels) */
  y: number;

  /** Zoom level (1.0 = 100%) */
  zoom: number;
}

/**
 * Scene change: Single undo/redo action
 * Used for change history and multiplayer sync
 */
export interface VGZSceneChange {
  /** Unique change identifier */
  id: string;

  /** Type of change */
  type: 'create' | 'update' | 'delete' | 'reorder' | 'modify-layer' | 'modify-asset';

  /** What was changed (entity ID, layer ID, etc) */
  target: string;

  /** Data before the change */
  before: any;

  /** Data after the change */
  after: any;

  /** When this change occurred (ISO timestamp) */
  timestamp: string;

  /** Who made this change (user ID, for multiplayer) */
  userId?: string;
}

/**
 * Undo/redo history
 */
export interface VGZSceneHistory {
  /** Past changes (for undo) */
  past: VGZSceneChange[];

  /** Future changes (for redo) */
  future: VGZSceneChange[];
}

/**
 * Collaboration metadata: Who modified what and when
 */
export interface VGZSceneCollaborationMeta {
  /** User ID of last modifier */
  userId: string;

  /** What entity/layer was last modified */
  targetId?: string;

  /** When it was modified (ISO timestamp) */
  timestamp: string;
}

/**
 * Editor Metadata: UI state, undo/redo history, collaboration info
 *
 * This field is NEVER loaded by the runtime.
 * It's editor-only state that helps with:
 * - UI persistence (camera position, selection)
 * - Undo/redo functionality
 * - Multiplayer collaboration tracking
 * - Conflict detection
 *
 * Separation ensures clean architecture:
 * - Runtime never sees editor state
 * - Saves are smaller (editor meta not included)
 * - No editor dependencies in gameplay code
 *
 * @example
 * {
 *   "selectedEntityIds": ["entity-tree-1"],
 *   "selectedLayerIds": ["layer-objects"],
 *   "camera": {
 *     "x": 512,
 *     "y": 384,
 *     "zoom": 1.0
 *   },
 *   "history": {
 *     "past": [...],
 *     "future": []
 *   },
 *   "lastModified": [
 *     {
 *       "userId": "user-123",
 *       "targetId": "entity-tree-1",
 *       "timestamp": "2026-05-21T10:00:00Z"
 *     }
 *   ]
 * }
 */
export interface VGZSceneEditorMeta {
  /** Currently selected entity IDs (for editor selection) */
  selectedEntityIds: string[];

  /** Currently selected layer IDs (for editor selection) */
  selectedLayerIds: string[];

  /** Camera state in editor view */
  camera: VGZEditorCamera;

  /** Undo/redo history (optional, only during editing) */
  history?: VGZSceneHistory;

  /** Collaboration: recent modifications (for multiplayer) */
  lastModified?: VGZSceneCollaborationMeta[];

  /** Custom editor state (extensible for plugins) */
  customState?: Record<string, any>;

  /** Schema version */
  version: 1;
}
