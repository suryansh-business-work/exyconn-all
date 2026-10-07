import { act, render, screen } from '@testing-library/react';
import { formatDateTime } from '@exyconn/tracker-core';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ChatKeyboardView } from '../../../../src/components/messages/ChatKeyboardView';
import { MessageBubble } from '../../../../src/components/messages/MessageBubble';
import { MessageList } from '../../../../src/components/messages/MessageList';
import { rnTest } from '../../mocks/react-native/apis';
import { renderWithProviders } from '../../test-utils';
import { getByA11yLabel, message, queryByA11yLabel } from '../state';

vi.mock('react-native', async (load) => ({
  ...(await load<Record<string, unknown>>()),
  KeyboardAvoidingView: ({
    children,
    behavior,
    keyboardVerticalOffset,
  }: Readonly<{ children?: ReactNode; behavior?: string; keyboardVerticalOffset?: number }>) => (
    <div data-testid="keyboard-view" data-behavior={behavior} data-offset={keyboardVerticalOffset}>
      {children}
    </div>
  ),
}));

const ZONE = 'Asia/Kolkata';

describe('MessageBubble', () => {
  it('names the workspace author and the time on a message to the employee', () => {
    const line = message();
    const when = formatDateTime(line.createdAt, ZONE);
    renderWithProviders(<MessageBubble message={line} timezone={ZONE} />);
    expect(screen.getByText(line.body)).toBeInTheDocument();
    expect(screen.getByText(`Ravi · ${when}`)).toBeInTheDocument();
    expect(getByA11yLabel(`Ravi, ${when}.  ${line.body}`)).toBeInTheDocument();
  });

  it('speaks for a departed author as the workspace', () => {
    const line = message({ authorName: '' });
    const when = formatDateTime(line.createdAt, ZONE);
    renderWithProviders(<MessageBubble message={line} timezone={ZONE} />);
    expect(screen.getByText(`Your workspace · ${when}`)).toBeInTheDocument();
  });

  it('shows only the time on the employee’s own line, but says "You" aloud', () => {
    const line = message({ direction: 'TO_ADMIN', body: 'On my way.' });
    const when = formatDateTime(line.createdAt, ZONE);
    renderWithProviders(<MessageBubble message={line} timezone={ZONE} />, { themeMode: 'dark' });
    expect(screen.getByText(when)).toBeInTheDocument();
    expect(getByA11yLabel(`You, ${when}.  On my way.`)).toBeInTheDocument();
  });

  it('heads an announcement with its title', () => {
    const line = message({ kind: 'NOTICE', title: 'Office closed', body: 'Friday is a holiday.' });
    const when = formatDateTime(line.createdAt, ZONE);
    renderWithProviders(<MessageBubble message={line} timezone={ZONE} />);
    expect(screen.getByText('Office closed')).toBeInTheDocument();
    expect(getByA11yLabel(`Ravi, ${when}. Office closed Friday is a holiday.`)).toBeInTheDocument();
  });
});

describe('MessageList', () => {
  const props = { timezone: ZONE, emptyTitle: 'No messages yet', emptyBody: 'Write below.' };

  it('holds the thread’s place with placeholders while it is read', () => {
    renderWithProviders(<MessageList {...props} messages={[message()]} loading />);
    expect(queryByA11yLabel('Loading messages')).not.toBeNull();
    expect(screen.queryByText(message().body)).toBeNull();
  });

  it('says what an empty thread means', () => {
    renderWithProviders(<MessageList {...props} messages={[]} loading={false} />);
    expect(screen.getByText('No messages yet')).toBeInTheDocument();
    expect(screen.getByText('Write below.')).toBeInTheDocument();
  });

  it('lists the thread oldest first', () => {
    const thread = [
      message({ id: 'm1', body: 'First line' }),
      message({ id: 'm2', body: 'Second line', direction: 'TO_ADMIN' }),
    ];
    renderWithProviders(<MessageList {...props} messages={thread} loading={false} />);
    const first = screen.getByText('First line');
    const second = screen.getByText('Second line');
    expect(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByText('No messages yet')).toBeNull();
  });
});

describe('ChatKeyboardView', () => {
  it('offsets the keyboard by where the view actually sits on screen', () => {
    render(
      <ChatKeyboardView>
        <span>composer</span>
      </ChatKeyboardView>,
    );
    const keyboard = screen.getByTestId('keyboard-view');
    expect(keyboard.dataset.behavior).toBe('padding');
    expect(keyboard.dataset.offset).toBe('0');
    expect(screen.getByText('composer')).toBeInTheDocument();

    const frame = keyboard.parentElement;
    if (frame === null) {
      throw new Error('The measured frame is missing.');
    }
    frame.getBoundingClientRect = () => ({
      x: 0,
      y: 88,
      width: 390,
      height: 700,
      top: 88,
      left: 0,
      right: 390,
      bottom: 788,
      toJSON: () => ({}),
    });
    act(() => {
      rnTest.layout(frame, { width: 390, height: 700 });
    });
    expect(screen.getByTestId('keyboard-view').dataset.offset).toBe('88');
  });
});
