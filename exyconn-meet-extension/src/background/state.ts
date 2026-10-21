import { STATUS_COLORS } from '../theme/status-colors';
import type { IconStatus } from '../types/meeting';
import type { StateBroadcast, WorkerState } from '../types/messages';
import { toTabSnapshot } from './logic/snapshot';
import { getOrg, tr } from './org';
import { auth, registry } from './services';

/** The worker's view of one tab (or just the sign-in, for a tab that is not a call). */
export async function stateFor(tabId: number | null): Promise<WorkerState> {
  const signedIn = await auth.isSignedIn();
  const org = signedIn ? await getOrg() : null;
  const session = tabId === null ? null : await registry.get(tabId);
  if (session === null) {
    return { auth: { signedIn, org }, tab: null };
  }
  const owner =
    session.meetingId === null
      ? null
      : await registry.captureOwner(session.meetingId, session.tabId);
  return { auth: { signedIn, org }, tab: toTabSnapshot(session, owner !== null) };
}

/** Badge text per state; idle shows none. Short codes, not words: the badge fits ~4 glyphs. */
const BADGE_TEXT: Readonly<Record<IconStatus, string>> = {
  IDLE: '',
  ATTENTION: '!',
  ACTIVE: 'REC',
  PROCESSING: '…',
  ERROR: '×',
};

async function paintBadge(state: WorkerState, tabId: number): Promise<void> {
  const status = state.tab?.iconStatus ?? 'IDLE';
  await chrome.action.setBadgeText({ tabId, text: BADGE_TEXT[status] });
  await chrome.action.setBadgeBackgroundColor({ tabId, color: STATUS_COLORS[status].fill });
  await chrome.action.setBadgeTextColor({ tabId, color: STATUS_COLORS[status].ink });
  const title =
    state.tab?.captureState === 'RECORDING'
      ? await tr('Exyconn Meeting Assistant: transcribing this call')
      : await tr('Exyconn Meeting Assistant');
  await chrome.action.setTitle({ tabId, title });
}

/** Tells a receiver that may not exist (no popup open, tab reloading) — that is not an error. */
async function deliver(send: () => Promise<unknown>): Promise<void> {
  try {
    await send();
  } catch {
    // Nobody is listening right now; the next open asks for the state itself.
  }
}

/**
 * Pushes a tab's fresh state to its Meet page and to an open popup, and repaints the
 * toolbar badge — the visible recording indicator outside the page.
 */
export async function publish(tabId: number): Promise<void> {
  const state = await stateFor(tabId);
  const message: StateBroadcast = { type: 'state/changed', state };
  await deliver(() => chrome.tabs.sendMessage(tabId, message));
  await deliver(() => chrome.runtime.sendMessage(message));
  await deliver(() => paintBadge(state, tabId));
}
