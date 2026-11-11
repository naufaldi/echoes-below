#!/usr/bin/env bash
set -euo pipefail
HERE=$(cd "$(dirname "$0")/.." && pwd)
# Keep archived deliverables untouched; every reproduction gets a fresh workdir.
export ECHO_ROGUE_WORKDIR=${ECHO_ROGUE_WORKDIR:-$(mktemp -d)}
mkdir -p "$ECHO_ROGUE_WORKDIR/archer-motion-prototype-v5"
cp "$HERE/inputs/elf-rogue-contract-prototype-v5.glb" "$ECHO_ROGUE_WORKDIR/archer-motion-prototype-v5/elf-rogue-contract-prototype.glb"
"${BLENDER:-blender}" -b -t 4 --python "$HERE/scripts/weapon-fix-v6c.py"
python3 "$HERE/scripts/merge-clips-v6c.py"
python3 "$HERE/scripts/finalize-v6c.py"
printf '\nResult: %s/archer-motion-prototype-v6c\n' "$ECHO_ROGUE_WORKDIR"
