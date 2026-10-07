import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { InvoiceStatus, MilestoneState, ProjectStatus } from '@exyconn/shell/graphql/generated';
import { DashboardPage } from '../../../../src/pages/dashboard/DashboardPage';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({
  useClientHubMeQuery: vi.fn(),
  useClientHubRemindersQuery: vi.fn(),
  useClientHubProjectsQuery: vi.fn(),
  useClientHubPaymentOptionsQuery: vi.fn(),
  useClientHubPayInvoiceMutation: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...gql,
}));

const ME = {
  clientHubMe: { name: 'Ada Lovelace', email: 'ada@acme.com', clientName: 'Acme', company: 'Acme' },
};
const REMINDER = {
  invoiceId: 'inv-1',
  number: 'INV-1',
  currency: 'USD',
  balance: 400,
  dueDate: '2026-10-14T00:00:00.000Z',
  daysLate: 0,
  status: InvoiceStatus.Sent,
};
const project = (id: string, status: ProjectStatus) => ({
  id,
  name: `Project ${id}`,
  status,
  trackedHours: 0,
  milestones: [{ name: 'Kick-off', state: MilestoneState.Hit }],
  ticketCounts: [],
});
const PROJECTS = {
  clientHubProjects: [
    project('p1', ProjectStatus.Active),
    project('p2', ProjectStatus.Active),
    project('p3', ProjectStatus.Completed),
  ],
};

describe('DashboardPage', () => {
  beforeEach(() => {
    gql.useClientHubMeQuery.mockReturnValue({ data: ME });
    gql.useClientHubRemindersQuery.mockReturnValue({
      data: { clientHubReminders: [REMINDER] },
      loading: false,
    });
    gql.useClientHubProjectsQuery.mockReturnValue({ data: PROJECTS });
    gql.useClientHubPaymentOptionsQuery.mockReturnValue({ data: undefined, loading: false });
    gql.useClientHubPayInvoiceMutation.mockReturnValue([vi.fn(), {}]);
  });

  it('greets the contact by first name and counts only the active projects', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('Welcome back, Ada')).toBeInTheDocument();
    expect(screen.getByText('2 active projects')).toBeInTheDocument();
    expect(gql.useClientHubMeQuery).toHaveBeenCalledWith({ fetchPolicy: 'cache-first' });
  });

  it('shows what needs paying', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('Payment reminders')).toBeInTheDocument();
    expect(screen.getByText('INV-1')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('links to invoices, transactions, support and projects', () => {
    renderWithProviders(<DashboardPage />);
    expect(
      screen.getAllByRole('link', { name: 'Open' }).map((link) => link.getAttribute('href')),
    ).toEqual(['/invoices', '/transactions', '/support']);
    expect(screen.getByText('Download, email or pay any invoice')).toBeInTheDocument();
    expect(screen.getByText('Every payment we have received')).toBeInTheDocument();
    expect(screen.getByText('Raise a ticket or follow a reply')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See your projects' })).toHaveAttribute(
      'href',
      '/projects',
    );
  });

  it('shows a spinner in place of the reminders until they first arrive', () => {
    gql.useClientHubRemindersQuery.mockReturnValue({ data: undefined, loading: true });
    renderWithProviders(<DashboardPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Payment reminders')).not.toBeInTheDocument();
  });

  it('keeps showing the reminders it has while they refresh', () => {
    gql.useClientHubRemindersQuery.mockReturnValue({
      data: { clientHubReminders: [REMINDER] },
      loading: true,
    });
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('INV-1')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders sensibly before anything has loaded', () => {
    gql.useClientHubMeQuery.mockReturnValue({ data: undefined });
    gql.useClientHubRemindersQuery.mockReturnValue({ data: undefined, loading: false });
    gql.useClientHubProjectsQuery.mockReturnValue({ data: undefined });
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/^Welcome back,/)).toBeInTheDocument();
    expect(screen.getByText('0 active projects')).toBeInTheDocument();
    expect(screen.getByText('All paid up')).toBeInTheDocument();
  });
});
