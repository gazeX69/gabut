# RPG Maker VGZ - System Overview

# High Level Overview

VGZ consists of four major layers:

1. Editor
2. Runtime
3. RPG Systems
4. Project Data

---

# Editor Layer

Purpose:
Visual game creation interface.

Responsibilities:
- Tilemap editing
- NPC placement
- Dialogue editing
- Quest editing
- Asset management
- Animation editing
- Trigger/event editing
- Play testing

Main Technologies:
- React
- TypeScript
- Zustand
- Tailwind

The editor must NEVER contain runtime game logic.

---

# Runtime Layer

Purpose:
Execute playable games.

Responsibilities:
- Rendering
- Input
- Camera
- Collision
- Audio
- Animation playback
- Save/load execution
- Scene transitions

Main Technologies:
- Phaser
- TypeScript

The runtime must consume structured project data.

---

# RPG Systems Layer

Purpose:
Reusable RPG gameplay systems.

Core Systems:
- Dialogue system
- Quest system
- Inventory system
- NPC system
- Trigger/event system
- Save system
- Combat system
- Animation system

These systems must remain modular.

---

# Project Data Layer

Purpose:
Store game content and configuration.

Data Format:
- JSON
- Structured assets
- Serialized save data

Project data includes:
- Maps
- NPCs
- Dialogues
- Quests
- Items
- Animations
- Events
- Audio references

---

# Core Workflow

User workflow:

Create Project
→ Create Map
→ Paint Tiles
→ Add NPC
→ Add Dialogue
→ Add Event
→ Configure Gameplay
→ Click Play

---

# Design Goals

VGZ prioritizes:
- Simplicity
- Stability
- Fast iteration
- Modular systems
- Low-code workflows

VGZ does NOT prioritize:
- AAA rendering
- Complex shader systems
- Universal genre support
- Heavy visual scripting

---

# Main Architectural Rule

Editor creates data.
Runtime consumes data.

Editor does not directly execute gameplay logic.

---

# Main Data Flow

Editor
→ Project JSON
→ Runtime Loader
→ RPG Systems
→ Phaser Renderer

---

# Current Engine Focus

VGZ V1 focuses on:
- Pokemon-like RPG workflow
- Story RPG workflow
- Exploration RPG workflow
- Lightweight JRPG workflow