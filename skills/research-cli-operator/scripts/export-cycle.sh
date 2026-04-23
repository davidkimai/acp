#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../../.." && pwd)"
CYCLE_ID="${1:-}"
MODE="${2:-analysis}"

if [[ -z "$CYCLE_ID" ]]; then
  echo "usage: export-cycle.sh <cycle-id> [analysis|audit|minimal]" >&2
  exit 1
fi

case "$MODE" in
  analysis|audit|minimal) ;;
  *)
    echo "invalid export mode: $MODE" >&2
    exit 1
    ;;
esac

cd "$REPO_ROOT"
npm run --silent cli -- cycle export "$CYCLE_ID" "$MODE"
