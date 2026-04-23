---
name: participant-web-operator
description: Use this skill when you need to operate the Relay web app, the first ACP implementation, for participant submission, digest reading, baseline thread reading, response flow, or operator UI QA.
---

# What this block is for

Use this block for browser-driven workflow execution against the Relay web surface.

# When to use this block

Use this block when the task depends on the rendered participant or operator web experience.

Load `references/browser-workflows.md` when you need the canonical UI workflow checklist.
Use `scripts/surface-preflight.mjs` before browser work when you need to confirm server readiness or inspect a participant view directly.

# When not to use this block

Do not use this block for protocol logic that can be executed directly through the CLI or API.

# Inputs expected

- local app URL
- cycle id when targeting a specific flow
- participant id when inspecting a participant view

# Workflow

1. Run `scripts/surface-preflight.mjs --base-url <url>` before browser work if server readiness is uncertain.
2. If needed, include `--cycle-id` and `--participant-id` to inspect the server-side participant view that should back the web surface.
3. Open the app and select participant or operator mode.
4. Navigate to the target cycle.
5. Execute the intended workflow without bypassing server-side transitions.
6. If the browser and server disagree, trust the server contract and report the mismatch.

# Available scripts

- `scripts/surface-preflight.mjs --base-url <url> [--cycle-id <id>] [--participant-id <id>]`: readiness and participant-view helper for browser work

# Outputs

- executed browser workflow
- participant or operator UI observations
- deterministic readiness snapshot when needed

# Failure handling

If the browser surface disagrees with the server state, trust the server contract and report the mismatch.
