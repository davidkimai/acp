# Relay OpenClaw runtime notes

This block adapts Relay Blocks for an OpenClaw-style Agent Skills runtime.

## Ground rules

- ACP remains the protocol source of truth.
- Relay remains the first implementation.
- Relay Blocks remain operational packages over Relay.
- The runtime adapter must not introduce hidden protocol semantics.

## Recommended load order

1. `relay-openclaw` for runtime assumptions
2. one narrower block for the actual task, such as:
   - `research-cli-operator`
   - `participant-web-operator`
   - `pilot-analysis`
   - `operator-audit`

## Validation

Before use, run:

```bash
scripts/validate-openclaw-loadout.mjs
```

This confirms that the local Relay Blocks tree has `SKILL.md` files and flags whether targeted high-value blocks also include `references/` and `scripts/` support.
