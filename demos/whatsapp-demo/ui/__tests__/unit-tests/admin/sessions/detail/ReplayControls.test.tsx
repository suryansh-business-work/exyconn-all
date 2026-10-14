import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReplayControls } from '../../../../../src/admin/sessions/detail/ReplayControls';
import type { Replay } from '../../../../../src/admin/sessions/detail/useReplay';
import { renderWithProviders } from '../../../test-utils';

const replay = (overrides: Partial<Replay> = {}): Replay => ({
  index: -1,
  playing: false,
  play: vi.fn(),
  pause: vi.fn(),
  next: vi.fn(),
  previous: vi.fn(),
  reset: vi.fn(),
  ...overrides,
});

const button = (name: string) => screen.getByRole('button', { name });

describe('ReplayControls', () => {
  it('offers to replay a session that has not started, counting its events', async () => {
    const user = userEvent.setup();
    const state = replay();
    renderWithProviders(<ReplayControls replay={state} count={4} />);
    expect(screen.getByRole('status')).toHaveTextContent('4 events');
    expect(button('Previous event')).toBeDisabled();
    expect(button('Next event')).toBeEnabled();
    expect(button('Stop the replay')).toBeDisabled();
    await user.click(button('Replay'));
    expect(state.play).toHaveBeenCalledTimes(1);
  });

  it('cannot replay a session without events', () => {
    renderWithProviders(<ReplayControls replay={replay()} count={0} />);
    expect(button('Replay')).toBeDisabled();
    expect(button('Next event')).toBeDisabled();
  });

  it('pauses a running replay and says where it is', async () => {
    const user = userEvent.setup();
    const state = replay({ index: 1, playing: true });
    renderWithProviders(<ReplayControls replay={state} count={4} />);
    expect(screen.getByRole('status')).toHaveTextContent('Event 2 of 4');
    expect(screen.queryByRole('button', { name: 'Replay' })).not.toBeInTheDocument();
    await user.click(button('Pause'));
    expect(state.pause).toHaveBeenCalledTimes(1);
  });

  it('steps back and forth and stops a replay in the middle', async () => {
    const user = userEvent.setup();
    const state = replay({ index: 1 });
    renderWithProviders(<ReplayControls replay={state} count={3} />);
    await user.click(button('Previous event'));
    await user.click(button('Next event'));
    await user.click(button('Stop the replay'));
    expect(state.previous).toHaveBeenCalledTimes(1);
    expect(state.next).toHaveBeenCalledTimes(1);
    expect(state.reset).toHaveBeenCalledTimes(1);
  });

  it('has nowhere further to go on the last event', () => {
    renderWithProviders(<ReplayControls replay={replay({ index: 2 })} count={3} />);
    expect(button('Next event')).toBeDisabled();
    expect(button('Previous event')).toBeEnabled();
    expect(screen.getByRole('status')).toHaveTextContent('Event 3 of 3');
  });
});
