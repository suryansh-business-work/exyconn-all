import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrackerMessageThreadList } from '../../../../src/pages/tracker/TrackerMessageThreadList';
import { renderWithProviders } from '../../test-utils';
import { thread } from './tracker.fixtures';

vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('./tracker.mocks')).settingsModuleMock(),
);

const threads = [
  thread(),
  thread({
    userId: 'u2',
    userName: 'Dev Mehta',
    lastMessageBody: 'Thanks!',
    lastMessageAt: null,
    unread: 0,
  }),
];

describe('TrackerMessageThreadList', () => {
  it('explains where conversations come from when there are none', () => {
    renderWithProviders(
      <TrackerMessageThreadList threads={[]} selectedUserId={null} onSelect={vi.fn()} />,
    );
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
    expect(
      screen.getByText('A thread appears here as soon as an employee writes from their tracker.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows each conversation with its last line, when it was sent and what is unread', () => {
    renderWithProviders(
      <TrackerMessageThreadList threads={threads} selectedUserId={null} onSelect={vi.fn()} />,
    );
    const asha = screen.getByRole('button', { name: /Asha Rao/ });
    expect(asha).toHaveTextContent('Is Friday a holiday?');
    expect(asha).toHaveTextContent('at 2026-01-15T10:00:00.000Z');
    expect(within(asha).getByText('2')).toBeInTheDocument();

    const dev = screen.getByRole('button', { name: /Dev Mehta/ });
    expect(dev).toHaveTextContent('Thanks!');
    expect(dev).not.toHaveTextContent('at ');
  });

  it('highlights the open conversation', () => {
    renderWithProviders(
      <TrackerMessageThreadList threads={threads} selectedUserId="u2" onSelect={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: /Dev Mehta/ })).toHaveClass('Mui-selected');
    expect(screen.getByRole('button', { name: /Asha Rao/ })).not.toHaveClass('Mui-selected');
  });

  it('opens the conversation that is clicked', async () => {
    const onSelect = vi.fn();
    renderWithProviders(
      <TrackerMessageThreadList threads={threads} selectedUserId={null} onSelect={onSelect} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Asha Rao/ }));
    expect(onSelect).toHaveBeenCalledWith('u1');
  });
});
