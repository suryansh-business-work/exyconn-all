import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { downloadBase64File } from '@exyconn/shell/utils/file';
import { MyHoursReportButton } from '../../../../src/pages/employee/MyHoursReportButton';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({ pdf: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMyTrackerHoursReportPdfLazyQuery: () => [gql.pdf],
}));
vi.mock('@exyconn/shell/utils/file', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  downloadBase64File: vi.fn(),
}));

const RANGE = { from: '2026-03-01T00:00:00.000Z', to: '2026-04-01T00:00:00.000Z' };
const FILE = { fileName: 'my-hours.pdf', mimeType: 'application/pdf', contentBase64: 'UERG' };
const NAME = 'Download PDF report';

function renderButton() {
  renderWithProviders(<MyHoursReportButton range={RANGE} timezone="Asia/Kolkata" />);
  return screen.getByRole('button', { name: NAME });
}

describe('MyHoursReportButton', () => {
  beforeEach(() => {
    vi.mocked(downloadBase64File).mockReset();
    gql.pdf.mockReset().mockResolvedValue({ data: { myTrackerHoursReportPdf: FILE } });
  });

  it("downloads the employee's own month as a PDF in their zone", async () => {
    await userEvent.click(renderButton());

    expect(gql.pdf).toHaveBeenCalledWith({ variables: { ...RANGE, timezone: 'Asia/Kolkata' } });
    await waitFor(() =>
      expect(downloadBase64File).toHaveBeenCalledWith('my-hours.pdf', 'application/pdf', 'UERG'),
    );
    expect(screen.getByRole('button', { name: NAME })).toBeEnabled();
  });

  it('shows progress and cannot be pressed again while the report is generated', async () => {
    let finish: (value: unknown) => void = () => undefined;
    gql.pdf.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const button = renderButton();

    await userEvent.click(button);

    expect(screen.getByRole('button', { name: NAME })).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    finish({ data: { myTrackerHoursReportPdf: FILE } });
    await waitFor(() => expect(screen.getByRole('button', { name: NAME })).toBeEnabled());
  });

  it('logs and says so when no report came back', async () => {
    const logged = vi.spyOn(portalLogger, 'error').mockImplementation(() => undefined);
    gql.pdf.mockResolvedValue({ data: undefined });

    await userEvent.click(renderButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The report could not be generated.',
    );
    expect(logged).toHaveBeenCalledWith(
      'My Tracker: downloading the hours report failed',
      expect.any(Error),
    );
    expect(downloadBase64File).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: NAME })).toBeEnabled();
  });

  it('falls back to a plain message when the failure carries none', async () => {
    vi.spyOn(portalLogger, 'error').mockImplementation(() => undefined);
    gql.pdf.mockRejectedValue('offline');

    await userEvent.click(renderButton());

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not download the report');
  });
});
