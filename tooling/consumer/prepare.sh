#!/usr/bin/env bash
# Build the first-call app outside the monorepo against this run's npm tarballs.
set -euo pipefail
if (( $# < 2 )); then
  echo "Usage: prepare.sh EMPTY_DIRECTORY ABSOLUTE_PATH_TO_TARBALL..." >&2
  exit 2
fi
destination=$1
shift
harness=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$destination"
if [[ -n "$(ls -A "$destination")" ]]; then
  echo "Use an empty directory outside the source workspace." >&2
  exit 2
fi
sample="$harness/../../examples/first-call"
cp -R "$sample/package.json" "$sample/pages" "$destination/"
cp "$harness/probe.jsx" "$destination/pages/probe.jsx"
cp "$harness/check.mjs" "$destination/check.mjs"
cd "$destination"
npm install --no-fund --no-audit --save-exact playwright@1.65.1 "$@"
node --input-type=module - "$@" <<'JS'
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
const lock = JSON.parse(readFileSync('package-lock.json'));
for (const tarball of process.argv.slice(2)) {
  const integrity = 'sha512-' + createHash('sha512').update(readFileSync(tarball)).digest('base64');
  const installed = Object.entries(lock.packages).filter(([, p]) => p.integrity === integrity);
  assert.equal(installed.length, 1, 'Expected one installed copy of ' + tarball);
  console.log('Installed source tarball:', installed[0][0]);
}
JS
NEXT_TELEMETRY_DISABLED=1 npm run build
