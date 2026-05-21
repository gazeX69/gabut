# Safe Extension Boundaries

**Date**: May 21, 2026  
**Purpose**: Define safe zones for extending runtime without breaking architecture  

---

## 1. Safe Extension Points (Approved for Gameplay Developers)

### A. Component System (✅ Fully Safe)

**What you CAN do:**

```typescript
import { RuntimeComponent } from '@rpg-maker-vgz/runtime'

export class CustomBehaviorComponent implements RuntimeComponent {
  readonly id = 'custom-behavior'
  readonly type = 'custom-behavior'
  enabled = true
  runtimeData = { healthPoints: 100, mana: 50 }

  onAttach() {
    // Called when attached to entity
    console.log('Component attached')
  }

  onUpdate(deltaMs: number) {
    // Called every frame by RuntimeSceneLoop
    // ✅ Read from this.runtimeData
    // ✅ Call methods on this.mountedEntity
    // ✅ Update phaserObject properties
    // ✅ Make gameplay decisions here

    if (this.runtimeData.healthPoints <= 0) {
      this.mountedEntity?.destroy()
    }
  }

  onDetach() {
    // Called on cleanup
    console.log('Component detached')
  }
}

// Attach to entity in gameplay code:
entity.components.push(new CustomBehaviorComponent())
```

