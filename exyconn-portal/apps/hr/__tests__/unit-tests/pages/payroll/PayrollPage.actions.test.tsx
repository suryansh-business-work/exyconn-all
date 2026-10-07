import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PayrollPage } from '../../../../src/pages/payroll';
import { renderWithProviders } from '../../test-utils';
import { SUMMARY, freezeOctober2026 } from './payroll-page-stubs';

const gql = vi.hoisted(() => ({
  summary: vi.fn(),
  refetch: vi.fn(),
  markPaid: vi.fn(),
  send: vi.fn(),
  paying: false,
  sending: false,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  usePayrollSummaryQuery: () => gql.summary(),
  useMarkPayrollPaidMutation: () => [gql.markPaid, { loading: gql.paying }],
  useSendSalarySlipsMutation: () => [gql.send, { loading: gql.sending }],
}));

vi.mock('../../../../src/pages/payroll/run-dialog', async () => ({
  PayrollRunControl: (await import('./payroll-page-stubs')).RunControlStub,
}));

vi.mock('../../../../src/pages/payroll/PayrollSlipsTable', async () => ({
  PayrollSlipsTable: (await import('./payroll-page-stubs')).SlipsTableStub,
}));

/** Presses a toolbar button and answers the confirm dialog it opens. */
function answerSummary() {
  gql.summary.mockReturnValue({
    data: { payrollSummary: SUMMARY },
    loading: false,
    refetch: gql.refetch,
  });
}

async function pressAndAnswer(button: string, title: string, answer: 'Confirm' | 'Cancel') {
  renderWithProviders(<PayrollPage />);
  await userEvent.click(screen.getByRole('button', { name: button }));
  expect(await screen.findByText(title)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: answer }));
}

const markPaid = (answer: 'Confirm' | 'Cancel' = 'Confirm') =>
  pressAndAnswer('Mark paid', 'Mark October 2026 as paid?', answer);
const emailSlips = (answer: 'Confirm' | 'Cancel' = 'Confirm') =>
  pressAndAnswer('Email payslips', 'Email payslips for October 2026?', answer);

describe('PayrollPage mark paid', () => {
  beforeEach(() => {
    freezeOctober2026();
    answerSummary();
    gql.refetch.mockReset().mockResolvedValue({});
    gql.markPaid.mockReset().mockResolvedValue({ data: { markPayrollPaid: 3 } });
    gql.paying = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('marks the month paid once confirmed, says how many, and re-reads the summary', async () => {
    await markPaid();

    expect(await screen.findByText('Marked 3 slips paid.')).toBeInTheDocument();
    expect(gql.markPaid).toHaveBeenCalledWith({ variables: { month: 10, year: 2026 } });
    await waitFor(() => expect(gql.refetch).toHaveBeenCalledTimes(1));
  });

  it('warns that paid slips cannot be recomputed', async () => {
    renderWithProviders(<PayrollPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Mark paid' }));

    expect(
      await screen.findByText(
        'All GENERATED slips for the month become PAID. This cannot be recomputed afterwards.',
      ),
    ).toBeInTheDocument();
  });

  it('changes nothing when the confirm is cancelled', async () => {
    await markPaid('Cancel');

    expect(gql.markPaid).not.toHaveBeenCalled();
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('says none were marked when the server returns no count', async () => {
    gql.markPaid.mockResolvedValue({ data: null });
    await markPaid();

    expect(await screen.findByText('Marked 0 slips paid.')).toBeInTheDocument();
  });

  it("reports the server's reason when marking paid fails", async () => {
    gql.markPaid.mockRejectedValue(new Error('Month is locked'));
    await markPaid();

    expect(await screen.findByText('Month is locked')).toBeInTheDocument();
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when the failure is not an Error', async () => {
    gql.markPaid.mockRejectedValue('offline');
    await markPaid();

    expect(await screen.findByText('Could not mark paid')).toBeInTheDocument();
  });

  it('cannot be pressed again while marking paid is in flight', () => {
    gql.paying = true;
    renderWithProviders(<PayrollPage />);

    expect(screen.getByRole('button', { name: 'Mark paid' })).toBeDisabled();
  });
});

describe('PayrollPage email payslips', () => {
  beforeEach(() => {
    freezeOctober2026();
    answerSummary();
    gql.send.mockReset().mockResolvedValue({
      data: { sendSalarySlips: { month: 10, year: 2026, sent: 4, failed: 1, skipped: 2 } },
    });
    gql.sending = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('emails the payslips once confirmed and says how many went, failed or had no address', async () => {
    await emailSlips();

    expect(
      await screen.findByText('Emailed 4 payslips — 1 failed, 2 without an address.'),
    ).toBeInTheDocument();
    expect(gql.send).toHaveBeenCalledWith({ variables: { month: 10, year: 2026 } });
  });

  it('changes nothing when the confirm is cancelled', async () => {
    await emailSlips('Cancel');

    expect(gql.send).not.toHaveBeenCalled();
  });

  it('reports zeros when the server returns no result', async () => {
    gql.send.mockResolvedValue({ data: null });
    await emailSlips();

    expect(
      await screen.findByText('Emailed 0 payslips — 0 failed, 0 without an address.'),
    ).toBeInTheDocument();
  });

  it("reports the server's reason when emailing fails", async () => {
    gql.send.mockRejectedValue(new Error('SMTP is not configured'));
    await emailSlips();

    expect(await screen.findByText('SMTP is not configured')).toBeInTheDocument();
  });

  it('falls back to a plain message when the failure is not an Error', async () => {
    gql.send.mockRejectedValue('offline');
    await emailSlips();

    expect(await screen.findByText('Could not email the payslips')).toBeInTheDocument();
  });

  it('shows that it is emailing and cannot be pressed again meanwhile', () => {
    gql.sending = true;
    renderWithProviders(<PayrollPage />);

    expect(screen.getByRole('button', { name: 'Emailing…' })).toBeDisabled();
  });
});
