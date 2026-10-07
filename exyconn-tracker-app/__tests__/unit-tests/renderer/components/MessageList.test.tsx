// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MessageList from '../../../../src/renderer/components/MessageList';
import type { TrackerMessage } from '@shared/types';
import { render, unmountAll } from '../../test-utils';
import { pageText } from './fixtures';

const scrollIntoView = vi.fn();

beforeEach(() => {
  scrollIntoView.mockClear();
  Element.prototype.scrollIntoView = scrollIntoView;
});
afterEach(unmountAll);

function message(id: string, body: string): TrackerMessage {
  return {
    id,
    kind: 'CHAT',
    direction: 'TO_EMPLOYEE',
    title: '',
    body,
    authorName: 'Tracker desk',
    readAt: null,
    createdAt: '2026-09-14T10:30:00.000Z',
  };
}

const EMPTY = { emptyTitle: 'No messages yet', emptyBody: 'Write to your workspace below.' };

describe('MessageList', () => {
  it('holds skeleton rows while the thread loads', async () => {
    await render(<MessageList messages={[]} loading timezone="UTC" {...EMPTY} />);
    expect(document.querySelectorAll('.MuiSkeleton-root')).toHaveLength(3);
    expect(pageText()).not.toContain('No messages yet');
  });

  it('says what an empty thread should say', async () => {
    await render(<MessageList messages={[]} loading={false} timezone="UTC" {...EMPTY} />);
    expect(pageText()).toBe('No messages yetWrite to your workspace below.');
  });

  it('lists the thread and scrolls to its newest line', async () => {
    const thread = [message('m1', 'Welcome aboard.'), message('m2', 'Your hours are approved.')];
    await render(<MessageList messages={thread} loading={false} timezone="UTC" {...EMPTY} />);
    expect(pageText()).toContain('Welcome aboard.');
    expect(pageText()).toContain('Your hours are approved.');
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'end' });
  });
});
