# Future Runtime Roadmap

**Date**: May 21, 2026  
**Current Phase**: Phase 4 (Complete) → Phase 5 (Ready to Start)  
**Outlook**: Multi-phase gameplay extension plan

---

## Executive Summary

The VGZ runtime has completed foundational work and is ready for extended gameplay features. The roadmap spans **5 additional phases** (Phases 5-9) focusing on:

1. **Phase 5**: Save/Load persistence
2. **Phase 6**: Visual editor for content creation
3. **Phase 7**: Extended gameplay systems
4. **Phase 8**: AI and advanced mechanics
5. **Phase 9**: Multiplayer & networking (deferred)

**Timeline**: 12-16 weeks to full featured engine

---

## Phase 5: Save/Load Serialization

**Focus**: Enable runtime state persistence across game sessions  
**Duration**: 2 weeks  
**Trigger**: After Phase 4 complete  

### Deliverables

| Component | Complexity | Details |
|-----------|-----------|---------|
| **Snapshot API** | ✅ Low | `buildRuntimeSnapshot()`, `applyRuntimeSnapshot()` |
| **Save Format** | ✅ Low | JSON structure for runtime state |
| **Player Progress** | ✅ Medium | Track quests, inventory, stats |
| **Game State** | ✅ Medium | Entity positions, component data |
| **Undo/Redo** | ❌ High | Deferred to Phase 9+ |
| **Cloud Save** | ❌ High | Deferred to Phase 9+ |

### Minimum Viable Features

```typescript
// Save game to localStorage
const snapshot = buildRuntimeSnapshot(mountedScene)
localStorage.setItem('save-1', JSON.stringify(snapshot))

// Load game from localStorage
const saveData = JSON.parse(localStorage.getItem('save-1'))
const result = applyRuntimeSnapshot(mountedScene, saveData)
if (result.success) {
  console.log('Game restored!')
}

// Scene data persistence
// - Player position & velocity
// - Entity positions & states
// - Component runtime data
// - UI element states
// - Audio playback state
```

### New Types Required

```typescript
// @vgz/shared-types additions
export interface RuntimeGameSave {
  version: 1
  timestamp: string
  projectId: string
  sceneId: string
  playerPosition: { x, y }
  entities: RuntimeEntitySave[]
  components: Record<string, Record<string, unknown>>
}

export interface RuntimeEntitySave {
  entityId: string
  position: { x, y }
  rotation: number
  scale: { x, y }
  runtimeData: Record<string, unknown>
}
```

### Implementation Path

1. **Week 1**: Extend snapshot system for full state capture
2. **Week 1**: Add save/load endpoints to UI layer
3. **Week 2**: Test persistence across scene transitions
4. **Week 2**: Verify snapshot version compatibility

### Acceptance Criteria

```
[ ] Can save game to localStorage
[ ] Can load game from localStorage
[ ] Player position persists
[ ] Entity states persist
[ ] Component data persists
[ ] UI states can be saved
[ ] Audio state can be saved
[ ] Save format is human-readable JSON
[ ] Version mismatch handled gracefully
[ ] No memory leaks after load/save cycle
```

### Architecture Impact: MINIMAL ✅

- Uses existing snapshot system (already implemented)
- No Phaser coupling (pure data serialization)
- Immutable data safe to serialize
- Mutable data already snapshotted

---

## Phase 6: Visual Editor

**Focus**: React-based project/scene editor for non-programmers  
**Duration**: 3 weeks  
**Trigger**: After Phase 5 complete (or parallel)  

### Deliverables

| Component | Complexity | Details |
|-----------|-----------|---------|
| **Project Settings UI** | ✅ Low | Modify resolution, tileSize, title |
| **Scene Layout Editor** | ✅ Medium | Drag-place entities, adjust positions |
| **Tileset Picker** | ✅ Medium | Visual tileset selector, collision layer editor |
| **Entity Inspector** | ⚠️ Medium | Edit entity properties, attach components |
| **Layer Manager** | ✅ Low | Show/hide layers, reorder z-order |
| **Preview Window** | ⚠️ High | Live preview of scene in runtime |
| **Asset Manager** | ❌ High | Upload/organize sprites, tilesets |
| **Undo/Redo** | ❌ High | Deferred |

