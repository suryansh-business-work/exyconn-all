#!/usr/bin/env bash
# Upload the given files to one or more Slack channels, as a single message each.
# Uses Slack's external-upload flow (files.getUploadURLExternal → PUT bytes →
# files.completeUploadExternal); incoming webhooks cannot carry attachments.
#
# A file set can only be completed once, so each channel gets its own upload pass.
# Channel counts here are small (a handful at most), which keeps that honest.
#
# Env: SLACK_BOT_TOKEN (scopes: files:write, chat:write; bot must be in each channel)
#      SLACK_CHANNEL_IDS (one id, or several separated by commas)
#      SLACK_MESSAGE
# Usage: slack-upload-files.sh <file> [<file> ...]
set -euo pipefail

: "${SLACK_BOT_TOKEN:?SLACK_BOT_TOKEN is required}"
: "${SLACK_CHANNEL_IDS:?SLACK_CHANNEL_IDS is required}"
: "${SLACK_MESSAGE:?SLACK_MESSAGE is required}"
[ "$#" -gt 0 ] || { echo "::error::no files given"; exit 1; }

slack_api() {
  curl -sS -X POST "https://slack.com/api/$1" -H "Authorization: Bearer $SLACK_BOT_TOKEN" "${@:2}"
}

assert_ok() {
  if [ "$(jq -r '.ok' <<<"$1")" = "true" ]; then
    return
  fi
  local err
  err=$(jq -r '.error // "unknown error"' <<<"$1")
  # By far the most common cause, and the one whose Slack error name says least
  # about the fix: the bot has to be invited before it can post anywhere.
  if [ "$err" = "not_in_channel" ] || [ "$err" = "channel_not_found" ]; then
    echo "::error::Slack rejected the post to ${3:-the channel} with \"$err\". The bot could not join it either, so it is a private channel or the token is missing the channels:join scope. Fix it in one of two ways: open that channel in Slack and run /invite @<your-bot>, or add the channels:join scope to the bot token and reinstall the app."
  else
    echo "::error::Slack $2 failed: $err"
  fi
  exit 1
}

# Joins a public channel, so a build does not fail for want of an /invite. Slack
# only lets a bot add itself to public channels, so a failure here is expected for
# a private one and is left to the upload to report properly.
join_channel() {
  local channel="$1" joined
  joined=$(slack_api conversations.join --data-urlencode "channel=$channel")
  if [ "$(jq -r '.ok' <<<"$joined")" = "true" ]; then
    return
  fi
  echo "Note: could not join $channel ($(jq -r '.error // "unknown error"' <<<"$joined")) — continuing, the bot may already be a member."
}

# Posts every given file into one channel.
post_to_channel() {
  local channel="$1"
  shift
  local uploaded='[]'

  join_channel "$channel"

  for file in "$@"; do
    local name size ticket
    name=$(basename "$file")
    size=$(wc -c < "$file" | tr -d ' ')
    echo "Uploading $name ($size bytes) to $channel"
    ticket=$(slack_api files.getUploadURLExternal \
      --data-urlencode "filename=$name" --data-urlencode "length=$size")
    assert_ok "$ticket" "files.getUploadURLExternal" "$channel"
    curl -sS -X POST "$(jq -r '.upload_url' <<<"$ticket")" -F "file=@$file" >/dev/null
    uploaded=$(jq -c --arg id "$(jq -r '.file_id' <<<"$ticket")" --arg title "$name" \
      '. + [{id: $id, title: $title}]' <<<"$uploaded")
  done

  local body result
  body=$(jq -nc --argjson files "$uploaded" --arg channel "$channel" --arg text "$SLACK_MESSAGE" \
    '{files: $files, channel_id: $channel, initial_comment: $text}')
  result=$(slack_api files.completeUploadExternal -H 'Content-Type: application/json' --data "$body")
  assert_ok "$result" "files.completeUploadExternal" "$channel"
  echo "Posted $# file(s) to Slack channel $channel"
}

IFS=',' read -ra channels <<<"$SLACK_CHANNEL_IDS"
for channel in "${channels[@]}"; do
  trimmed="${channel//[[:space:]]/}"
  [ -n "$trimmed" ] || continue
  post_to_channel "$trimmed" "$@"
done
