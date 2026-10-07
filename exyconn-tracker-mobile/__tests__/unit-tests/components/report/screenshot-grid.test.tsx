import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ScreenshotGrid } from '../../../../src/components/report/ScreenshotGrid';
import { renderWithProviders } from '../../test-utils';
import { screenshot } from './fixtures';

const SHOTS = [
  screenshot('shot-1', '2026-02-03T10:42:00.000Z', { activityPercent: 85 }),
  screenshot('shot-2', '2026-02-03T14:05:00.000Z', { activityPercent: 40 }),
];

describe('ScreenshotGrid', () => {
  it('says so when the day has no screenshots', () => {
    renderWithProviders(<ScreenshotGrid shots={[]} timezone="UTC" onOpen={vi.fn()} />);

    expect(screen.getByText('No screenshots on this day.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('captions each thumbnail with its time, in the employee’s zone, and its activity', () => {
    renderWithProviders(<ScreenshotGrid shots={SHOTS} timezone="Asia/Kolkata" onOpen={vi.fn()} />);

    expect(screen.getByText('4:12 PM · 85% active')).toBeInTheDocument();
    expect(screen.getByText('7:35 PM · 40% active')).toBeInTheDocument();
    expect(screen.getByAltText('Screenshot captured at 4:12 PM')).toHaveAttribute(
      'src',
      'https://cdn.example.test/shot-1.png',
    );
  });

  it('opens the gallery from any thumbnail', () => {
    const onOpen = vi.fn();
    renderWithProviders(<ScreenshotGrid shots={SHOTS} timezone="UTC" onOpen={onOpen} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Open my screenshots — this one was captured at 2:05 PM',
      }),
    );

    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