### Architecture

```
React Editor (apps/editor)
  │
  ├─ ProjectSettings (edit project.json)
  ├─ SceneEditor
  │  ├─ Canvas (visual layout)
  │  ├─ LayerPanel (layer visibility/order)
  │  ├─ EntityInspector (properties)
  │  └─ TilesetPicker (terrain selection)
  ├─ AssetLibrary (manage files)
  │
  └─ Bridge to Runtime
     ├─ postMessage IPC
     ├─ Send scene JSON
     └─ Receive preview updates

Runtime Preview (iframe or separate process)
  │
  ├─ Load editor-sent scene JSON
  ├─ Render in Phaser
  ├─ Send metrics back to editor
  └─ Respond to live edits
```

### Implementation Path

1. **Week 1**: Project settings UI, file I/O
2. **Week 2**: Scene canvas with drag-drop entity placement
3. **Week 3**: Layer/tileset picker, asset management, live preview

### Acceptance Criteria

```
[ ] Can create new project
[ ] Can edit project settings
[ ] Can add scenes
[ ] Can place entities on map
[ ] Can select tileset for terrain
[ ] Can mark collision tiles
[ ] Can export to project.json
[ ] Live preview shows changes
[ ] Can import existing project.json
[ ] No data loss on reload
```

### Architecture Impact: MEDIUM ⚠️

- Adds React app (separate from runtime)
- Requires IPC bridge (postMessage)
- Runtime needs to accept live JSON updates
- No changes to core runtime needed

---

## Phase 7: Extended Gameplay Systems

**Focus**: Add depth to gameplay with animation, dialog, inventory  
**Duration**: 4 weeks  
**Trigger**: After Phases 5-6  

### Deliverables

| Component | Complexity | Estimated |
|-----------|-----------|-----------|
| **Sprite Animation** | ⚠️ Medium | Frame-based sprite playback |
| **Dialog System** | ⚠️ Medium | Text boxes, NPC conversations |
| **Inventory System** | ⚠️ Medium | Item collection, management |
| **Quest System** | ⚠️ High | Quest tracking, objectives |
| **Particle Effects** | ❌ High | Deferred to Phase 8 |
| **Music Crossfading** | ✅ Low | Fade between tracks |
| **Sound Triggers** | ✅ Low | Play audio on events |

### Sprite Animation Example

```typescript
export class AnimatedSpriteComponent implements RuntimeComponent {
  id = 'animated-sprite'
  type = 'animated-sprite'
  runtimeData = {
    frames: ['sprite-frame-0', 'sprite-frame-1', 'sprite-frame-2'],
    currentFrame: 0,
    frameTime: 100,
    elapsedMs: 0
  }

  onUpdate(deltaMs: number) {
    this.runtimeData.elapsedMs += deltaMs
    
    if (this.runtimeData.elapsedMs >= this.runtimeData.frameTime) {
      this.runtimeData.elapsedMs = 0
      this.runtimeData.currentFrame = 
        (this.runtimeData.currentFrame + 1) % this.runtimeData.frames.length
      
      const frame = this.runtimeData.frames[this.runtimeData.currentFrame]
      this.mountedEntity?.phaserObject.setTexture(frame)
    }
  }
}
```

### Dialog System Design

```typescript
interface DialogNode {
  id: string
  text: string
  speaker: string
  options?: DialogChoice[]
  onComplete?: () => void
}

interface DialogChoice {
  text: string
  next: string  // Next dialog node ID
  condition?: () => boolean
}

// Usage:
const dialog = new DialogManager(uiLayer)
dialog.show({
  id: 'greeting',
  text: 'Hello, traveler!',
  speaker: 'NPC',
  options: [
    { text: 'Hello', next: 'response-1' },
    { text: 'Goodbye', next: 'response-2' }
  ]
})
```

