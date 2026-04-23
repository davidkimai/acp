# Research CLI operator workflows

Use these patterns when operating Relay through the CLI.

## Build and run

If the compiled CLI is missing or stale:

```bash
scripts/relay-cli.sh --build cycle list
```

For direct CLI execution without rebuilding:

```bash
scripts/relay-cli.sh cycle list
```

## Lifecycle patterns

Create a cycle:

```bash
scripts/relay-cli.sh cycle create '{"title":"Pilot A","prompt":"What tradeoff matters most?","condition":"intervention","participants":[{"id":"p1","name":"A"},{"id":"p2","name":"B"}]}'
```

Advance the cycle:

```bash
scripts/relay-cli.sh cycle open <cycle-id>
scripts/relay-cli.sh cycle close-submissions <cycle-id>
scripts/relay-cli.sh cycle run-routing <cycle-id>
scripts/relay-cli.sh cycle release <cycle-id>
scripts/relay-cli.sh cycle close-reflection <cycle-id>
scripts/relay-cli.sh cycle archive <cycle-id>
```

Replay a prior routing job:

```bash
scripts/relay-cli.sh cycle replay <cycle-id>
```

## Participant-facing inspection

View a participant payload:

```bash
scripts/relay-cli.sh participant view <cycle-id> <participant-id>
```

Submit participant actions through structured payloads:

```bash
scripts/relay-cli.sh contribution submit <cycle-id> '{"participantId":"p1","body":"Contribution text"}'
scripts/relay-cli.sh response submit <cycle-id> '{"participantId":"p1","parentContributionId":"contrib-1","body":"Response text"}'
scripts/relay-cli.sh feedback submit <cycle-id> '{"participantId":"p1","instrumentVersion":"v1","answers":{"overload":2,"usefulness":4,"exchangeQuality":4,"returnWillingness":4}}'
scripts/relay-cli.sh event record <cycle-id> '{"participantId":"p1","eventType":"digest_opened","surface":"operator_cli"}'
```

## Export patterns

Preferred export wrapper:

```bash
scripts/export-cycle.sh <cycle-id> analysis
```

Equivalent raw command:

```bash
scripts/relay-cli.sh cycle export <cycle-id> analysis
```
