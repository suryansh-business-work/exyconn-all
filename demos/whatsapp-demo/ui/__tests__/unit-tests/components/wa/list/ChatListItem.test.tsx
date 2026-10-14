import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ChatMessage } from '@exyconn/wa-flow';
import { ChatListItem } from '../../../../../src/components/wa/list/ChatListItem';
import { renderWithProviders } from '../../../test-utils';
import { bundle, message } from '../wa-ui.fixtures';

interface Options {
  last?: ChatMessage;
  unread?: number;
  typing?: boolean;
  selected?: boolean;
  verified?: boolean;
}

function renderItem({ last, unread = 0, typing = false, selected = false, verified }: Options) {
  const onOpen = vi.fn();
  renderWithProviders(
    <ChatListItem
      bundle={bundle({}, verified === undefined ? {} : { verified })}
      last={last}
      unread={unread}
      typing={typing}
      selected={selected}
      timeLabel="10:42"
      onOpen={onOpen}
    />,
  );
  return onOpen;
}

describe('ChatListItem', () => {
  it('shows the business, its last message, the time and the unread count', async () => {
    const onOpen = renderItem({
      last: message('m1', 1, { type: 'text', text: 'See you' }),
      unread: 3,
    });
    const row = screen.getByRole('button', { name: 'City Clinic, 3 unread' });
    expect(row).toHaveTextContent('City Clinic');
    expect(row).toHaveTextContent('See you');
    expect(row).toHaveTextContent('10:42');
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByTitle('Verified business')).toBeInTheDocument();
    await userEvent.setup().click(row);
    expect(onOpen).toHaveBeenCalledWith('clinic');
  });

  it('falls back to the business tagline before there are messages', () => {
    renderItem({ verified: false });
    expect(screen.getByText('Care close to home')).toBeInTheDocument();
    expect(screen.queryByTitle('Verified business')).not.toBeInTheDocument();
  });

  it('shows typing… instead of the last message and hides the ticks', () => {
    const last = {
      ...message('m1', 1, { type: 'text', text: 'Hi' }, 'user'),
      status: 'read' as const,
    };
    renderItem({ last, typing: true });
    expect(screen.getByText('typing…')).toBeInTheDocument();
    expect(screen.queryByText('Hi')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Read')).not.toBeInTheDocument();
  });

  it("shows the ticks on the viewer's own last message", () => {
    const last = {
      ...message('m1', 1, { type: 'text', text: 'Hi' }, 'user'),
      status: 'read' as const,
    };
    renderItem({ last });
    expect(screen.getByTitle('Read')).toBeInTheDocument();
  });

  it('shows no ticks on a user message without a status', () => {
    renderItem({ last: message('m1', 1, { type: 'text', text: 'Hi' }, 'user') });
    expect(screen.queryByTitle(/Sent|Delivered|Read/)).not.toBeInTheDocument();
  });

  it('marks the open chat as current and shows no badge without unread messages', () => {
    renderItem({ selected: true });
    const row = screen.getByRole('button', { name: 'City Clinic, 0 unread' });
    expect(row).toHaveAttribute('aria-current', 'true');
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('is not marked current when another chat is open', () => {
    renderItem({});
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-current');
  });
});