**Why it's safe:**
- Components are snapshotted before iteration (no modification-during-iteration crashes)
- Exceptions are caught per-component (errors don't halt loop)
- Access controlled through `mountedEntity` proxy (no direct Phaser access)
- runtimeData is component-owned (isolated state)

**Limitations:**
- Cannot create/destroy entities during onUpdate (do it in updateHandler instead)
- Cannot access RuntimeContext directly (use entity.runtimeData)
- Cannot import Phaser directly (use proxy methods)

---

### B. Update Handlers (✅ Safe for Entity Behavior)

**What you CAN do:**

```typescript
const entity = mountedScene.mountedEntities.get('player')
if (entity) {
  entity.updateHandler = (entity, deltaMs, loop) => {
    // ✅ Read entity state
    const pos = entity.phaserObject.position
    
    // ✅ Update entity behavior
    const speed = 100
    entity.phaserObject.x += speed * (deltaMs / 1000)
    
    // ✅ Make decisions
    if (entity.phaserObject.x > 1000) {
      entity.destroy()
    }
    
    // ✅ Access loop state
    console.log(`Frame: ${loop.frameCount}`)
  }
}
```

**Why it's safe:**
- Handlers run after entity snapshot (iteration is safe)
- Full access to entity state and loop context
- Can destroy entity (snapshot prevents cascade)

**Limitations:**
- Don't modify other entities during handler (may be snapshotted already)
- Don't access entity.components directly (use component API)

---

### C. Trigger Callbacks (✅ Safe for Interaction Logic)

**What you CAN do:**

```typescript
import { canReceiveInteraction } from '@rpg-maker-vgz/runtime'

// In scene setup:
interactionSystem.on('interact', (entity, actor) => {
  // ✅ Read entity and actor state
  console.log(`${actor.entityId} interacted with ${entity.entityId}`)
  
  // ✅ Update UI
  uiLayer.createText('message', 100, 100, 'Hello!')
  
  // ✅ Play audio
  audioLayer.playSound('door-open')
  
  // ✅ Make state changes
  entity.runtimeData.isUsed = true
  
  // ✅ Trigger scene transition (safe)
  if (entity.runtimeData.type === 'portal') {
    loadNewScene('level-2')
  }
})
```

**Why it's safe:**
- Triggered after collision detection (no physics state mutation)
- Callback is invoked once per frame max
- Scene state snapshot available

**Limitations:**
- Don't destroy the interacting entity (can corrupt overlap state)
- Don't modify collision geometry (handled by physics step)

---

### D. UI Layer (✅ Safe for HUD Updates)

**What you CAN do:**

```typescript
// Create UI elements
const healthText = uiLayer.createText(
  'health-display',
  10, 10,
  `HP: ${player.runtimeData.health}`,
  { fontSize: '16px', color: '#00ff00' }
)

// Update content
uiLayer.updateTextContent('health-display', `HP: ${newHealth}`)

// Toggle visibility
uiLayer.setVisibility('health-display', player.alive)

// Destroy when done
uiLayer.destroyElement('health-display')
```

**Why it's safe:**
- UI elements are screen-space (no physics coupling)
- Isolated element lifecycle
- Safe null-checks built-in

**Limitations:**
- UI elements don't persist across scene transitions (rebuild on load)
- Cannot modify element properties beyond built-in API

---

### E. Audio Layer (✅ Safe for Sound Management)

**What you CAN do:**

```typescript
// Play sound effect
audioLayer.playSound('sword-hit', { volume: 0.8, loop: false })

// Play background music
audioLayer.playMusic('dungeon-theme', { volume: 0.5, loop: true })

// Control volume
audioLayer.setMasterVolume(0.7)

// Stop specific sound
audioLayer.stopSound('sword-hit')

// Stop all sounds
audioLayer.stopAllSounds()
```

**Why it's safe:**
- Audio state is managed independently
- Missing audio assets return null (don't crash)
- Volume clamped to [0, 1] range

**Limitations:**
- Cannot access Phaser sound objects directly
- Audio stops on scene transition (rebuild state on scene load)

---

### F. Camera Control (✅ Safe for Gameplay Queries)

**What you CAN do:**

```typescript
// Set camera target
cameraState.setFollow(entity, 0.1)

// Get world position from screen position
const worldPos = cameraState.getWorldPoint(screenX, screenY)

// Get screen position from world position
const screenPos = cameraState.getScreenPoint(worldX, worldY)

// Manual camera position (overrides follow)
cameraState.setPosition(x, y)

// Zoom
cameraState.setZoom(2.0)
```

**Why it's safe:**
- Camera is query-based (read-only from gameplay)
- Updates applied in RuntimeSceneLoop (no mid-frame conflicts)
- Bounds automatically clamped to world

**Limitations:**
- Cannot change camera layer/viewport (rendering pipeline controlled)
- Zoom levels should be in [0.25, 4.0] range (performance)

---

### G. Input Queries (✅ Safe for Gameplay Logic)

**What you CAN do:**

```typescript
// Check if key is currently down
if (inputState.isKeyDown('w')) {
  player.y -= 100 * (deltaMs / 1000)
}

// Check if key was just pressed this frame
if (inputState.keysPressed.has('space')) {
  player.jump()
}

// Access raw key set
const movementKeys = ['w', 'a', 's', 'd']
const isMoving = movementKeys.some(key => inputState.isKeyDown(key))

// Read last input time
const idle = now - inputState.lastInputTime > 5000
```

**Why it's safe:**
- Input state is read-only from gameplay perspective
- Updated by input bridge only
- Platform-agnostic (keyboard, gamepad future-proof)

**Limitations:**
- Cannot modify inputState directly
- Cannot bind new input actions (core-only)

---

## 2. Safe Patterns for Common Gameplay Tasks

### Pattern 1: Stateful Entity Behavior

```typescript
export class HealthComponent implements RuntimeComponent {
  id = 'health'
  type = 'health'
  enabled = true
  runtimeData = {
    maxHealth: 100,
    currentHealth: 100,
    isAlive: true
  }

  onUpdate(deltaMs: number) {
    // Decay health over time (example)
    if (this.runtimeData.currentHealth > 0) {
      this.runtimeData.currentHealth -= 5 * (deltaMs / 1000)
    }

    // Check death
    if (this.runtimeData.currentHealth <= 0 && this.runtimeData.isAlive) {
      this.runtimeData.isAlive = false
      this.onDeath()
    }
  }

  onDeath() {
    // Use updateHandler to actually destroy (safe from component context)
    this.mountedEntity!.updateHandler = (entity, deltaMs, loop) => {
      entity.destroy()
    }
  }
}
```

---

### Pattern 2: Input-Driven Movement

```typescript
// In scene update or component
if (inputState.isKeyDown('w')) {
  player.phaserObject.y -= moveSpeed * (deltaMs / 1000)
}
if (inputState.isKeyDown('s')) {
  player.phaserObject.y += moveSpeed * (deltaMs / 1000)
}
if (inputState.isKeyDown('a')) {
  player.phaserObject.x -= moveSpeed * (deltaMs / 1000)
}
if (inputState.isKeyDown('d')) {
  player.phaserObject.x += moveSpeed * (deltaMs / 1000)
}
```

---

### Pattern 3: Proximity-Based Events

```typescript
// In component or scene loop
const playerPos = { x: player.phaserObject.x, y: player.phaserObject.y }

for (const entity of mountedScene.mountedEntities.values()) {
  if (entity.entityId === player.entityId) continue

  const dist = Math.hypot(
    entity.phaserObject.x - playerPos.x,
    entity.phaserObject.y - playerPos.y
  )

  if (dist < 100 && entity.runtimeData.onProximity) {
    entity.runtimeData.onProximity(player)
  }
}
```

---

### Pattern 4: Delayed Actions

```typescript
export class DelayedActionComponent implements RuntimeComponent {
  id = 'delayed-action'
  type = 'delayed-action'
  enabled = true
  runtimeData = {
    remainingMs: 0,
    action: null as (() => void) | null
  }

  scheduleAction(action: () => void, delayMs: number) {
    this.runtimeData.action = action
    this.runtimeData.remainingMs = delayMs
  }

  onUpdate(deltaMs: number) {
    if (!this.runtimeData.action) return

    this.runtimeData.remainingMs -= deltaMs
    if (this.runtimeData.remainingMs <= 0) {
      this.runtimeData.action()
      this.runtimeData.action = null
    }
  }
}

// Usage:
delayedComponent.scheduleAction(() => {
  audioLayer.playSound('bell')
}, 2000)
```

---

## 3. Forbidden Zones (Do NOT Modify)

### ❌ NEVER: Modify RuntimeContext

```typescript
// ❌ WRONG: RuntimeContext is immutable
context.scene.map.height = 1000

// ❌ WRONG: Project data is locked
context.project.settings.title = 'New Title'

// ✅ RIGHT: Use entity.runtimeData instead
entity.runtimeData.customProperty = 'New Title'
```

**Why**: RuntimeContext is shared across scene transitions. Mutations cause desyncs.

---

### ❌ NEVER: Manipulate Phaser Objects Directly

```typescript
// ❌ WRONG: Direct Phaser manipulation
const sprite = entity.phaserObject as Phaser.Sprite
sprite.setTexture('new-texture')

// ❌ WRONG: Accessing Phaser internals
scene.physics.add.collider(...)

// ✅ RIGHT: Use component methods
entity.phaserObject.visible = false
entity.phaserObject.position.set(x, y)
```

**Why**: Breaks Phaser adapter isolation. Hard to test/debug/migrate.

---

### ❌ NEVER: Create/Destroy Entities During Component Updates

```typescript
export class BadComponent implements RuntimeComponent {
  // ❌ WRONG: Modifying entity collection during iteration
  onUpdate(deltaMs: number) {
    const newEntity = createEntity(...)
    this.mountedScene!.mountedEntities.set(id, newEntity)  // ← CRASH
  }
}

// ✅ RIGHT: Use updateHandler for structural changes
entity.updateHandler = (entity, deltaMs, loop) => {
  // Safe to destroy here (snapshotted)
  entity.destroy()
  
  // Can create new entities here
  const newEntity = createEntity(...)
}
```

**Why**: Entity map is snapshotted before iteration. Modifications break the snapshot.

---

### ❌ NEVER: Store References to Phaser Objects Across Scenes

```typescript
// ❌ WRONG: References invalidated on scene transition
class MyManager {
  cachedSprite: Phaser.Sprite
  
  cacheSprite(sprite: Phaser.Sprite) {
    this.cachedSprite = sprite
  }
  
  updateSprite() {
    // Scene changed, this.cachedSprite is now orphaned
    this.cachedSprite.x = 100
  }
}

// ✅ RIGHT: Store entity IDs, not Phaser objects
class MyManager {
  cachedEntityId: string
  
  cacheEntity(entity: RuntimeMountedEntity) {
    this.cachedEntityId = entity.entityId
  }
  
  updateEntity(mountedScene: MountedScene) {
    const entity = mountedScene.mountedEntities.get(this.cachedEntityId)
    if (entity) {
      entity.phaserObject.x = 100
    }
  }
}
```

**Why**: Phaser objects are destroyed on scene unload. IDs persist.

---

### ❌ NEVER: Assume Synchronous Physics Updates

```typescript
// ❌ WRONG: Physics update happens in Phaser step, not immediately
entity.phaserObject.x = 100
if (entity.phaserObject.x === 100) {
  // May be false if physics body adjusted position
}

// ✅ RIGHT: Check at start of next frame
entity.updateHandler = (entity, deltaMs, loop) => {
  const currentX = entity.phaserObject.x
  entity.phaserObject.x = 100
}
```

**Why**: Physics and rendering have different update phases.

---

### ❌ NEVER: Block the Update Loop

```typescript
// ❌ WRONG: Blocking operations halt all gameplay
export class BadComponent implements RuntimeComponent {
  async onUpdate(deltaMs: number) {
    await fetch('/api/data')  // 500ms request blocks all entities
  }
}

// ✅ RIGHT: Use updateHandler with async wrapped
entity.updateHandler = async (entity, deltaMs, loop) => {
  // But keep individual operations short (<1ms)
  // Use Promise.then() for async, not await
}

// ✅ BETTER: Schedule background work
export class GoodComponent implements RuntimeComponent {
  runtimeData = { pendingRequest: null as Promise<any> | null }
  
  onUpdate(deltaMs: number) {
    if (!this.runtimeData.pendingRequest) {
      this.runtimeData.pendingRequest = fetch('/api/data')
        .then(res => {
          this.runtimeData.result = res
          this.runtimeData.pendingRequest = null
        })
    }
  }
}
```

**Why**: Frame deadline is only 16.67ms @ 60fps. Blocking causes stuttering.

---

### ❌ NEVER: Modify MountedScene During Iteration

```typescript
// ❌ WRONG: Called from RuntimeSceneLoop iteration
this.mountedScene.mountedEntities.clear()  // ← Corrupts snapshot

// ✅ RIGHT: Mark for cleanup, execute in next frame
entity.updateHandler = (entity, deltaMs, loop) => {
  entity.destroyed = true  // Mark for deletion
}
// RuntimeSceneLoop will skip destroyed entities automatically
```

**Why**: Snapshot prevents safe modification of collections.

---

## 4. Coupling Detection Checklist

### Use this checklist to verify your extension is safe:

```
[ ] No direct Phaser imports outside phaser-adapter/
    $ grep -r "import.*phaser" src/gameplay src/ui src/audio
    Result: SHOULD BE ZERO matches

[ ] No RuntimeContext mutations
    $ grep -r "context\.\(project\|scene\|config\)" src/gameplay | grep -v "// reference"
    Result: Read-only references only

[ ] No MountedScene collection mutations during component updates
    Search: mountedEntities.set/delete/clear inside RuntimeComponent
    Result: SHOULD BE ZERO

[ ] Component exceptions are caught
    Try/catch wraps all onUpdate() calls
    Result: Errors logged, game continues

[ ] No Phaser object references stored persistently
    Search: const.*Sprite|const.*Container (outside of onUpdate)
    Result: Only entity.phaserObject used within frame

[ ] Input abstraction used
    Search: import.*Phaser.*Input
    Result: Should only be in phaser-adapter/phaser-input-bridge.ts

[ ] Camera abstraction used
    Search: this.cameras\|scene.cameras
    Result: Should only be in phaser-adapter/phaser-camera-bridge.ts

[ ] Update handlers don't block
    Search: await.*fetch\|setTimeout
    Result: Use Promise.then() or schedule in next frame
```

---

## 5. Adding New Safe Extension Points

If you need to extend beyond these patterns:

### Step 1: Propose the Extension
- Document what you want to do
- Explain why existing patterns don't work
- Show how you'll keep it safe

### Step 2: Validate Against Architecture
- Does it mutate immutable data? → Blocked
- Does it import Phaser outside adapters? → Blocked
- Does it modify collections during iteration? → Blocked
- Does it block the main thread? → Blocked
- Does it create Phaser coupling? → Blocked

### Step 3: Implement as Adapter
- Create abstraction layer (e.g., `runtime-custom-system.ts`)
- Implement Phaser details in adapter (e.g., `phaser-custom-system.ts`)
- Export only abstract interface
- Document ownership boundaries

### Step 4: Test Safely
- Component errors don't halt loop ✓
- Scene transitions cleanup properly ✓
- No memory leaks after 5 minutes ✓
- Performance remains >55 FPS ✓

