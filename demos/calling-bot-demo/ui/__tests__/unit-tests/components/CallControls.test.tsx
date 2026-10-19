import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CallButton } from '../../../src/components/CallButton';
import { CallStatus } from '../../../src/components/CallStatus';
import { CallTimer } from '../../../src/components/CallTimer';
import { renderWithProviders } from '../test-utils';

describe('the call button', () => {
  it('dials when there is no call', async () => {
    const onStart = vi.fn();
    const onHangUp = vi.fn();
    renderWithProviders(<CallButton onCall={false} onStart={onStart} onHangUp={onHangUp} />);
    await userEvent.click(screen.getByRole('button', { name: 'Start the call' }));
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onHangUp).not.toHaveBeenCalled();
    expect(screen.getByText('Start the call')).toBeInTheDocument();
  });

  it('hangs up during a call', async () => {
    const onStart = vi.fn();
    const onHangUp = vi.fn();
    renderWithProviders(<CallButton onCall onStart={onStart} onHangUp={onHangUp} />);
    await userEvent.click(screen.getByRole('button', { name: 'Hang up' }));
    expect(onHangUp).toHaveBeenCalledTimes(1);
    expect(onStart).not.toHaveBeenCalled();
  });
});

describe('the call timer', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts the live call up as mm:ss every second', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-01T10:01:05Z'));
    const { unmount } = renderWithProviders(
      <CallTimer startedAt={Date.parse('2026-10-01T10:00:00Z')} />,
    );
    expect(screen.getByLabelText('Call length')).toHaveTextContent('01:05');
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByLabelText('Call length')).toHaveTextContent('01:06');
    unmount();
  });

  it('never shows a negative length', () => {
    renderWithProviders(<CallTimer startedAt={Date.now() + 60_000} />);
    expect(screen.getByLabelText('Call length')).toHaveTextContent('00:00');
  });
});

describe('the call status', () => {
  it.each([
    ['idle', 'Ready to call'],
    ['connecting', 'Connecting…'],
    ['ended', 'Call ended'],
  ] as const)('names the %s phase without a timer', (phase, label) => {
    renderWithProviders(<CallStatus phase={phase} startedAt={Date.now()} />);
    expect(screen.getByRole('status')).toHaveTextContent(label);
    expect(screen.queryByLabelText('Call length')).not.toBeInTheDocument();
  });

  it('times a live call once it has a start', () => {
    const { rerender } = renderWithProviders(<CallStatus phase="live" startedAt={null} />);
    expect(screen.getByRole('status')).toHaveTextContent('On the call');
    expect(screen.queryByLabelText('Call length')).not.toBeInTheDocument();
    rerender(<CallStatus phase="live" startedAt={Date.now()} />);
    expect(screen.getByLabelText('Call length')).toBeInTheDocument();
  });
});
