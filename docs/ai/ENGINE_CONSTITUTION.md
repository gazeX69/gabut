# RPG Maker VGZ - Engine Constitution

## Purpose

RPG Maker VGZ is a lightweight web-based low-code topdown RPG creation platform powered by Phaser.

The engine is focused ONLY on:
- Topdown 2D RPG
- Low-code workflows
- Data-driven architecture
- Modular systems
- Fast content creation

This project is NOT intended to become:
- A Unity clone
- A universal engine
- A 3D engine
- A physics-heavy sandbox
- A general-purpose renderer

---

# Core Philosophy

1. Minimal Coding
Most workflows must be achievable through visual tools and configuration.

2. Data Driven
Game logic must primarily rely on JSON/configuration instead of hardcoded logic.

3. Modular Architecture
Systems must remain isolated and replaceable.

4. Editor/Runtime Separation
Editor and runtime are separate applications and must never tightly couple.

5. Stability Over Features
Architecture consistency is more important than rapid feature growth.

6. AI-Friendly Development
All systems must remain understandable and maintainable by multiple AI models.

---

# Project Scope

VGZ focuses on:
- Tilemap RPG
- NPC systems
- Dialogue systems
- Quest systems
- Inventory systems
- Event systems
- Save/load systems
- Topdown exploration

VGZ does NOT focus on:
- MMORPG systems
- Advanced multiplayer
- 3D rendering
- Universal physics
- Procedural world generation
- AAA graphics pipelines

---

# Architecture Principles

- Runtime must consume structured project data.
- Editor generates and edits project data.
- Systems communicate through events.
- Plugins must remain isolated.
- Serialization must remain stable.
- All major systems must support persistence.

---

# Mandatory Technical Rules

- TypeScript is mandatory.
- JSON is the primary project data format.
- Phaser is runtime renderer only.
- React is editor UI only.
- Zustand is preferred editor state manager.
- Avoid hidden global state.
- Avoid circular dependencies.
- Avoid hardcoded asset paths.
- Avoid runtime logic inside editor code.

---

# Forbidden Practices

The following are forbidden unless explicitly approved:

- Massive refactors without architecture review
- Cross-module hidden dependencies
- Runtime importing editor internals
- Editor importing runtime internals
- Business logic directly inside UI components
- Hardcoded game-specific logic inside engine core
- Duplicate systems with overlapping responsibilities
- Silent schema changes without migration notes

---

# Development Priority

Priority order:

1. Stability
2. Data consistency
3. Runtime correctness
4. Editor workflow
5. Performance
6. UX polish
7. Feature expansion

---

# AI Collaboration Rules

All AI agents must:
- Read core documentation before editing
- Preserve architecture boundaries
- Update documentation after structural changes
- Avoid generating duplicate systems
- Avoid speculative architecture changes
- Prefer minimal safe changes

---

# Long-Term Direction

VGZ aims to become:

"A modular low-code RPG creation platform for web-based topdown RPG development."

Not a universal engine.