#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../../.." && pwd)"

if [[ $# -eq 0 ]]; then
  echo "usage: relay-cli.sh [--build] <cli-args...>" >&2
  exit 1
fi

cd "$REPO_ROOT"

if [[ "${1:-}" == "--build" ]]; then
  npm run build
  shift
fi

npm run --silent cli -- "$@"
