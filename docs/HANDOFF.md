# Handoff Template

Copy this section to the top of the "Handoff Log" below every time a session ends with completed or in-progress work. Keep entries newest-first.

## Before editing anything, the next session must

1. Read `CLAUDE.md` in full.
2. Read `docs/PROJECT_STATE.md`.
3. Read `docs/TASKS.md` and note the current active task's status.
4. Run `git log --oneline -10` to see recent history.

Only after those four steps should any edit be made.

---

## Handoff Entry Template

```
### Handoff — <date>

**Task ID:** <e.g. T1.3>

**What changed:**
- <bullet summary>

**Files modified:**
- <path> — <one line on what/why>

**Important technical decisions:**
- <anything decided during this task not already in docs/DECISIONS.md, or a pointer to a new DEC-NNN entry>

**Commands run and result:**
- `<command>` — <pass/fail, one-line summary>

**Known issues / risks:**
- <anything left unresolved, flaky, or worth a reviewer's attention>

**Exact next task recommended:**
- <Task ID from docs/TASKS.md, and why it's next>
```

---

## Handoff Log

### Handoff — 2026-08-12

**Task ID:** none (workflow scaffold only)

**What changed:**
- Created the orchestrator/builder/reviewer/verifier workflow: `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/TASKS.md`, `docs/PROJECT_STATE.md`, `docs/HANDOFF.md`, and `.claude/agents/*.md`.
- Initialized the Git repository.

**Files modified:**
- All files listed above — new.

**Important technical decisions:**
- See `docs/DECISIONS.md` DEC-001 through DEC-011.

**Commands run and result:**
- `git init` and initial commit — see git log.

**Known issues / risks:**
- None yet; no application code exists.

**Exact next task recommended:**
- **T0.1** — Initialize Vite + React + TypeScript project (`docs/TASKS.md`, Phase 0).