### Implementation Path

1. **Week 1**: Sprite animation component system
2. **Week 2**: Dialog system UI and manager
3. **Week 3**: Inventory system (items, slots)
4. **Week 4**: Quest system (tracking, objectives)

### Acceptance Criteria

```
[ ] Sprites animate smoothly
[ ] Animations can be triggered by events
[ ] Dialog boxes display text
[ ] NPC conversations work
[ ] Player can select dialog options
[ ] Inventory items display
[ ] Items can be added/removed
[ ] Quests can be started/completed
[ ] Quest state persists across saves
```

### Architecture Impact: MEDIUM ⚠️

- New component types (AnimatedSprite, Dialog, Inventory)
- New systems (DialogManager, InventoryManager, QuestManager)
- Component lifecycle extended (onAttach for UI setup)
- No changes to core runtime needed

---

## Phase 8: AI & Advanced Mechanics

**Focus**: NPC behavior, pathfinding, advanced physics  
**Duration**: 4 weeks  
**Trigger**: After Phase 7  

### Deliverables

| Component | Complexity | Estimated |
|-----------|-----------|-----------|
| **Pathfinding (A\*)** | ⚠️ High | Navigation mesh, grid-based pathing |
| **NPC Behavior** | ⚠️ High | State machine for NPC actions |
| **Combat System** | ⚠️ High | Damage, health, stat calculation |
| **Particle Effects** | ⚠️ Medium | Visual effects spawner |
| **Destructible Objects** | ✅ Low | Breakable tiles/entities |
| **Teleporters** | ✅ Low | Warp zones |

### Pathfinding Example

```typescript
export class WanderingAIComponent implements RuntimeComponent {
  id = 'wandering-ai'
  type = 'wandering-ai'
  runtimeData = {
    targetX: 0,
    targetY: 0,
    path: [] as Array<{ x, y }>,
    speed: 60,
    updateIntervalMs: 500,
    elapsedMs: 0
  }

  onUpdate(deltaMs: number) {
    this.runtimeData.elapsedMs += deltaMs

    // Update path every 500ms
    if (this.runtimeData.elapsedMs >= this.runtimeData.updateIntervalMs) {
      this.runtimeData.elapsedMs = 0
      
      // Recalculate path to player
      const playerPos = { x: player.x, y: player.y }
      this.runtimeData.path = findPath(
        { x: this.mountedEntity!.phaserObject.x, y: this.mountedEntity!.phaserObject.y },
        playerPos,
        collisionMap
      )
    }

    // Follow path
    if (this.runtimeData.path.length > 0) {
      const next = this.runtimeData.path[0]
      const dx = next.x - this.mountedEntity!.phaserObject.x
      const dy = next.y - this.mountedEntity!.phaserObject.y
      const dist = Math.hypot(dx, dy)

      if (dist < 5) {
        this.runtimeData.path.shift()
      } else {
        const speed = this.runtimeData.speed * (deltaMs / 1000)
        this.mountedEntity!.phaserObject.x += (dx / dist) * speed
        this.mountedEntity!.phaserObject.y += (dy / dist) * speed
      }
    }
  }
}
```

### NPC Behavior State Machine

```typescript
enum NPCState {
  IDLE = 'idle',
  WANDERING = 'wandering',
  CHASING = 'chasing',
  ATTACKING = 'attacking',
  FLEEING = 'fleeing'
}

export class NPCBehaviorComponent implements RuntimeComponent {
  runtimeData = {
    state: NPCState.IDLE,
    sightRange: 200,
    attackRange: 50,
    health: 100,
    lastStateChange: 0
  }

  onUpdate(deltaMs: number) {
    const player = this.getNearestPlayer()
    const distance = this.getDistance(player)

    // State transitions
    if (distance < this.runtimeData.attackRange) {
      this.setState(NPCState.ATTACKING)
    } else if (distance < this.runtimeData.sightRange) {
      this.setState(NPCState.CHASING)
    } else {
      this.setState(NPCState.WANDERING)
    }

    // State behaviors
    switch (this.runtimeData.state) {
      case NPCState.IDLE:
        // Do nothing
        break
      case NPCState.WANDERING:
        // Random movement
        break
      case NPCState.CHASING:
        // Chase player
        break
      case NPCState.ATTACKING:
        // Deal damage
        break
    }
  }
}
```

