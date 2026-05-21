# RPG Maker VGZ

Web-based low-code topdown RPG creator powered by Phaser.

---

# Vision

RPG Maker VGZ is an AI-native modular RPG engine and editor focused on:

- topdown RPG creation
- low-code workflow
- runtime/editor separation
- scene serialization
- extensible entity systems
- browser-based development
- AI-assisted content creation

The project is designed as a long-term scalable architecture rather than a quick prototype.

---

# Current Status

Pre-Alpha Foundation Phase

Current progress focuses on:

- monorepo architecture
- runtime lifecycle
- Phaser scene adapter
- editor/runtime bridge
- runtime snapshot save/restore
- architecture governance
- AI-agent workflow stabilization

---

# Current Features

Implemented foundation systems:

- Phaser runtime bootstrap
- scene mounting lifecycle
- runtime scene adapter
- entity mounting
- runtime snapshot serialization
- runtime snapshot restoration
- camera state snapshot
- destroyed entity tracking
- editor ↔ runtime communication bridge
- shared runtime types

---

# Planned Systems

Roadmap targets:

## Phase 1 — Runtime Stabilization
- runtime event system
- prefab architecture
- scene serialization pipeline
- asset registry
- runtime validation

## Phase 2 — Editor Foundation
- visual scene editor
- hierarchy panel
- inspector panel
- transform gizmos
- drag-and-drop asset workflow

## Phase 3 — Production Workflow
- save/load project system
- plugin/module architecture
- scripting support
- behavior graph system
- export pipeline

---

# Tech Stack

Core technologies:

- TypeScript
- Phaser
- React
- Vite
- PNPM Workspace

---

# Repository Structure

```text
apps/
packages/
docs/
```

Structure is still evolving during foundation phase.

---

# Development

Install dependencies:

```bash
pnpm install
```

Run development workspace:

```bash
pnpm dev
```

Build workspace:

```bash
pnpm build
```

---

# Philosophy

This project prioritizes:

- scalable architecture
- maintainability
- AI collaboration workflow
- modular systems
- long-term editor extensibility

Early development may appear visually minimal because the current priority is stabilizing engine foundations before expanding editor UX.

---

# License

MIT


---

# Support Development

If you want to support the development of RPG Maker VGZ, you can buy me a coffee:

☕ https://trakteer.id/gazeX69

Your support helps:
- maintain development
- fund infrastructure
- extend engine features
- continue long-term open source work

Thank you for supporting the project.