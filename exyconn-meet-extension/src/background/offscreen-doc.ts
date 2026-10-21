import type { OffscreenCommand, WorkerReply } from '../types/messages';

const OFFSCREEN_PATH = 'offscreen.html';

let creating: Promise<void> | null = null;

async function hasDocument(): Promise<boolean> {
  const url = chrome.runtime.getURL(OFFSCREEN_PATH);
  const contexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [url],
  });
  return contexts.length > 0;
}

/** Opens the offscreen recorder document once; concurrent callers share the creation. */
export async function ensureOffscreen(): Promise<void> {
  if (await hasDocument()) {
    return;
  }
  creating ??= chrome.offscreen
    .createDocument({
      url: OFFSCREEN_PATH,
      reasons: [chrome.offscreen.Reason.USER_MEDIA],
      justification: 'Records the meeting audio the user chose to transcribe.',
    })
    .finally(() => {
      creating = null;
    });
  await creating;
}

/** Closes the recorder document when no tab is capturing any more. */
export async function closeOffscreen(): Promise<void> {
  if (await hasDocument()) {
    await chrome.offscreen.closeDocument();
  }
}

/** Sends a command to the recorder; a failure there becomes an Error with its message. */
export async function commandOffscreen(command: OffscreenCommand): Promise<void> {
  const reply = (await chrome.runtime.sendMessage(command)) as WorkerReply<null> | undefined;
  if (reply?.ok === false) {
    throw new Error(reply.error);
  }
}
