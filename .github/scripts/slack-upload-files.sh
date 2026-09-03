#!/usr/bin/env bash
# Upload the given files to one Slack channel as a single message.
# Uses Slack's external-upload flow (files.getUploadURLExternal → PUT bytes →
# files.completeUploadExternal); incoming webhooks cannot carry attachments.
#
# Env: SLACK_BOT_TOKEN (scopes: files:write, chat:write; bot must be in the channel)
#      SLACK_CHANNEL_ID, SLACK_MESSAGE
# Usage: slack-upload-files.sh <file> [<file> ...]
set -euo pipefail

: "${SLACK_BOT_TOKEN:?SLACK_BOT_TOKEN is required}"
: "${SLACK_CHANNEL_ID:?SLACK_CHANNEL_ID is required}"
: "${SLACK_MESSAGE:?SLACK_MESSAGE is required}"
[ "$#" -gt 0 ] || { echo "::error::no files given"; exit 1; }

slack_api() {
  curl -sS -X POST "https://slack.com/api/$1" -H "Authorization: Bearer $SLACK_BOT_TOKEN" "${@:2}"
}

assert_ok() {
  if [ "$(jq -r '.ok' <<<"$1")" != "true" ]; then
    echo "::error::Slack $2 failed: $(jq -r '.error // "unknown error"' <<<"$1")"
    exit 1
  fi
}

uploaded='[]'
for file in "$@"; do
  name=$(basename "$file")
  size=$(wc -c < "$file" | tr -d " ")
  echo "Uploading $name ($size bytes)"
  ticket=$(slack_api files.getUploadURLExternal \
    --data-urlencode "filename=$name" --data-urlencode "length=$size")
  assert_ok "$ticket" "files.getUploadURLExternal"
  curl -sS -X POST "$(jq -r '.upload_url' <<<"$ticket")" -F "file=@$file" >/dev/null
  uploaded=$(jq -c --arg id "$(jq -r '.file_id' <<<"$ticket")" --arg title "$name" \
    '. + [{id: $id, title: $title}]' <<<"$uploaded")
done

body=$(jq -nc --argjson files "$uploaded" --arg channel "$SLACK_CHANNEL_ID" --arg text "$SLACK_MESSAGE" \
  '{files: $files, channel_id: $channel, initial_comment: $text}')
done_res=$(slack_api files.completeUploadExternal -H 'Content-Type: application/json' --data "$body")
assert_ok "$done_res" "files.completeUploadExternal"
echo "Posted $# file(s) to Slack channel $SLACK_CHANNEL_ID"
