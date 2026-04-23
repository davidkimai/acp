# Pilot analysis workflows

Use this block after a cycle exists and preferably after routing or release has happened.

## One-cycle summary

```bash
scripts/metrics-summary.mjs <cycle-id>
```

This is the fastest deterministic readout for:
- condition
- lifecycle status
- participant, contribution, digest, response, feedback, and export counts
- metric values already computed on the cycle

## Condition comparison

```bash
scripts/compare-cycles.mjs <intervention-cycle-id> <baseline-cycle-id>
```

Use this when you want a compact comparison table over:
- condition
- status
- exposure concentration
- reply concentration
- contributor coverage
- bridge exposure
- explanation engagement
- abandonment

## Escalation rule

If metrics are missing, do not backfill them manually in the block layer. Report the gap and use the Relay runtime to generate the missing data or move the cycle through the required lifecycle step.
