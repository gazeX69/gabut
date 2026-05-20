# RPG Maker VGZ - Architecture Map

# Root Structure

/apps
/packages
/docs
/templates
/projects

---

# Apps

## /apps/editor

Purpose:
Visual RPG creation application.

Contains:
- Editor UI
- Inspector
- Hierarchy
- Tilemap editor
- Dialogue editor
- Asset browser
- Play mode controls

Must NOT contain:
- Runtime gameplay logic
- Phaser gameplay execution logic

---

## /apps/runtime

Purpose:
Playable runtime executor.

Contains:
- Runtime bootstrap
- Scene loading
- Rendering integration
- Input handling
- Runtime systems integration

Must NOT contain:
- Editor UI
- Editor-only state
- Tooling panels

---

# Packages

## /packages/engine-core

Purpose:
Core engine abstractions.

Contains:
- Entity systems
- Scene systems
- Shared runtime utilities
- Event bus
- Shared types

---

## /packages/event-system

Purpose:
Centralized gameplay event processing.

Contains:
- Trigger execution
- Event dispatching
- Conditions
- Action execution

---

## /packages/dialogue-system

Purpose:
Dialogue execution and branching.

Contains:
- Dialogue state
- Choices
- Conditions
- Dialogue flow

---

## /packages/inventory-system

Purpose:
Inventory and item handling.

Contains:
- Item storage
- Item usage
- Equipment logic

---

## /packages/save-system

Purpose:
Persistence and serialization.

Contains:
- Save slots
- Serialization
- Deserialization
- Save migration

---

# Docs

## /docs/ai

AI governance and workflow documentation.

---

## /docs/architecture

Architecture and system mapping.

---

## /docs/schemas

JSON contracts and data schemas.

---

# Templates

## /templates

Reusable RPG starter templates.

Examples:
- blank-rpg
- horror-rpg
- jrpg

---

# Projects

## /projects

User-created RPG projects.

Contains:
- maps
- dialogues
- saves
- assets
- configuration

---

# Dependency Rules

Allowed:
Editor → Shared Packages
Runtime → Shared Packages

Forbidden:
Editor → Runtime internals
Runtime → Editor internals
Package → App-specific internals

---

# Core Data Direction

Editor
→ Project Data
→ Runtime
→ Game Execution

Never reverse this flow.