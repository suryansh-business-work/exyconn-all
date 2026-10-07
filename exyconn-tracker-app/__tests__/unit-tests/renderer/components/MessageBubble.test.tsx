// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { TrackerMessage } from '@shared/types';
import MessageBubble from '../../../../src/renderer/components/MessageBubble';
import { render, unmountAll } from '../../test-utils';
import { pageText } from './fixtures';

afterEach(unmountAll);

function message(overrides: Partial<TrackerMessage> = {}): TrackerMessage {
  return {
    id: 'm1',
    kind: 'CHAT',
    direction: 'TO_EMPLOYEE',
    title: '',
    body: 'Welcome aboard.',
    authorName: 'Tracker desk',
    readAt: null,
    createdAt: '2026-09-14T10:30:00.000Z',
    ...overrides,
  };
}

describe('MessageBubble', () => {
  it('names who wrote a message to the employee, and when', async () => {
    await render(<MessageBubble message={message()} timezone="UTC" />);
    expect(pageText()).toBe('Welcome aboard.Tracker desk · Mon 14 Sep, 10:30 AM');
  });

  it('falls back to the workspace for a departed author, and heads a notice with its title', async () => {
    await render(
      <MessageBubble
        message={message({ kind: 'NOTICE', title: 'Holiday hours', authorName: '' })}
        timezone="UTC"
      />,
    );
    expect(document.querySelector('.MuiTypography-subtitle2')?.textContent).toBe('Holiday hours');
    expect(pageText()).toContain('Your workspace · Mon 14 Sep, 10:30 AM');
  });

  it('leaves the author off the employee’s own messages', async () => {
    await render(
      <MessageBubble
        message={message({ direction: 'TO_ADMIN', body: 'Thanks!' })}
        timezone="UTC"
      />,
    );
    expect(pageText()).toBe('Thanks!Mon 14 Sep, 10:30 AM');
  });
});
