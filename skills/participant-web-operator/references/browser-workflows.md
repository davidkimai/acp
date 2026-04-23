# Browser workflows for Relay

Use this block when a task depends on the actual rendered web surface.

## Preflight

Before browser-driven work, confirm the server is responsive:

```bash
scripts/surface-preflight.mjs --base-url http://127.0.0.1:3000
```

Add cycle and participant context when you need the server-side participant view before opening the UI:

```bash
scripts/surface-preflight.mjs --base-url http://127.0.0.1:3000 --cycle-id <cycle-id> --participant-id <participant-id>
```

## Participant flows

Use the web surface for:
- submission during `submission_open`
- digest reading during `digests_released`
- baseline thread reading during `digests_released` with `baseline_thread`
- response and feedback flows when the server has released them

## Operator UI QA

Use the web surface to confirm that:
- cycle lists load
- intervention and baseline conditions render distinctly
- participant mode reflects server-side `view.mode`
- digest summaries and explanation text are visible when present

If the web app differs from the participant view returned by the API, report the mismatch rather than changing state through the UI blindly.
