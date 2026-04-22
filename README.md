# cc

`cc` stands for `Composable Coordination`.

It is a thin coordination layer for running bounded discussion cycles with two comparable conditions:
- `intervention`: routed participant digests with plain-language explanations
- `baseline_thread`: a chronological thread on the same canonical cycle model

The product is built around a single protocol contract, two operator surfaces, and a set of reusable coordination blocks packaged as Agent Skills-compatible units.

## What the product does

- creates and manages discussion cycles
- collects one primary contribution per participant during the submission window
- runs intervention routing and digest generation under bounded load constraints
- releases either routed digests or a baseline thread depending on condition
- captures participant responses, feedback, telemetry, audit events, and exports
- exposes both a web surface and a CLI over the same protocol core
- packages reusable coordination blocks in `skills/`

## Product framing

`cc` is not a social platform and not an AI discussant.

The system acts as a coordinator at the attention-allocation layer:
- routing
- digest construction
- explanation
- overload governance
- operator audit
- baseline condition parity

The skills in `skills/` are best understood as composable blocks of this coordination layer, not as the source of truth for protocol semantics.

## Repository layout

```text
src/
  api/                HTTP API
  core/               canonical schemas and runtime config
  services/           cycle orchestration, persistence, routing, metrics
public/               participant + operator SPA
tests/                API, service, pipeline, and persistence coverage
skills/               Agent Skills-compatible coordination blocks
```

## Key runtime surfaces

### Web app

The web surface provides:
- operator cycle creation and lifecycle control
- participant prompt reading and contribution submission
- participant digest or thread reading depending on condition
- participant response and feedback flows
- metrics, audit, and export inspection

### CLI

The CLI provides:
- cycle create/list/show/open/close/release/archive/replay/export
- participant view
- contribution, response, feedback, and telemetry event submission

Examples:

```bash
npm run cli -- cycle create '{"title":"Housing tradeoffs","prompt":"What tradeoffs matter most?","condition":"intervention","participants":[{"id":"p1","name":"Alice","role":"participant"},{"id":"p2","name":"Bob","role":"participant"}]}'
npm run cli -- cycle list
npm run cli -- participant view <cycleId> <participantId>
```

## Coordination blocks

The initial coordination blocks are:
- `deliberation-cycle`
- `epistemic-routing`
- `digest-and-explanation`
- `overload-governance`
- `operator-audit`
- `participant-web-operator`
- `research-cli-operator`
- `baseline-thread-runner`
- `pilot-analysis`
- `cc-openclaw`

These are packaged as Agent Skills-compatible blocks so the coordination layer can be reused across compatible agents and runtimes without collapsing the application into prompt text.

## Local development

Requirements:
- Node.js 20+

Install and run:

```bash
npm install
npm run dev
```

The server defaults to:
- host: `127.0.0.1`
- port: `4317`
- data dir: `.cc-data/`

Environment variables:
- `CC_HOST`
- `CC_PORT`
- `CC_DATA_DIR`

## Build and test

```bash
npm run build
npm run typecheck
npm test
```

## Current scope

This repository contains the product implementation.
It does not include the original proposal positioning as the product identity.
`Beyond Overload` was the initial proposal name; `cc` is the product name.
