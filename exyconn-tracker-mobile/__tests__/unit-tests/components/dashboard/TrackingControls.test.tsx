import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import type { TrackerStatus } from '@exyconn/tracker-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TrackingControls } from '../../../../src/components/dashboard/TrackingControls';
import { resumeTracking, tracker } from '../../../../src/tracker/instance';
import { renderWithProviders } from '../../test-utils';

vi.mock('../../../../src/tracker/instance', () => ({
  tracker: { start: vi.fn(), pause: vi.fn(), stop: vi.fn() },
  resumeTracking: vi.fn(),
}));

const NAMES = ['Start', 'Pause', 'Resume', 'Stop'] as const;

function button(name: (typeof NAMES)[number]): HTMLElement {
  return screen.getByRole('button', { name });
}

/** Which of the four buttons can be pressed. */
function enabled(): string[] {
  return NAMES.filter((name) => button(name).getAttribute('aria-disabled') !== 'true');
}

function deferred() {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.mocked(tracker.start).mockResolvedValue(undefined);
  vi.mocked(tracker.stop).mockResolvedValue(undefined);
  vi.mocked(resumeTracking).mockResolvedValue(undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

/** An error that carries no text, so the screen has to fall back to its own words. */
const NO_MESSAGE = '';

describe('TrackingControls', () => {
  it.each([
    ['idle', true, ['Start']],
    ['idle', false, []],
    ['tracking', true, ['Pause', 'Stop']],
    ['paused', true, ['Resume', 'Stop']],
    ['signed-out', true, []],
  ] as [TrackerStatus, boolean, string[]][])(
    'when %s (attendance marked: %s) enables only %j',
    (status, attendanceMarked, expected) => {
      renderWithProviders(<TrackingControls status={status} attendanceMarked={attendanceMarked} />);
      expect(enabled()).toEqual(expected);
    },
  );

  it('starts tracking, holding every button while the start is in flight', async () => {
    const start = deferred();
    vi.mocked(tracker.start).mockReturnValue(start.promise);
    renderWithProviders(<TrackingControls status="idle" attendanceMarked />);
    fireEvent.click(button('Start'));
    expect(tracker.start).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(enabled()).toEqual([]));
    expect(within(button('Start')).getByRole('progressbar')).toBeInTheDocument();

    start.resolve();
    await waitFor(() => expect(enabled()).toEqual(['Start']));
  });

  it('pauses a running session', async () => {
    renderWithProviders(<TrackingControls status="tracking" attendanceMarked />);
    fireEvent.click(button('Pause'));
    await waitFor(() => expect(tracker.pause).toHaveBeenCalledTimes(1));
  });

  it('resumes through the capture-aware path, not the bare controller', async () => {
    renderWithProviders(<TrackingControls status="paused" attendanceMarked />);
    fireEvent.click(button('Resume'));
    await waitFor(() => expect(resumeTracking).toHaveBeenCalledTimes(1));
  });

  it('stops a paused session', async () => {
    renderWithProviders(<TrackingControls status="paused" attendanceMarked />);
    fireEvent.click(button('Stop'));
    await waitFor(() => expect(tracker.stop).toHaveBeenCalledTimes(1));
  });

  it('shows the controller’s own reason when an action is refused', async () => {
    vi.mocked(tracker.start).mockRejectedValue(new Error('Screen capture was declined.'));
    renderWithProviders(<TrackingControls status="idle" attendanceMarked />);
    fireEvent.click(button('Start'));
    expect(await screen.findByText('Screen capture was declined.')).toBeInTheDocument();
  });

  it('falls back to its own sentence when the failure says nothing', async () => {
    vi.mocked(tracker.stop).mockRejectedValue('offline');
    renderWithProviders(<TrackingControls status="tracking" attendanceMarked />);
    fireEvent.click(button('Stop'));
    expect(await screen.findByText('Could not stop tracking.')).toBeInTheDocument();
  });

  it('reports a pause that throws', async () => {
    vi.mocked(tracker.pause).mockImplementation(() => {
      throw new Error(NO_MESSAGE);
    });
    renderWithProviders(<TrackingControls status="tracking" attendanceMarked />);
    fireEvent.click(button('Pause'));
    expect(await screen.findByText('Could not pause tracking.')).toBeInTheDocument();
  });

  it('reports a resume that fails', async () => {
    vi.mocked(resumeTracking).mockRejectedValue(new Error('Screen capture is needed to resume.'));
    renderWithProviders(<TrackingControls status="paused" attendanceMarked />);
    fireEvent.click(button('Resume'));
    expect(await screen.findByText('Screen capture is needed to resume.')).toBeInTheDocument();
  });
});
