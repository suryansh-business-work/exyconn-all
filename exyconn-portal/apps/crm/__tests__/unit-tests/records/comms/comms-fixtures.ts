import { act, renderHook } from '@testing-library/react';
import {
  closeComms,
  maximizeDock,
  moveDock,
  resizeDock,
  useCommsDock,
  type CommsPanel,
  type CommsRequest,
} from '../../../../src/records/comms/commsStore';

/** A request for Acme's contact record on `channel`, with two numbers and one address. */
export function commsRequest(overrides: Partial<CommsRequest> = {}): CommsRequest {
  return {
    channel: 'SMS',
    object: 'CONTACT',
    id: 'c-1',
    name: 'Ada Lovelace',
    phones: ['+1 (415) 555-0100', '+44 20 7946 0958'],
    emails: ['ada@example.com'],
    ...overrides,
  };
}

/** Keys of panels built here: their memory (drafts, call status) is forgotten on reset. */
const builtKeys = new Set<string>();

/** A panel as the store holds it, expanded and with focus already taken. */
export function commsPanel(overrides: Partial<CommsPanel> = {}): CommsPanel {
  const request = commsRequest(overrides);
  const key = `${request.channel}:${request.object}:${request.id}`;
  builtKeys.add(key);
  return {
    ...request,
    key,
    minimized: false,
    focusPending: false,
    ...overrides,
  };
}

/**
 * The dock store is module state: close every open panel, forget the memory of those and of
 * every panel built by {@link commsPanel}, and re-dock it.
 */
export function resetDock(): void {
  const { result, unmount } = renderHook(() => useCommsDock());
  act(() => {
    const keys = new Set([...builtKeys, ...result.current.panels.map((panel) => panel.key)]);
    for (const key of keys) {
      closeComms(key);
    }
    moveDock(null);
    resizeDock(null);
    maximizeDock(false);
  });
  unmount();
}
