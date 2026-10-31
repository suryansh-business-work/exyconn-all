# Meeting bot

The meeting bot joins a Google Meet call as a participant ("Exyconn Notetaker" by default,
AI › Meeting Assistant › Settings › Meeting bot), posts a recording notice in the call's chat in
the meeting's language (English, Hindi or Hinglish), and records the call for the person who sent
it. The recording is that person's meeting, exactly as if their extension had recorded it: same
transcription (Hindi, English, Hinglish), same AI notes in the meeting's language, same summary
email, same MP4 download.

## Sending it

| How | Where |
| --- | --- |
| By hand | Meeting Assistant dashboard (AI portal or Employee › My meetings) › Meeting bot › paste the Meet link |
| From the calendar | Settings › "Send the bot into calendar meetings automatically": every Google Calendar event with a Meet link of a person who connected Google gets a bot one minute before it starts (declined and all-day events are skipped) |
| From Claude | MCP tools `maSendBot`, `maCancelBot`, `maBotDispatches` on `/mcp/ai` and `/mcp/all` |

The dashboard lists the latest trips: `QUEUED` → `JOINING` → `WAITING_ADMIT` (in the lobby) →
`IN_CALL` → `DONE`, or `FAILED` (with the reason) / `CANCELLED` ("Call back").

## How it works

```
portal-server                                 meet-bot container (exyconn-meet-bot)
  MaBotDispatch (one per owner + call)  ◄──── POST /meet-assistant/bot/claim  (MEET_BOT_TOKEN)
  └ startBotSession: owner's extension  ────► { meetUrl, botName, consentMessage, tokens, … }
    token (extensionId "meet-bot")              Xvfb :99+slot, PulseAudio null sink per call
                                                Chromium (Playwright) → Meet, mic + camera off
  maStartSession / maRecordConsent      ◄────   admitted → start meeting, post notice in chat
  /meet-assistant/audio (WebM 15 s)     ◄────   ffmpeg: sink → 15 s WebM/Opus chunks
  /meet-assistant/video (H.264 pieces)  ◄────   ffmpeg: display + sink → H.264/Opus Matroska, 5 s pieces
  maHeartbeat + /bot/:id/status         ◄────   every 15 s; leaves when the call ends, it is alone
  maFinalizeSession                     ◄────     for 2 min, the time cap is hit, or it is called back
```

- The bot holds the owner's narrow extension token, so it can only do what the extension can,
  and only for that person. The session is revoked when the trip ends.
- A trip silent for 5 minutes is marked failed; one nobody picked up 30 minutes after its start
  too. A session that never finalised is ended by the usual stale-session recovery.
- One owner never has two bots in the same call (a unique index on the live trip), and sending the
  bot is refused while that person's extension is already recording the call.

## Deployment

1. Add the GitHub secret `MEET_BOT_TOKEN` (any long random string, e.g. `openssl rand -hex 32`).
   The deploy writes it to `/opt/exyconn/.env`; `portal-server` and `meet-bot` both read it.
   Without it the bot service stays idle and the bot endpoints answer 401.
2. On the VPS: `sudo mkdir -p /opt/exyconn-meet-bot/profile && sudo chown -R 1001:1001 /opt/exyconn-meet-bot`.
3. Merge to `main`; `deploy.yml` builds `exyconn-meet-bot` and starts it next to the stack. It
   has no public port or domain; it only calls `portal-server` over the compose network.

Each call takes about 1 CPU and 1 GB of memory. `MEET_BOT_CONCURRENCY` (default 2) caps the calls
one container records at once; `mem_limit` is 3 GB.

## Google sign-in (recommended)

Without a Google account the bot joins as a guest: the host must admit it every time, and calls
restricted to the organisation refuse guests. Signed in, a bot invited to the calendar event joins
like any colleague.

1. Create a Google account for the bot and name it what people should see (e.g. Exyconn Notetaker).
2. Sign it in once inside the container's Chrome profile (`/data/profile`, the volume above). The
   profile uses Chrome's basic password store, so it stays valid inside the container. Run a
   one-off container with a display you can see (VNC over an SSH tunnel), open
   `https://accounts.google.com`, sign in, close Chrome; every trip copies that profile.
3. Invite the bot's address to meetings, or let the calendar scan send it.

The password is never stored by Exyconn: only the signed-in profile is.

## Known limits

- Google Meet's UI is read in English (`--lang=en-US`, `hl=en`); when Google changes it, the join
  and in-call detection (`exyconn-meet-bot/src/meet.ts`) may need updating.
- Hosts can turn off chat for participants; the recording notice is then not posted (the log says so).
- People are counted from Meet's video tiles; "alone" ends the trip after 2 minutes.
- Chromium runs with `--no-sandbox` inside the container (no user namespaces); it only opens Meet.
