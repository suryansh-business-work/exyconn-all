import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SupportCategory, SupportPriority, SupportStatus } from '@exyconn/shell/graphql/generated';
import { SupportPage } from '../../../../src/pages/support/SupportPage';
import { TICKET_COLUMNS } from '../../../../src/pages/support/tickets-grid';
import { dashboardProps } from '../../crud-dashboard-stub';
import { renderWithProviders } from '../../test-utils';

const crud = vi.hoisted(() => ({
  select: null as null | ((data: unknown) => unknown),
  fetchRows: vi.fn(),
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const { CrudDashboardStub } = await import('../../crud-dashboard-stub');
  return {
    ...(await importOriginal<Record<string, unknown>>()),
    CrudDashboard: CrudDashboardStub,
    usePagedFetcher: (_document: unknown, select: (data: unknown) => unknown) => {
      crud.select = select;
      return crud.fetchRows;
    },
  };
});

/** The ticket form has its own tests; here it only reports done or cancelled. */
vi.mock('../../../../src/pages/support/forms/open-ticket', () => ({
  OpenTicketForm: ({
    onDone,
    onCancel,
  }: Readonly<{ onDone: () => void; onCancel: () => void }>) => (
    <div>
      <button type="button" onClick={onDone}>
        Submit ticket
      </button>
      <button type="button" onClick={onCancel}>
        Abandon ticket
      </button>
    </div>
  ),
}));

/** The thread has its own tests; here it only shows which ticket is open. */
vi.mock('../../../../src/pages/support/TicketThreadDialog', () => ({
  TicketThreadDialog: ({
    ticket,
    onClose,
  }: Readonly<{ ticket: { subject: string } | null; onClose: () => void }>) =>
    ticket ? (
      <section aria-label="Ticket thread">
        <p>{ticket.subject}</p>
        <button type="button" onClick={onClose}>
          Close thread
        </button>
      </section>
    ) : null,
}));

const TICKET = {
  id: 't-1',
  reference: 'TCK-1',
  subject: 'Invoice total looks wrong',
  category: SupportCategory.Other,
  description: 'The March invoice charges twice for the same week.',
  priority: SupportPriority.High,
  status: SupportStatus.Open,
  createdAt: '2026-10-01T09:30:00.000Z',
  updatedAt: '2026-10-02T09:30:00.000Z',
};

function renderPage() {
  renderWithProviders(<SupportPage />);
  return userEvent.setup();
}

describe('SupportPage', () => {
  afterEach(() => vi.clearAllMocks());

  it('lists the tickets as an exportable, server-paged table', async () => {
    renderPage();
    const props = dashboardProps();
    expect(props.title).toBe('Support');
    expect(props.entityLabel).toBe('ticket');
    expect(props.exportFileName).toBe('support-tickets');
    expect(props.stats).toEqual([]);
    expect(props.columnDefs).toBe(TICKET_COLUMNS);
    expect(props.refreshSignal).toBe(0);
    expect(props.context.formatDate('2026-10-01T09:30:00.000Z')).toBe('01 Oct 2026');

    const page = { rows: [TICKET], totalCount: 1 };
    crud.fetchRows.mockResolvedValue(page);
    await expect(props.fetchRows({ page: 1, pageSize: 25 })).resolves.toBe(page);
    expect(crud.select?.({ clientHubTickets: page })).toBe(page);
  });

  it('raises a ticket from the toolbar and refreshes the list once it is in', async () => {
    const user = renderPage();
    await user.click(screen.getByRole('button', { name: 'New ticket' }));
    expect(await screen.findByText('New support ticket')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Submit ticket' }));
    expect(dashboardProps().refreshSignal).toBe(1);
    await waitFor(() => expect(screen.queryByText('Submit ticket')).not.toBeInTheDocument());
  });

  it('closes the new-ticket panel without refreshing when the client backs out', async () => {
    const user = renderPage();
    await user.click(screen.getByRole('button', { name: 'New ticket' }));
    await user.click(await screen.findByRole('button', { name: 'Abandon ticket' }));
    await waitFor(() => expect(screen.queryByText('Abandon ticket')).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'New ticket' }));
    await user.click(await screen.findByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('Abandon ticket')).not.toBeInTheDocument());
    expect(dashboardProps().refreshSignal).toBe(0);
  });

  it('opens a ticket thread from its action button, and closes it', async () => {
    const user = renderPage();
    act(() => dashboardProps().context.actions.open(TICKET as never));
    expect(screen.getByRole('region', { name: 'Ticket thread' })).toHaveTextContent(TICKET.subject);
    await user.click(screen.getByRole('button', { name: 'Close thread' }));
    expect(screen.queryByRole('region', { name: 'Ticket thread' })).not.toBeInTheDocument();
  });

  it('opens a ticket thread when its row is clicked', () => {
    renderPage();
    act(() => dashboardProps().onRowClick?.(TICKET as never));
    expect(screen.getByRole('region', { name: 'Ticket thread' })).toBeInTheDocument();
  });
});

describe('TICKET_COLUMNS', () => {
  it('shows reference, subject, priority, status and dates, with a way into the thread', () => {
    expect(TICKET_COLUMNS.map((col) => col.field ?? col.colId)).toEqual([
      'reference',
      'subject',
      'priority',
      'status',
      'createdAt',
      'updatedAt',
      'actions',
    ]);
    const actions = TICKET_COLUMNS[TICKET_COLUMNS.length - 1].cellRendererParams as {
      actionSpecs: { key: string; label: string }[];
    };
    expect(actions.actionSpecs).toEqual([
      expect.objectContaining({ key: 'open', label: 'open the conversation' }),
    ]);
  });
});