### Implementation Path

1. **Week 1**: Pathfinding (A* algorithm)
2. **Week 2**: NPC behavior state machine
3. **Week 3**: Combat system (damage, health)
4. **Week 4**: Effects (particles, destructibles)

### Acceptance Criteria

```
[ ] NPCs can navigate around obstacles
[ ] Pathfinding completes in <10ms
[ ] NPC states transition smoothly
[ ] Combat damage applies correctly
[ ] Health decreases on hit
[ ] Particles spawn and fade
[ ] Destructible objects break on impact
[ ] No performance degradation
```

### Architecture Impact: MEDIUM ⚠️

- New advanced components (AI, Combat, Effects)
- New helper systems (Pathfinding, Behavior Tree)
- Spatial indexing for nearby entity queries
- No changes to core runtime needed

---

## Phase 9: Multiplayer & Networking (DEFERRED)

**Focus**: Multiplayer support, state synchronization  
**Estimated Duration**: 6 weeks  
**Status**: ⏳ DEFERRED (post-Phase 8)  

### Planned Components

- Real-time state sync (WebSocket/WebRTC)
- Player identity & sessions
- Latency compensation
- Input prediction
- Authority models (client/server)

### Not Included in Current Roadmap

This phase is intentionally deferred until single-player gameplay is mature.

---

## Deferred Systems (Intentionally Postponed)

### Why Some Features Are Deferred

The roadmap prioritizes **proven gameplay first**, then infrastructure. Deferred systems are either:

1. **High-complexity, low-value**: Effort > gameplay improvement
2. **Dependent on earlier phases**: Blocked until prerequisites complete
3. **Performance-risky**: May regress if added too early
4. **Design-dependent**: Gameplay decisions not finalized

### Deferred Feature List

| Feature | Reason | Suggested Phase |
|---------|--------|-----------------|
| **Undo/Redo** | Complex state tracking, low priority | Phase 9+ |
| **Cloud Save** | Infrastructure overhead, local sufficient | Phase 9+ |
| **Mod Support** | Requires stability proof, plugin system design | Phase 9+ |
| **Advanced Graphics** | Phaser rendering sufficient, visual polish later | Phase 10+ |
| **Mobile Optimization** | Screen adaptation, input handling | Phase 9+ |
| **Accessibility** | Keyboard remapping, colorblind modes | Phase 10+ |
| **Performance Profiler** | Built-in after 80% complete | Phase 9+ |
| **Version Migration** | Handled when schema changes prove necessary | Phase 8+ |
| **Matchmaking** | Depends on multiplayer (Phase 9) | Phase 10+ |
| **Anti-Cheat** | Depends on multiplayer architecture | Phase 10+ |

---

## Risk Mitigation Strategy

### Technical Risks

| Risk | Mitigation | Monitor |
|------|-----------|---------|
| **Performance Regression** | Benchmark before each phase | Frame time, memory |
| **Phaser Update** | Pin version, test upgrades first | Compatibility |
| **Asset Pipeline Bottleneck** | Implement streaming by Phase 7 | Load times |
| **State Sync Issues** | Test rollback scenarios | Determinism |
| **Component Coupling** | Enforce boundaries in code review | Architecture drift |

### Organizational Risks

| Risk | Mitigation | Monitor |
|------|-----------|---------|
| **Scope Creep** | Strict phase definitions | Deliverables |
| **Timeline Slip** | Buffer time (10% per phase) | Velocity |
| **Knowledge Loss** | Document as you go | Doc updates |
| **Team Turnover** | Architecture docs, code comments | Onboarding time |

