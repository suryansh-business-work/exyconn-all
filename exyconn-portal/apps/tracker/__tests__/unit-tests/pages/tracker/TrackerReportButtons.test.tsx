import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrackerReportButtons } from '../../../../src/pages/tracker/TrackerReportButtons';
import type { ReportFormat } from '../../../../src/pages/tracker/useHoursReportDownload';
import { renderWithProviders } from '../../test-utils';

const PDF = 'Download PDF report';
const XLSX = 'Download XLSX';

function renderButtons({
  downloading = null,
  disabled = false,
}: { downloading?: ReportFormat | null; disabled?: boolean } = {}) {
  const report = { download: vi.fn().mockResolvedValue(undefined), downloading };
  renderWithProviders(<TrackerReportButtons report={report} disabled={disabled} />);
  return report;
}

const button = (name: string) => screen.getByRole('button', { name });

describe('TrackerReportButtons', () => {
  it('downloads the PDF report or the XLSX sheet, whichever is clicked', async () => {
    const report = renderButtons();

    await userEvent.click(button(PDF));
    expect(report.download).toHaveBeenLastCalledWith('PDF');
    await userEvent.click(button(XLSX));
    expect(report.download).toHaveBeenLastCalledWith('XLSX');
    expect(report.download).toHaveBeenCalledTimes(2);
  });

  it('cannot be pressed while the month is still loading', () => {
    renderButtons({ disabled: true });
    expect(button(PDF)).toBeDisabled();
    expect(button(XLSX)).toBeDisabled();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it.each([
    ['PDF', PDF],
    ['XLSX', XLSX],
  ] as const)(
    'shows progress on the %s button only, and locks both while it runs',
    (format, name) => {
      renderButtons({ downloading: format });

      expect(button(PDF)).toBeDisabled();
      expect(button(XLSX)).toBeDisabled();
      expect(screen.getAllByRole('progressbar')).toHaveLength(1);
      expect(button(name)).toContainElement(screen.getByRole('progressbar'));
    },
  );
});
