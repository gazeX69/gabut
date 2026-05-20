# RPG Maker VGZ - Boundary Rules

# Purpose

This document defines strict architectural boundaries.

These boundaries are mandatory.

Violating boundaries causes:
- coupling
- instability
- regression risk
- AI confusion
- maintenance failure

---

# Global Rules

- Systems must remain isolated.
- Modules must have clear ownership.
- Dependencies must remain predictable.
- Hidden coupling is forbidden.

---

# Editor Boundaries

Editor responsibilities:
- editing
- visualization
- configuration
- tooling

Editor must NOT:
- execute runtime gameplay logic
- contain runtime state
- directly manipulate runtime internals

Editor outputs data only.

---

# Runtime Boundaries

Runtime responsibilities:
- gameplay execution
- rendering
- simulation
- persistence execution

Runtime must NOT:
- import editor UI
- depend on editor state
- contain editor tooling logic

---

# Package Boundaries

Packages must:
- remain reusable
- remain isolated
- expose explicit APIs

Packages must NOT:
- directly depend on unrelated packages
- mutate foreign state
- access app internals

---

# Data Boundaries

Project data must:
- remain serializable
- remain versionable
- remain migration-safe

Hardcoded runtime-only state inside project files is forbidden.

---

# UI Boundaries

UI components must:
- remain presentation-focused
- avoid gameplay logic
- avoid hidden state mutations

Business logic inside UI components is forbidden.

---

# Event Boundaries

Systems communicate through:
- events
- structured APIs
- shared contracts

Direct hidden manipulation across systems is forbidden.

---

# AI Modification Boundaries

AI agents must NOT:
- perform large refactors without review
- rename architecture-critical modules silently
- introduce duplicate systems
- bypass architecture layers
- invent undocumented dependencies

---

# Serialization Boundaries

All persistent systems must support:
- save
- load
- restore
- migration

Breaking serialization compatibility without documentation is forbidden.

---

# Final Rule

Short-term convenience must NEVER override long-term architecture stability.