---

## Dependency Tree (Updated)

```
Phase 5 (Save/Load)
  ├─ Depends on: Phase 4 ✅
  ├─ Enables: Phase 6, 7
  └─ Risk: LOW

Phase 6 (Editor)
  ├─ Depends on: Phase 4 ✅
  ├─ Enables: Content creation
  ├─ Parallel with: Phase 5
  └─ Risk: MEDIUM (IPC complexity)

Phase 7 (Gameplay)
  ├─ Depends on: Phases 5 + 6
  ├─ Enables: Game design iteration
  └─ Risk: MEDIUM (design decisions)

Phase 8 (AI & Advanced)
  ├─ Depends on: Phase 7
  ├─ Enables: Complex gameplay
  └─ Risk: HIGH (algorithm complexity)

Phase 9 (Multiplayer)
  ├─ Depends on: Phases 7 + 8
  ├─ Enables: Cooperative/PvP
  └─ Risk: VERY HIGH (infrastructure)
```

---

## Success Metrics by Phase

### Phase 5: Save/Load
```
✅ Can save/load game state
✅ Player progress persists across sessions
✅ No data loss
✅ <100ms save/load time
```

### Phase 6: Editor
```
✅ Can create project without code
✅ Can layout scene visually
✅ Export to valid project.json
✅ Live preview works
✅ Editor is usable by non-programmers
```

### Phase 7: Gameplay
```
✅ Sprites animate smoothly
✅ Dialog system works end-to-end
✅ Inventory management works
✅ Quests can be completed
✅ 60 FPS maintained
```

### Phase 8: AI & Advanced
```
✅ NPCs navigate complex scenes
✅ Combat feels responsive
✅ Visual effects don't impact performance
✅ Destruction physics work
✅ No pathfinding bottlenecks
```

### Phase 9: Multiplayer
```
✅ Players see each other in real-time
✅ State stays synchronized
✅ Latency is acceptable (<200ms)
✅ Handles disconnections gracefully
✅ No cheating exploits
```

---

## Timeline & Capacity Planning

### Projected Schedule

```
Today: May 21, 2026 (Phase 4 Complete)

Phase 5: May 28 - June 11 (2 weeks)
  └─ Save/Load serialization

Phase 6: June 4 - June 25 (3 weeks, parallel with 5)
  └─ Visual editor

Phase 7: June 25 - July 23 (4 weeks)
  └─ Extended gameplay

Phase 8: July 23 - August 20 (4 weeks)
  └─ AI & advanced mechanics

Phase 9: August 20 - October 1 (6 weeks, DEFERRED)
  └─ Multiplayer

TOTAL: 12-16 weeks to "feature complete"
```

### Resource Estimates

- **1 Full-Stack Engineer**: Can complete Phases 5-8 in 12-16 weeks
- **2 Engineers**: Can complete Phases 5-8 in 8-10 weeks + parallel systems
- **3 Engineers**: Can do Phases 5-9 in 10-12 weeks

---

## Go/No-Go Criteria for Phase 5

### Before starting Phase 5, verify:

```
[x] Phase 4 is 95%+ complete
[x] No critical bugs in gameplay
[x] Performance benchmarks met (60 FPS)
[x] Memory stable (<100MB)
[x] Architecture proven sound
[x] Code is well-documented
[x] Snapshot system works
[x] No unplanned 2-week interruptions
```

All criteria met. ✅ **READY TO START PHASE 5**

---

## Conclusion

The VGZ runtime has a **proven, scalable architecture**. The roadmap charts a clear path from foundation (Phase 4) through extended gameplay (Phase 8) to a full-featured engine.

**Key principles maintained throughout:**
- ✅ Immutable data contracts
- ✅ Phaser isolation
- ✅ Component safety
- ✅ Deterministic execution
- ✅ Safe error boundaries
- ✅ Type safety

**Next action**: Begin Phase 5 (Save/Load) immediately. Estimated completion: June 11, 2026.

