#!/usr/bin/env bash
# Upload the given files to one or more Slack channels, as a single message each.
# Uses Slack's external-upload flow (files.getUploadURLExternal → PUT bytes →
# files.completeUploadExternal); incoming webhooks cannot carry attachments.
#
# A file set can only be completed once, so each channel gets its own upload pass.
# Channel counts here are small (a handful at most), which keeps that honest.
#
# The bot joins each public channel before uploading: an upload that ends in
# "not_in_channel" has already spent minutes pushing installer bytes, so membership is
# settled first. A private channel cannot be self-joined — invite the bot there.
#
# Env: SLACK_BOT_TOKEN (scopes: files:write, chat:write, channels:join)
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
    echo "::error::Slack rejected the post to ${3:-the channel} with \"$err\" — the bot is not a member of it. Open that channel in Slack and run /invite @<your-bot>, then re-run this workflow."
  else
    echo "::error::Slack $2 failed: $err"
  fi
  exit 1
}

# Settles membership before any bytes move. conversations.join is idempotent on a
# public channel, so this both fixes the common "the bot was never invited" case and
# turns a wrong channel id into an instant failure instead of one that lands after the
# installers have been uploaded. A private channel answers
# method_not_supported_for_channel_type and a token without channels:join answers
# missing_scope — neither says the bot is absent, so those fall through to the upload
# and let files.completeUploadExternal give the real verdict.
join_channel() {
  local channel="$1" result err
  result=$(slack_api conversations.join --data-urlencode "channel=$channel")
  if [ "$(jq -r '.ok' <<<"$result")" = "true" ]; then
    return
  fi
  err=$(jq -r '.error // "unknown error"' <<<"$result")
  case "$err" in
    method_not_supported_for_channel_type | missing_scope | not_allowed_token_type)
      echo "::notice::Cannot self-join $channel ($err) — relying on an existing invite. Grant the bot channels:join, or /invite it to that channel."
      ;;
    *)
      assert_ok "$result" "conversations.join" "$channel"
      ;;
  esac
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
    curl -sS --fail-with-body -X POST "$(jq -r '.upload_url' <<<"$ticket")" -F "file=@$file" >/dev/null \
      || { echo "::error::Uploading $name to Slack's file storage failed"; exit 1; }
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
