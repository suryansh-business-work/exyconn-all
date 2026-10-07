// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { TrackerMessage, TrackerMessageKind } from '@shared/types';
import MessagesScreen from '../../../../src/renderer/screens/MessagesScreen';
import {
  clickElement,
  installDomShims,
  installTracker,
  overrideTracker,
  render,
  settle,
  trackerState,
  unmountAll,
} from '../../test-utils';

beforeAll(installDomShims);
afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

const NOTICE: TrackerMessage = {
  id: 'n1',
  kind: 'NOTICE',
  direction: 'TO_EMPLOYEE',
  title: 'Office closed Friday',
  body: 'The office is closed this Friday.',
  authorName: 'HR',
  readAt: null,
  createdAt: '2026-09-14T10:00:00.000Z',
};

async function open(
  getMessages?: (kind: TrackerMessageKind) => Promise<TrackerMessage[]>,
): Promise<void> {
  installTracker(trackerState('idle'));
  if (getMessages !== undefined) {
    overrideTracker({ getMessages });
  }
  await render(<MessagesScreen timezone="UTC" />);
  await settle();
}

function tab(label: string): HTMLElement {
  const found = [...document.querySelectorAll<HTMLElement>('[role="tab"]')].find(
    (node) => node.textContent === label,
  );
  if (found === undefined) {
    throw new Error(`No tab "${label}"`);
  }
  return found;
}

function panel(): HTMLElement | null {
  return document.querySelector('[role="tabpanel"]');
}

describe('MessagesScreen', () => {
  it('opens on the chat thread, with a box to write in', async () => {
    await open();
    expect(tab('Chat').getAttribute('aria-selected')).toBe('true');
    expect(panel()?.getAttribute('aria-labelledby')).toBe(tab('Chat').id);
    expect(panel()?.textContent).toContain('Welcome aboard.');
    expect(document.querySelector('[aria-label="Send message"]')).not.toBeNull();
  });

  it('says how to start a conversation when the thread is empty', async () => {
    await open(() => Promise.resolve([]));
    expect(panel()?.textContent).toContain('No messages yet');
    expect(panel()?.textContent).toContain('They can reply from the portal.');
  });

  it('shows announcements read-only on their own tab', async () => {
    const getMessages = vi.fn((kind: TrackerMessageKind) =>
      Promise.resolve(kind === 'NOTICE' ? [NOTICE] : []),
    );
    await open(getMessages);
    await clickElement(tab('Announcements'));
    await settle();
    expect(getMessages).toHaveBeenLastCalledWith('NOTICE');
    expect(panel()?.getAttribute('aria-labelledby')).toBe(tab('Announcements').id);
    expect(panel()?.textContent).toContain('The office is closed this Friday.');
    expect(document.querySelector('[aria-label="Send message"]')).toBeNull();
  });

  it('says where announcements will appear when there are none', async () => {
    await open(() => Promise.resolve([]));
    await clickElement(tab('Announcements'));
    await settle();
    expect(panel()?.textContent).toContain('No announcements');
  });

  it('explains when the messages cannot be read', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await open(() => Promise.reject(new Error('Offline')));
    expect(document.querySelector('.MuiAlert-colorError')?.textContent).toBe(
      'Could not load your messages. Check your connection and try again.',
    );
  });
});
