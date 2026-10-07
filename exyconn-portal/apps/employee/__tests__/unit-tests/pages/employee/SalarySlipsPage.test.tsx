import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMySalarySlipsQuery } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { queryResult } from './helpers/apollo';
import { money } from './helpers/money';
import { SalarySlipsPage } from '../../../../src/pages/employee/SalarySlipsPage';

const payslip = vi.hoisted(() => ({
  download: vi.fn<(id: string) => Promise<void>>(),
  downloading: false,
}));

vi.mock('@exyconn/shell/hooks/usePayslipDownload', () => ({ usePayslipDownload: () => payslip }));
vi.mock('@exyconn/shell/hooks/useSettings', () => import('./helpers/settings'));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMySalarySlipsQuery: vi.fn(),
}));

const slip = {
  id: 's1',
  month: 3,
  year: 2026,
  currency: 'INR',
  gross: 80000,
  deductions: 5000,
  net: 75000,
  status: 'PAID',
  issuedDate: '2026-03-31',
};

function renderSlips(slips: unknown[] = [slip]) {
  vi.mocked(useMySalarySlipsQuery).mockReturnValue(queryResult({ data: { mySalarySlips: slips } }));
  renderWithProviders(<SalarySlipsPage />);
  return userEvent.setup();
}

beforeEach(() => {
  payslip.download.mockReset();
  payslip.download.mockResolvedValue(undefined);
  payslip.downloading = false;
});

describe('SalarySlipsPage', () => {
  it('lists each payslip by its period with the amounts, status and issue date', () => {
    renderSlips();
    const [, row] = screen.getAllByRole('row');
    expect(within(row).getByText('March 2026')).toBeInTheDocument();
    expect(within(row).getByText(money(80000, 'INR'))).toBeInTheDocument();
    expect(within(row).getByText(money(5000, 'INR'))).toBeInTheDocument();
    expect(within(row).getByText(money(75000, 'INR'))).toBeInTheDocument();
    expect(within(row).getByText('PAID')).toBeInTheDocument();
    expect(within(row).getByText('on 2026-03-31')).toBeInTheDocument();
  });

  it('says there are no payslips yet when the list is empty', () => {
    renderSlips([]);
    expect(screen.getByText('No payslips yet.')).toBeInTheDocument();
  });

  it('downloads the PDF straight from the row', async () => {
    const user = renderSlips();
    await user.click(screen.getByRole('button', { name: 'download payslip' }));
    expect(payslip.download).toHaveBeenCalledWith('s1');
  });

  it('opens the breakdown, downloads from it, and closes', async () => {
    const user = renderSlips();
    await user.click(screen.getByRole('button', { name: 'view' }));

    const heading = await screen.findByRole('heading', { name: 'March 2026' });
    const drawer = heading.closest('.MuiDrawer-paper');
    expect(drawer).not.toBeNull();
    const panel = within(drawer as HTMLElement);
    expect(panel.getByText('Gross').nextElementSibling).toHaveTextContent(money(80000, 'INR'));
    expect(panel.getByText('Deductions').nextElementSibling).toHaveTextContent(money(5000, 'INR'));
    expect(panel.getByText('Net').nextElementSibling).toHaveTextContent(money(75000, 'INR'));

    await user.click(panel.getByRole('button', { name: 'Download PDF' }));
    expect(payslip.download).toHaveBeenCalledWith('s1');

    await user.click(panel.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'March 2026' })).toBeNull());
  });

  it('keeps the page up when a download fails', async () => {
    payslip.download.mockRejectedValue(new Error('PDF service down'));
    const user = renderSlips();
    await user.click(screen.getByRole('button', { name: 'download payslip' }));
    await user.click(screen.getByRole('button', { name: 'view' }));
    await user.click(await screen.findByRole('button', { name: 'Download PDF' }));

    expect(payslip.download).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('heading', { name: 'March 2026' })).toBeInTheDocument();
  });

  it('holds the download button while the PDF is being prepared', async () => {
    payslip.downloading = true;
    const user = renderSlips();
    await user.click(screen.getByRole('button', { name: 'view' }));
    expect(await screen.findByRole('button', { name: 'Preparing…' })).toBeDisabled();
  });
});
