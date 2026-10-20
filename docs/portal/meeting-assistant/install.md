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
build was made with `MEET_EXTENSION_PUBLIC_KEY`; otherwise the id depends on the folder path and
must be listed in the server's `MEET_ASSISTANT_EXTENSION_IDS` (see [api.md](api.md)).

## Using it in a meeting

- Join a Google Meet call. The floating icon appears bottom-left (drag it, or focus it and use
  the arrow keys). Its colour **and** its label show the state: Idle, Attention, Recording,
  Processing, Error.
- If Meet transcription is off, a banner (and, if enabled, a notification) reminds you at the
  company's interval, at most the company's maximum per meeting. Remind later, Snooze, Dismiss.
- To record: open the extension **from the toolbar on that tab** (Chrome requires it for tab
  audio), click **Start**, and confirm participants were told the call is being recorded,
  saved and transcribed. Pause/Stop at any time; recording stops on its own when you leave.
- After the call the notes, decisions and checklist appear in the portal within minutes.

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| "This extension is not one this portal trusts" on sign-in | Its id is not in `MEET_ASSISTANT_EXTENSION_IDS`. Add it (shown in `chrome://extensions`) and redeploy, or use a build made with the fixed key. |
| Sign-in window closes with no result | Pop-ups blocked or the portal session expired: sign in to employee.exyconn.com first, then retry. |
| "Start" says tab capture was refused | Open the extension from the toolbar while on the Meet tab, then Start. |
| Microphone not captured | Allow the microphone for the extension when Chrome asks; check `chrome://settings/content/microphone`. |
| Status stays UNKNOWN | Meet's controls are not visible or the UI changed/is not in English. Reminders only fire for a verified OFF. |
| "Consent required" on upload | Confirm the consent dialog again; recording never starts without it. |
| "Budget exceeded" / recording stops | The company's monthly AI budget or maximum meeting length was reached (AI › Meeting Assistant › Settings). |
| Notes never appear | Check the meeting's Activity tab: no transcript (nothing recorded and no official transcript) means no notes — by design. |
| Official transcript import failed | Reconnect Google Meet on the Chrome extension page; the organizer's Workspace must allow transcripts. |
