import { fireEvent, screen, waitFor } from '@testing-library/react';
import { buildReportCsv } from '@exyconn/tracker-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReportDownloadButton } from '../../../../src/components/report/ReportDownloadButton';
import { shareReport, type ShareOutcome } from '../../../../src/components/report/share-report';
import { renderWithProviders } from '../../test-utils';
import { HOUR, reportDay } from './fixtures';

vi.mock('../../../../src/components/report/share-report', () => ({ shareReport: vi.fn() }));

const DAYS = [reportDay('2026-02-03', 6 * HOUR, 2 * HOUR)];
const LABEL = 'Download February 2026 as CSV';
const UNAVAILABLE =
  'This phone cannot open a share sheet, so the report cannot leave the app from here.';

function renderButton(days = DAYS, loading = false) {
  renderWithProviders(
    <ReportDownloadButton
      days={days}
      loading={loading}
      monthKey="2026-02"
      monthLabel="February 2026"
    />,
  );
  return screen.getByRole('button', { name: LABEL });
}

beforeEach(() => {
  vi.mocked(shareReport).mockResolvedValue('shared');
});

describe('ReportDownloadButton', () => {
  it('shares the month as a CSV named after it, titled for the share sheet', async () => {
    fireEvent.click(renderButton());

    await waitFor(() => expect(shareReport).toHaveBeenCalledTimes(1));
    expect(shareReport).toHaveBeenCalledWith(
      buildReportCsv(DAYS, '2026-02'),
      'Report for February 2026',
    );
    expect(screen.queryByText(UNAVAILABLE)).not.toBeInTheDocument();
    expect(screen.queryByText('Could not prepare the report.')).not.toBeInTheDocument();
  });

  it('blocks a second press while the file is being prepared', async () => {
    let finish: (outcome: ShareOutcome) => void = () => undefined;
    vi.mocked(shareReport).mockReturnValue(
      new Promise<ShareOutcome>((resolve) => {
        finish = resolve;
      }),
    );
    const button = renderButton();

    fireEvent.click(button);
    await waitFor(() => expect(button).toHaveAttribute('aria-disabled', 'true'));
    fireEvent.click(button);
    expect(shareReport).toHaveBeenCalledTimes(1);

    finish('shared');
    await waitFor(() => expect(button).not.toHaveAttribute('aria-disabled'));
  });

  it('cannot share an empty month or one that is still loading', () => {
    const empty = renderButton([]);
    expect(empty).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(empty);
    expect(shareReport).not.toHaveBeenCalled();
  });

  it('waits for the month to load before it can be shared', () => {
    const loading = renderButton(DAYS, true);

    expect(loading).toHaveAttribute('aria-disabled', 'true');
  });

  it('warns, without blaming the employee, when the phone has no share sheet', async () => {
    vi.mocked(shareReport).mockResolvedValue('unavailable');
    fireEvent.click(renderButton());

    expect(await screen.findByText(UNAVAILABLE)).toBeInTheDocument();
    expect(
      screen.getByText('Every figure the file would hold is on this screen.'),
    ).toBeInTheDocument();
  });

  it('says the report could not be prepared when sharing fails, and logs why', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const cause = new Error('Disk full');
    vi.mocked(shareReport).mockRejectedValue(cause);
    fireEvent.click(renderButton());

    expect(await screen.findByText('Could not prepare the report.')).toBeInTheDocument();
    expect(
      screen.getByText('Check that your phone has free storage, then try again.'),
    ).toBeInTheDocument();
    expect(error).toHaveBeenCalledWith('Sharing the report failed', cause);
  });

  it('clears an earlier problem when the employee tries again', async () => {
    vi.mocked(shareReport).mockResolvedValueOnce('unavailable').mockResolvedValueOnce('shared');
    const button = renderButton();

    fireEvent.click(button);
    expect(await screen.findByText(UNAVAILABLE)).toBeInTheDocument();

    await waitFor(() => expect(button).not.toHaveAttribute('aria-disabled'));
    fireEvent.click(button);
    await waitFor(() => expect(screen.queryByText(UNAVAILABLE)).not.toBeInTheDocument());
  });
});
