# Installing the Meeting Assistant (internal build)

Chrome cannot install an extension from a downloaded ZIP or CRX in one click. Internal builds
are loaded unpacked; the public build comes from the Chrome Web Store once it is published.

## Install

1. Open **employee.exyconn.com › My meetings › Chrome extension** (or AI › Meeting Assistant ›
   Chrome Extension) and choose **Download internal ZIP**. Check the SHA-256 shown on the page
   against `shasum -a 256 <file>` (macOS/Linux) or `certutil -hashfile <file> SHA256` (Windows).
2. Extract the ZIP to a folder you will keep (Chrome loads it from there every start).
3. Open `chrome://extensions`, switch on **Developer mode** (top right).
4. Choose **Load unpacked** and select the extracted folder — the one containing `manifest.json`.
5. Pin the extension, click it and choose **Sign in**. The portal asks you to allow it; after
   **Allow** the popup shows your name and company.

To update: download the new ZIP, replace the folder's contents and click the reload icon on the
extension's card in `chrome://extensions`. Internal builds keep a fixed extension id when the
build was made with `MEET_EXTENSION_PUBLIC_KEY`; otherwise the id depends on the folder path.
Signing in with the portal email and password works with any id; only the portal-redirect
sign-in needs the id listed in the server's `MEET_ASSISTANT_EXTENSION_IDS` (see [api.md](api.md)).

## Using it in a meeting

- Join a Google Meet call. The floating icon appears bottom-left (drag it, or focus it and use
  the arrow keys). Its colour **and** its label show the state: Idle, Attention, Recording,
  Processing, Error.
- If Meet transcription is off, a banner (and, if enabled, a notification) reminds you at the
  company's interval, at most the company's maximum per meeting. Remind later, Snooze, Dismiss.
- To record: open the assistant panel in the Meet tab, click **Start transcription**, confirm
  participants were told the call is being recorded, saved and transcribed, then choose
  **Share** in Chrome's "Share this tab" dialog (keep "Also share tab audio" ticked). The live
  transcript fills in a few seconds after people speak; the screen recording uploads while
  the call runs. Pause/Stop at any time; recording stops on its own when you leave or click
  Chrome's "Stop sharing".
- When the call ends, processing starts at once: the notes, decisions and checklist appear in
  the portal within minutes, and the screen recording under the meeting's Recording tab.

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| "This extension is not one this portal trusts" on the portal-redirect sign-in | Its id is not in `MEET_ASSISTANT_EXTENSION_IDS`. Add it (shown in `chrome://extensions`) and redeploy, or use a build made with the fixed key. Email and password sign-in does not check the id. |
| Sign-in window closes with no result | Pop-ups blocked or the portal session expired: sign in to employee.exyconn.com first, then retry. |
| "Sharing this tab was cancelled" | Click Start again and choose **Share** in Chrome's dialog. |
| "Keep Also share tab audio ticked" | The tab was shared without its audio. Start again with the audio box ticked. |
| Microphone not captured | Allow the microphone for meet.google.com (the site's own permission); check `chrome://settings/content/microphone`. |
| Status stays UNKNOWN | Meet's controls are not visible or the UI changed/is not in English. Reminders only fire for a verified OFF. |
| "Consent required" on upload | Confirm the consent dialog again; recording never starts without it. |
| "Budget exceeded" / recording stops | The company's monthly AI budget or maximum meeting length was reached (AI › Meeting Assistant › Settings). |
| Notes never appear | Check the meeting's Activity tab: no transcript (nothing recorded and no official transcript) means no notes — by design. |
| Official transcript import failed | Reconnect Google Meet on the Chrome extension page; the organizer's Workspace must allow transcripts. |
