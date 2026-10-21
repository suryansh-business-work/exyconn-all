import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { downloadBase64File } from '@exyconn/shell/utils/file';
import { useHoursReportDownload } from '../../../../src/pages/tracker/useHoursReportDownload';
import { renderHookWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({ sheet: vi.fn(), pdf: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTrackerExpectedReportLazyQuery: () => [gql.sheet],
  useTrackerHoursReportPdfLazyQuery: () => [gql.pdf],
}));
vi.mock('@exyconn/shell/utils/file', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/utils/file')>()),
  downloadBase64File: vi.fn(),
}));

const RANGE = { from: '2026-01-01T00:00:00.000Z', to: '2026-02-01T00:00:00.000Z' };
const FILE = { fileName: 'hours.pdf', mimeType: 'application/pdf', contentBase64: 'UERG' };
const SHEET = { fileName: 'hours.xlsx', mimeType: 'application/xlsx', contentBase64: 'WExT' };
const VARIABLES = { userId: 'u1', ...RANGE, timezone: 'Asia/Kolkata' };

function renderDownload(employeeId: string | null = 'u1') {
  return renderHookWithProviders(() =>
    useHoursReportDownload({ employeeId, range: RANGE, timezone: 'Asia/Kolkata' }),
  );
}

describe('useHoursReportDownload', () => {
  beforeEach(() => {
    vi.mocked(downloadBase64File).mockReset();
    gql.sheet.mockReset().mockResolvedValue({ data: { trackerExpectedReport: SHEET } });
    gql.pdf.mockReset().mockResolvedValue({ data: { trackerHoursReportPdf: FILE } });
  });

  it('downloads the PDF report for the employee, month and zone', async () => {
    const { result } = renderDownload();
    expect(result.current.downloading).toBeNull();

    await act(() => result.current.download('PDF'));

    expect(gql.pdf).toHaveBeenCalledWith({ variables: VARIABLES });
    expect(gql.sheet).not.toHaveBeenCalled();
    expect(downloadBase64File).toHaveBeenCalledWith('hours.pdf', 'application/pdf', 'UERG');
    expect(result.current.downloading).toBeNull();
  });

  it('downloads the XLSX sheet', async () => {
    const { result } = renderDownload();

    await act(() => result.current.download('XLSX'));

    expect(gql.sheet).toHaveBeenCalledWith({ variables: VARIABLES });
    expect(gql.pdf).not.toHaveBeenCalled();
    expect(downloadBase64File).toHaveBeenCalledWith('hours.xlsx', 'application/xlsx', 'WExT');
  });

  it('says which format is on its way while it downloads', async () => {
    let finish: (value: unknown) => void = () => undefined;
    gql.pdf.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { result } = renderDownload();

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.download('PDF');
    });
    expect(result.current.downloading).toBe('PDF');

    await act(async () => {
      finish({ data: { trackerHoursReportPdf: FILE } });
      await pending;
    });
    expect(result.current.downloading).toBeNull();
  });

  it('asks nothing without an employee', async () => {
    const { result } = renderDownload(null);

    await act(() => result.current.download('PDF'));

    expect(gql.pdf).not.toHaveBeenCalled();
    expect(downloadBase64File).not.toHaveBeenCalled();
  });

  it('logs and says so when no report came back', async () => {
    const logged = vi.spyOn(portalLogger, 'error').mockImplementation(() => undefined);
    gql.sheet.mockResolvedValue({ data: undefined });
    const { result } = renderDownload();

    await act(() => result.current.download('XLSX'));

    expect(downloadBase64File).not.toHaveBeenCalled();
    expect(logged).toHaveBeenCalledWith(
      'Tracker: downloading the hours report failed',
      expect.any(Error),
    );
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('The report could not be generated.'),
    );
    expect(result.current.downloading).toBeNull();
  });

  it('falls back to a plain message when the failure carries none', async () => {
    vi.spyOn(portalLogger, 'error').mockImplementation(() => undefined);
    gql.pdf.mockRejectedValue('offline');
    const { result } = renderDownload();

    await act(() => result.current.download('PDF'));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Could not download the report'),
    );
  });
});
