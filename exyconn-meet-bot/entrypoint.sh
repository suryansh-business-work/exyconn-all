#!/bin/sh
# One PulseAudio daemon for the container; each call gets its own null sink from it.
# Without it every call fails at its sink and says so in AI > Meeting Assistant > Logs.
pulseaudio --daemon --exit-idle-time=-1 --disallow-exit --log-target=stderr ||
  echo '{"level":"error","message":"PulseAudio did not start"}' >&2
exec node dist/main.js
