# CLAUDE.md

This file governs how Claude Code agents work in this repository. Read it before starting any task.

## Project

**ASCII Img Renderer** — a browser-only React + TypeScript application that converts image, video, webcam, and screen-share input into customizable, real-time ASCII art rendered on Canvas 2D.

Planned capabilities (see `docs/TASKS.md` for the phased build order):
- Image, video, webcam, and screen-share input sources
- Canvas 2D ASCII rendering, color and monochrome modes
- Character presets and custom character ramps
- Font, brightness, contrast, gamma, inversion, output-grid, and FPS controls
- PNG export of the current frame
- Performance diagnostics (fps, frame time, grid size)
- A renderer abstraction that can later support WebGL/WebGPU without UI changes

## Technology Stack

- React + TypeScript
- Vite
- Canvas 2D for the version-1 renderer (see `docs/ARCHITECTURE.md` for the abstraction boundary)
- No backend, no authentication, no database, no paid APIs — everything runs client-side in the browser

## Development Commands

This section must be kept in sync whenever `package.json` scripts change.

```
npm run dev         # local dev server
npm run build       # tsc -b && vite build (production build)
npm run preview     # preview the production build
npm run lint        # eslint .
npm run typecheck   # tsc -b --noEmit
npm test            # vitest run (unit tests)
```

## Architecture Principles

Full detail lives in `docs/ARCHITECTURE.md`. Summary:

- Strict separation between React UI, input-source lifecycle (image/video/webcam/screen-share), the rendering engine, pure image-processing utilities, and export functionality.
- The renderer is accessed through an interface/abstraction. Canvas 2D is the v1 implementation; it must not be tightly coupled to UI components, so a future WebGL/WebGPU implementation can be swapped in without rewriting the UI.
- Pure image-processing functions (grayscale, brightness/contrast/gamma, luminance-to-character mapping, grid math) contain no DOM/Canvas/React references and are unit-testable in isolation.
- **No React state updates inside the per-frame render loop.** Live video/webcam/screen-share rendering must drive the canvas directly via refs and `requestAnimationFrame`, not via component re-renders.
- Output width drives grid resolution; output height is derived from source aspect ratio and font-cell aspect ratio.

## Code Quality Requirements

- TypeScript strict mode; no unexplained `any`.
- No unrequested abstractions — no interface with a single implementation, no config for a value that never changes, no speculative flexibility for features not yet in `docs/TASKS.md`.
- Prefer deletion and reuse over new code. Check for an existing util/hook/type before writing one.
- Clean up all browser resources that need it: media stream tracks, object URLs, `requestAnimationFrame` handles, event listeners. Every `useEffect` that acquires a resource must release it.
- Comments explain non-obvious *why* only (a workaround, a subtle invariant) — never restate *what* the code does.

## Testing & Build Expectations

- Pure utilities (image processing, grid math, character mapping) require unit tests.
- Component/integration tests are added where acceptance criteria in `docs/TASKS.md` call for them — not speculatively.
- Browser-only behavior that can't be automated (camera permission prompts, screen-share picker) is verified manually and the manual steps are recorded in the task's validation output.
- A task is not validated until its actual required commands (lint/typecheck/test/build, as applicable) have been run and their output reported — not assumed.

## Agent Workflow

This repository is developed by four Claude Code agent roles, defined in `.claude/agents/`:

- **orchestrator** — plans, delegates, integrates, owns `docs/TASKS.md`, `docs/PROJECT_STATE.md`, `docs/DECISIONS.md`, `docs/HANDOFF.md`.
- **builder** — implements one bounded task at a time.
- **reviewer** — read-only review of a builder's change.
- **verifier** — runs build/lint/test/typecheck validation and reports pass/fail.

### Workflow rules

1. Every feature begins with an explicit `docs/TASKS.md` item and acceptance criteria.
2. The orchestrator assigns the builder a small, bounded scope.
3. The builder implements and validates the scoped work.
4. The reviewer inspects the implementation.
5. The orchestrator creates a repair task if findings are material.
6. The verifier runs final checks.
7. Only then may the orchestrator mark the task **Complete**.
8. After each completed task, the orchestrator updates `docs/PROJECT_STATE.md` and `docs/HANDOFF.md`.
9. Before ending any session, create a Git commit if the repository is in a valid state. The commit message must describe the completed task ID and outcome.
10. Never parallelize edits to the same file or tightly coupled module.
11. Use parallel subagents only for independent research, test planning, visual/UI critique, documentation review, or separate non-overlapping file areas.

### Hard rules

- **All meaningful changes require `docs/PROJECT_STATE.md` and `docs/TASKS.md` updates.** A change that isn't reflected there didn't happen as far as the next session is concerned.
- **No agent may claim success without running the relevant validation and showing its output.** "Should work" is not a validation result.
- **Prefer small, reviewable commits** over large batched changes.
- **Only the orchestrator may mark a task Complete.** Builders mark "Needs review"; reviewers and the verifier report findings — neither closes a task.

## Session Start Checklist

Before editing anything, read (in order): this file, `docs/PROJECT_STATE.md`, `docs/TASKS.md`, and the latest `git log`. See `docs/HANDOFF.md` for the full resume procedure.
