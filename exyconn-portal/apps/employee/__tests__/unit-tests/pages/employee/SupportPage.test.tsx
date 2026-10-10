import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMySupportTicketsQuery } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { queryResult } from './helpers/apollo';
import { SupportPage } from '../../../../src/pages/employee/SupportPage';

const logger = vi.hoisted(() => ({ warn: vi.fn() }));

vi.mock('@exyconn/shell/logging/portalLogger', () => ({ portalLogger: logger }));
vi.mock('@exyconn/shell/hooks/useSettings', () => import('./helpers/settings'));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMySupportTicketsQuery: vi.fn(),
}));
vi.mock('../../../../src/pages/employee/forms/support-ticket', async () => {
  const { FormStub } = await import('./helpers/stubs');
  return { SupportTicketForm: FormStub };
});
vi.mock('../../../../src/pages/employee/SupportThread', async () => {
  const { SupportThreadStub } = await import('./helpers/stubs');
  return { SupportThread: SupportThreadStub };
});

const tickets = [
  {
    id: 't1',
    reference: 'SUP-0042',
    subject: 'VPN keeps dropping',
    category: 'IT',
    description: 'Every 10 minutes since Monday.',
    priority: 'HIGH',
    status: 'OPEN',
    createdAt: '2026-03-03T10:00:00.000Z',
    attachments: [{ url: 'https://files.example.com/log.txt', name: 'log.txt' }],
  },
  {
    id: 't2',
    reference: '',
    subject: 'Payslip query',
    category: 'PAYROLL',
    description: 'March deduction.',
    priority: 'LOW',
    status: 'CLOSED',
    createdAt: '2026-03-04T10:00:00.000Z',
    attachments: [],
  },
];

function renderPage(refetch = vi.fn(() => Promise.resolve({}))) {
  vi.mocked(useMySupportTicketsQuery).mockReturnValue(
    queryResult({ data: { mySupportTickets: tickets }, refetch }),
  );
  renderWithProviders(<SupportPage />);
  return { refetch, user: userEvent.setup() };
}

describe('SupportPage', () => {
  it('lists each ticket with its reference, subject, category, priority, status and date', () => {
    renderPage();
    const [, vpn, payslip] = screen.getAllByRole('row');
    expect(within(vpn).getByText('SUP-0042')).toBeInTheDocument();
    expect(within(vpn).getByText('VPN keeps dropping')).toBeInTheDocument();
    expect(within(vpn).getByText('IT')).toBeInTheDocument();
    expect(within(vpn).getByText('HIGH')).toBeInTheDocument();
    expect(within(vpn).getByText('OPEN')).toBeInTheDocument();
    expect(within(vpn).getByText('on 2026-03-03T10:00:00.000Z')).toBeInTheDocument();
    // A ticket raised before references existed shows a dash.
    expect(within(payslip).getByText('—')).toBeInTheDocument();
  });

  it('says there are no tickets when the list is empty', () => {
    vi.mocked(useMySupportTicketsQuery).mockReturnValue(
      queryResult({ data: { mySupportTickets: [] } }),
    );
    renderWithProviders(<SupportPage />);
    expect(screen.getByText('You have no support tickets yet.')).toBeInTheDocument();
  });

  it('opens the conversation on a ticket in a side panel, and closes it', async () => {
    const { user } = renderPage();
    const [openFirst] = screen.getAllByRole('button', { name: 'open ticket' });
    await user.click(openFirst);

    expect(await screen.findByRole('heading', { name: 'VPN keeps dropping' })).toBeInTheDocument();
    expect(
      screen.getByText('Thread t1: Every 10 minutes since Monday. (1 files)'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Stub close thread' }));
    await waitFor(() => expect(screen.queryByText(/^Thread t1/)).toBeNull());

    // The panel's exit transition hides the page from assistive tech until it has finished.
    const [, openSecond] = await screen.findAllByRole('button', { name: 'open ticket' });
    await user.click(openSecond);
    expect(await screen.findByText('Thread t2: March deduction. (0 files)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText(/^Thread t2/)).toBeNull());
  });

  it('opens the ticket form and closes it by the back link or Cancel', async () => {
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Raise ticket' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Raise ticket' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to Support' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Support' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Raise ticket' }));
    await user.click(screen.getByRole('button', { name: 'Stub cancel' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Support' })).toBeInTheDocument();
  });

  it('returns to the list and reloads it once a ticket is raised', async () => {
    const { refetch, user } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Raise ticket' }));
    await user.click(screen.getByRole('button', { name: 'Stub done' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Support' })).toBeInTheDocument();
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('holds the table busy and does not claim the list is empty while the first response loads', () => {
    vi.mocked(useMySupportTicketsQuery).mockReturnValue(queryResult({ loading: true }));
    const { container } = renderWithProviders(<SupportPage />);
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByText('You have no support tickets yet.')).toBeNull();
  });

  it('logs a failed reload after a ticket is raised instead of failing the page', async () => {
    const failure = new Error('offline');
    const { user } = renderPage(vi.fn(() => Promise.reject(failure)));

    await user.click(screen.getByRole('button', { name: 'Raise ticket' }));
    await user.click(screen.getByRole('button', { name: 'Stub done' }));

    await waitFor(() =>
      expect(logger.warn).toHaveBeenCalledWith('Could not reload the support tickets', failure),
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Support' })).toBeInTheDocument();
  });
});
