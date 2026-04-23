---
name: research-cli-operator
description: Use this skill when you need to run Relay CLI workflows, the first ACP implementation, for cycle management, export, replay, or participant-view operations.
---

# What this block is for

Use this block for local operator execution without the web surface.

# When to use this block

Use this block when the task is deterministic and already supported by the Relay CLI:
- cycle lifecycle control
- replay and export
- participant-view inspection
- contribution, response, feedback, or event submission from structured payloads

Load `references/cli-workflows.md` when you need canonical command patterns or examples.

# When not to use this block

Do not use this block if the task requires manual participant browsing behavior in the web app.

# Inputs expected

- cycle id when applicable
- JSON payload for create, contribution, response, feedback, or event commands
- export mode when exporting

# Workflow

1. If `dist/` is missing or stale, run `scripts/relay-cli.sh --build ...`.
2. Use `scripts/relay-cli.sh` for raw Relay CLI access.
3. Use `scripts/export-cycle.sh` for deterministic export generation.
4. Keep payloads aligned with the canonical cycle contract.
5. Stop on lifecycle guardrail failures instead of forcing state transitions.

# Available scripts

- `scripts/relay-cli.sh`: wrapper around `npm run cli -- ...` from the repo root
- `scripts/export-cycle.sh <cycle-id> [analysis|audit|minimal]`: export helper with mode validation

# Outputs

- CLI-managed lifecycle actions
- export artifacts
- participant view payloads
- machine-readable CLI output routed through the existing Relay runtime

# Failure handling

If a command fails due to lifecycle guardrails, stop and fix the cycle state rather than forcing the command.
