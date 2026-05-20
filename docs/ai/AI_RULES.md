# RPG Maker VGZ - AI Rules

# Purpose

This document defines operational rules for ALL AI agents working on VGZ.

Applies to:
- ChatGPT
- Codex
- Claude
- Gemini
- Copilot
- Any future AI system

---

# Mandatory Reading Order

Before making changes, AI agents must read:

1. ENGINE_CONSTITUTION.md
2. SYSTEM_OVERVIEW.md
3. ARCHITECTURE_MAP.md
4. BOUNDARY_RULES.md
5. AI_RULES.md

---

# AI Primary Objective

Maintain long-term architecture stability while implementing requested features safely.

---

# Required AI Behavior

AI agents must:
- prefer minimal safe changes
- preserve modularity
- preserve architecture boundaries
- avoid speculative refactors
- maintain serialization stability
- maintain readable structure

---

# Forbidden AI Behavior

AI agents must NOT:
- rewrite large systems unnecessarily
- create duplicate managers/systems
- introduce hidden dependencies
- tightly couple modules
- mix editor/runtime responsibilities
- silently change project schemas
- perform uncontrolled renaming

---

# Refactor Rules

Before refactoring:
- analyze dependencies
- analyze ownership
- analyze serialization impact
- analyze runtime/editor boundaries

Large refactors require explicit approval.

---

# Documentation Rules

AI agents must update documentation when changing:
- architecture
- folder structure
- schema
- system ownership
- event flow
- serialization logic

---

# Code Generation Rules

Generated code must:
- use TypeScript
- avoid magic values
- avoid hardcoded paths
- avoid circular dependencies
- avoid global mutable state
- remain modular

---

# Naming Rules

Names must:
- be explicit
- be stable
- be searchable
- avoid abbreviations unless standardized

---

# State Rules

State must:
- remain predictable
- remain serializable
- avoid hidden mutation

Global uncontrolled state is forbidden.

---

# Event Rules

Events must:
- use explicit naming
- use typed payloads
- remain traceable

---

# File Modification Rules

When editing files:
- preserve existing architecture
- avoid unrelated formatting changes
- avoid unnecessary rewrites
- preserve public contracts unless approved

---

# AI Response Format

When performing implementation tasks, AI should provide:

A. Root Cause
B. Files Changed
C. Changes Applied
D. Risks
E. Follow-up Recommendations

---

# Final Rule

VGZ is a long-term architecture-first project.

Maintainability is more important than speed.