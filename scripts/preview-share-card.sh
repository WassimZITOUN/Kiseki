#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-54321}"
OUT="${OUT:-/tmp/share-card.png}"
SLUG="${SHARE_CARD_SLUG:-share-card}"
URL="http://localhost:${PORT}/functions/v1/${SLUG}"

QUESTION="${QUESTION:-Test question}"
WINNER_NAME="${WINNER_NAME:-Alice}"
WINNER_VOTES="${WINNER_VOTES:-3}"
GROUP_NAME="${GROUP_NAME:-Sakura Squad}"

payload=$(
  cat <<JSON
{"question":"${QUESTION}","winnerName":"${WINNER_NAME}","winnerVoteCount":${WINNER_VOTES},"groupName":"${GROUP_NAME}"}
JSON
)

if command -v jq >/dev/null 2>&1; then
  curl -s -X POST "${URL}" \
    -H "Content-Type: application/json" \
    -d "${payload}" \
    | jq -r '.image' | base64 -d > "${OUT}"
else
  curl -s -X POST "${URL}" \
    -H "Content-Type: application/json" \
    -d "${payload}" \
    | python3 -c "import sys,json,base64; print(base64.b64decode(json.load(sys.stdin)['image']))" > "${OUT}"
fi

echo "Wrote ${OUT}"
