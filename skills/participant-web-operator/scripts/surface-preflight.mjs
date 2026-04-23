#!/usr/bin/env node
const args = process.argv.slice(2);

function readFlag(name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
}

const baseUrl = (readFlag('--base-url') || 'http://127.0.0.1:3000').replace(/\/$/, '');
const cycleId = readFlag('--cycle-id');
const participantId = readFlag('--participant-id');

async function fetchJson(url) {
  const response = await fetch(url);
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return {
    url,
    ok: response.ok,
    status: response.status,
    body,
  };
}

const summary = {
  baseUrl,
  checks: {},
};

summary.checks.health = await fetchJson(`${baseUrl}/health`);
summary.checks.ready = await fetchJson(`${baseUrl}/ready`);
summary.checks.session = await fetchJson(`${baseUrl}/v1/session`);
summary.checks.cycles = await fetchJson(`${baseUrl}/v1/cycles`);

if (cycleId) {
  summary.checks.cycle = await fetchJson(`${baseUrl}/v1/cycles/${cycleId}`);
}

if (cycleId && participantId) {
  summary.checks.participantView = await fetchJson(`${baseUrl}/v1/cycles/${cycleId}/participants/${participantId}/view`);
}

summary.recommendedAppUrl = `${baseUrl}/`;
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
