---
name: pilot-analysis
description: Use this skill when you need to compute or inspect ACP metrics, telemetry, or export outputs for intervention and baseline cycles.
---

# What this block is for

Use this block for metric review, cycle export inspection, and condition comparison.

# When to use this block

Use this block when you need deterministic summaries of Relay cycle state, metric readiness, or intervention-versus-baseline comparison.

Load `references/analysis-workflows.md` when you need the canonical metric checklist.

# When not to use this block

Do not use this block to manage lifecycle transitions or author participant content.

# Inputs expected

- one or more cycle ids
- optional export mode when deeper artifact inspection is needed

# Workflow

1. Use `scripts/metrics-summary.mjs` for one-cycle summaries.
2. Use `scripts/compare-cycles.mjs` for side-by-side condition comparison.
3. If a required export artifact is missing, generate it first through the Relay CLI or API.
4. Report missing metrics explicitly rather than inferring values.

# Available scripts

- `scripts/metrics-summary.mjs <cycle-id>`: summarize counts, metric values, and export availability for one cycle
- `scripts/compare-cycles.mjs <cycle-id> <cycle-id> [...]`: compare multiple cycles on the canonical analysis fields

# Outputs

- metrics summary
- comparable condition snapshots
- explicit gaps when telemetry or metrics are incomplete

# Failure handling

If telemetry is incomplete, report metric incompleteness explicitly instead of inventing values.
