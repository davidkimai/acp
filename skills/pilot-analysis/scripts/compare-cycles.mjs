#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const cycleIds = process.argv.slice(2);

if (cycleIds.length < 2) {
  console.error('usage: compare-cycles.mjs <cycle-id> <cycle-id> [...]');
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

const comparison = cycleIds.map((cycleId) => {
  const cycle = JSON.parse(runCli(['cycle', 'show', cycleId]));
  return {
    cycleId: cycle.id,
    title: cycle.title,
    condition: cycle.condition,
    status: cycle.status,
    participantCount: cycle.participants.length,
    contributionCount: cycle.contributions.length,
    responseCount: cycle.responses.length,
    feedbackCount: cycle.feedback.length,
    exposureConcentrationGini: cycle.metrics?.exposureConcentrationGini ?? null,
    replyConcentrationGini: cycle.metrics?.replyConcentrationGini ?? null,
    averageContributorCoverage: cycle.metrics?.averageContributorCoverage ?? null,
    bridgeExposureRate: cycle.metrics?.bridgeExposureRate ?? null,
    explanationEngagementRate: cycle.metrics?.explanationEngagementRate ?? null,
    abandonmentRate: cycle.metrics?.abandonmentRate ?? null,
  };
});

process.stdout.write(`${JSON.stringify(comparison, null, 2)}\n`);
