#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const cycleId = process.argv[2];

if (!cycleId) {
  console.error('usage: metrics-summary.mjs <cycle-id>');
  process.exit(1);
}

function runCli(args) {
  const result = spawnSync('npm', ['run', '--silent', 'cli', '--', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || 'relay cli failed\n');
    process.exit(result.status ?? 1);
  }
  return result.stdout;
}

const raw = runCli(['cycle', 'show', cycleId]);
const cycle = JSON.parse(raw);
const summary = {
  cycleId: cycle.id,
  title: cycle.title,
  condition: cycle.condition,
  status: cycle.status,
  counts: {
    participants: cycle.participants.length,
    contributions: cycle.contributions.length,
    routingDecisions: cycle.routingDecisions.length,
    digests: cycle.digests.length,
    responses: cycle.responses.length,
    feedback: cycle.feedback.length,
    telemetryEvents: cycle.telemetryEvents.length,
    auditEvents: cycle.auditEvents.length,
    exports: cycle.exports.length,
  },
  metricsReady: Boolean(cycle.metrics),
  metrics: cycle.metrics ?? null,
  exportModes: cycle.exports.map((artifact) => artifact.mode),
};

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
