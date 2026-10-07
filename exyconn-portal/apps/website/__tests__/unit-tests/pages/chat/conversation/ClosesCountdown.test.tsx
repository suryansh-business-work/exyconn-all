import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import { ClosesCountdown } from '../../../../../src/pages/chat/conversation/ClosesCountdown';
import { renderWithProviders } from '../../../test-utils';

const NOW = new Date('2026-10-01T10:00:00.000Z').getTime();
const inMs = (ms: number) => new Date(NOW + ms).toISOString();

const chip = (text: string) => screen.getByText(text).closest('.MuiChip-root');

describe('ClosesCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts down every second in minutes and seconds', () => {
    renderWithProviders(<ClosesCountdown expiresAt={inMs(581_000)} />);
    expect(screen.getByText('Closes in 9:41 without a message')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText('Closes in 9:40 without a message')).toBeInTheDocument();
  });

  it('rounds part of a second up', () => {
    renderWithProviders(<ClosesCountdown expiresAt={inMs(60_500)} />);
    expect(screen.getByText('Closes in 1:01 without a message')).toBeInTheDocument();
  });

  it('turns to the warning colour in the last two minutes', () => {
    renderWithProviders(<ClosesCountdown expiresAt={inMs(120_001)} />);
    expect(chip('Closes in 2:01 without a message')).toHaveClass('MuiChip-colorDefault');

    act(() => vi.advanceTimersByTime(1000));
    expect(chip('Closes in 2:00 without a message')).toHaveClass('MuiChip-colorWarning');
  });

  it('stops at 0:00 once the time is up', () => {
    renderWithProviders(<ClosesCountdown expiresAt={inMs(-5000)} />);
    expect(chip('Closes in 0:00 without a message')).toHaveClass('MuiChip-colorWarning');
  });
});
