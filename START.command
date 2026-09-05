#!/bin/zsh
cd -- "${0:A:h}"
NODE_BIN="/Users/naufaldisatriya/.nvm/versions/node/v24.18.1/bin/node"
if [[ ! -x "$NODE_BIN" ]]; then
  NODE_BIN="$(command -v node)"
fi
if [[ -z "$NODE_BIN" ]]; then
  print "Node.js 24 is needed to start Echoes Below."
  read -k 1
  exit 1
fi
"$NODE_BIN" scripts/start-local.mjs --open
