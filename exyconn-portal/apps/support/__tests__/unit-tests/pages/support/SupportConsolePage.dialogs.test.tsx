import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { dashboardProps } from '../../crud-page.mocks';
import { click } from '../../form.helpers';
import { consoleGql as gql } from './console.state';
import { expectReloaded, renderConsole, resetConsole, runAction } from './console.harness';

vi.mock('@exyconn/crud', async () => (await import('../../crud-page.mocks')).crudModuleMock());
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../../settings.mock')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/auth/AuthContext', async (importOriginal) => {
  const { consoleGql } = await import('./console.state');
  return {
    ...(await importOriginal<typeof import('@exyconn/shell/auth/AuthContext')>()),
    useAuth: () => ({ user: consoleGql.user }),
  };
});
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => {
  const { consoleGql } = await import('./console.state');
  return {
    ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
    useListSupportTicketsStatsQuery: consoleGql.stats,
    useSupportSlaSummaryQuery: consoleGql.sla,
  };
});
vi.mock('@exyconn/shell/pages/ticket-desk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/pages/ticket-desk')>()),
  TicketDetailDialog: (await import('./console.stubs')).DetailDialogStub,
}));
vi.mock('../../../../src/pages/support/TicketStatusDialog', async () => ({
  TicketStatusDialog: (await import('./console.stubs')).StatusDialogStub,
}));
vi.mock('../../../../src/pages/support/forms/client-ticket', async () => ({
  ClientTicketForm: (await import('./console.stubs')).ClientTicketFormStub,
}));

describe('SupportConsolePage dialogs and actions', () => {
  beforeEach(resetConsole);

  it('opens a ticket’s conversation from its row, and reloads when it changes', async () => {
    renderConsole();
    runAction('open');
    expect(screen.getByText('Detail of Laptop will not boot')).toBeInTheDocument();

    await click('Ticket changed');
    expectReloaded(1);

    await click('Close detail');
    expect(screen.queryByText(/Detail of/)).not.toBeInTheDocument();
  });

  it('opens the ticket’s own page from its row', () => {
    renderConsole();
    runAction('page');
    expect(screen.getByRole('status', { name: 'url' })).toHaveTextContent(
      '/support/tickets/ticket-1',
    );
  });

  it('moves a ticket’s status in the small dialog, then reloads and closes it', async () => {
    renderConsole();
    runAction('status');
    expect(screen.getByText('Status of Laptop will not boot (OPEN)')).toBeInTheDocument();

    await click('Status saved');
    expectReloaded(1);
    expect(screen.queryByText(/Status of/)).not.toBeInTheDocument();
  });

  it('closes the status dialog without reloading', async () => {
    renderConsole();
    runAction('status');
    await click('Close status');
    expect(screen.queryByText(/Status of/)).not.toBeInTheDocument();
    expect(dashboardProps().refreshSignal).toBe(0);
  });

  it('carries on when a reload of the numbers fails', async () => {
    gql.refetchStats.mockRejectedValue(new Error('offline'));
    gql.refetchSla.mockRejectedValue(new Error('offline'));
    renderConsole();
    runAction('open');
    await click('Ticket changed');
    expectReloaded(1);
  });

  it('raises a customer ticket on its own page, back to the console when it is done', async () => {
    renderConsole();
    await click('New customer ticket');
    expect(screen.getByRole('heading', { name: 'Raise a customer ticket' })).toBeInTheDocument();

    await click('Ticket raised');
    expect(screen.queryByRole('heading', { name: 'Raise a customer ticket' })).toBeNull();
    expectReloaded(1);
  });

  it('goes back to the console from the form’s Cancel or its back link', async () => {
    renderConsole();
    await click('New customer ticket');
    await click('Cancel ticket');
    expect(screen.getByRole('button', { name: 'New customer ticket' })).toBeInTheDocument();

    await click('New customer ticket');
    await click('Back to Support');
    expect(screen.getByRole('button', { name: 'New customer ticket' })).toBeInTheDocument();
    expect(gql.refetchStats).not.toHaveBeenCalled();
  });
});
