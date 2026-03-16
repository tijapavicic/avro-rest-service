#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  ./scripts/bump-version.sh [--dry-run] [--allow-dirty] <version>

Examples:
  ./scripts/bump-version.sh 0.0.2-SNAPSHOT
  ./scripts/bump-version.sh --dry-run 1.0.0

Version format:
  X.Y.Z or X.Y.Z-SNAPSHOT
EOF
}

DRY_RUN=false
ALLOW_DIRTY=false
TARGET_VERSION=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --allow-dirty)
      ALLOW_DIRTY=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      TARGET_VERSION="$1"
      shift
      ;;
  esac
done

if [[ -z "$TARGET_VERSION" ]]; then
  usage
  exit 1
fi

if [[ ! "$TARGET_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-SNAPSHOT)?$ ]]; then
  echo "Error: invalid version '$TARGET_VERSION'. Expected X.Y.Z or X.Y.Z-SNAPSHOT." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

if [[ "$ALLOW_DIRTY" != "true" ]]; then
  if [[ -n "$(git status --porcelain)" ]]; then
    echo "Error: git working tree is not clean. Commit/stash changes or use --allow-dirty." >&2
    exit 1
  fi
fi

if [[ "$DRY_RUN" == "true" ]]; then
  echo "[dry-run] Would write '$TARGET_VERSION' to VERSION"
  echo "[dry-run] Would run: mvn -B versions:set -DnewVersion=$TARGET_VERSION -DprocessAllModules=true -DgenerateBackupPoms=false"
  exit 0
fi

printf "%s\n" "$TARGET_VERSION" > VERSION

mvn -B versions:set \
  -DnewVersion="$TARGET_VERSION" \
  -DprocessAllModules=true \
  -DgenerateBackupPoms=false

echo "Updated project version to $TARGET_VERSION"

