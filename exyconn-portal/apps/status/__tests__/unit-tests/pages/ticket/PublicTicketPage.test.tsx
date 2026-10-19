import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import type { MockLink } from '@apollo/client/testing';
import {
  PublicTaskDocument,
  TaskPriority,
  TaskType,
  type PublicTaskQuery,
} from '@exyconn/shell/graphql/generated';
import { PublicTicketPage } from '../../../../src/pages/ticket';
import { renderWithProviders } from '../../test-utils';

type PublicTicket = NonNullable<PublicTaskQuery['publicTask']>;

const TOKEN = 'ticket-token-1';
const EXPIRED = 'This link no longer works';

const publicTicket = (overrides: Partial<PublicTicket> = {}): PublicTicket => ({
  __typename: 'PublicTaskView',
  key: 'WEB-12',
  title: 'Checkout button does nothing',
  description: '<p>Steps <a href="https://acme.io">here</a></p><script>alert(1)</script>',
  type: TaskType.Bug,
  priority: TaskPriority.High,
  status: 'In review',
  isDone: true,
  assigneeName: 'Priya',
  labels: ['payments', 'mobile'],
  dueDate: '2026-03-05',
  projectName: 'Website relaunch',
  updatedAt: '2026-02-10T09:00:00.000Z',
  ...overrides,
});

const ticketLookup = (value: PublicTicket | null): MockLink.MockedResponse => ({
  request: { query: PublicTaskDocument, variables: { token: TOKEN } },
  result: { data: { publicTask: value } },
});

function renderTicket(mocks: MockLink.MockedResponse[], route = `/ticket/${TOKEN}`) {
  return renderWithProviders(<PublicTicketPage />, {
    mocks,
    route,
    path: route === '/ticket' ? '/ticket' : '/ticket/:token',
  });
}

/** A fact card, found from its label. */
const fact = (label: string) => screen.getByText(label).closest('.MuiCard-root') as HTMLElement;

describe('PublicTicketPage', () => {
  it('loads, then shows the ticket, its project, kind and the read-only notice', async () => {
    renderTicket([ticketLookup(publicTicket())]);
    expect(screen.getByText('Loading').closest('[role="status"]')).toHaveAttribute(
      'aria-busy',
      'true',
    );

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Checkout button does nothing' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Website relaunch')).toBeInTheDocument();
    expect(screen.getByText('WEB-12')).toBeInTheDocument();
    expect(screen.getByText('Bug')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText(/Shared publicly, read-only/)).toBeInTheDocument();
  });

  it('sets out status, assignee, due and updated dates, and the labels', async () => {
    renderTicket([ticketLookup(publicTicket())]);
    await screen.findByRole('heading', { level: 1 });

    expect(within(fact('Status')).getByText('In review')).toBeInTheDocument();
    expect(within(fact('Assignee')).getByText('Priya')).toBeInTheDocument();
    expect(within(fact('Due')).getByText('5 Mar 2026')).toBeInTheDocument();
    expect(within(fact('Updated')).getByText('10 Feb 2026')).toBeInTheDocument();
    expect(screen.getByText('payments')).toBeInTheDocument();
    expect(screen.getByText('mobile')).toBeInTheDocument();
  });

  it('renders the description with its links but without scripts', async () => {
    const { container } = renderTicket([ticketLookup(publicTicket())]);
    await screen.findByRole('heading', { level: 1 });

    expect(screen.getByRole('link', { name: 'here' })).toHaveAttribute('href', 'https://acme.io');
    expect(container.querySelector('script')).toBeNull();
  });

  it('fills the gaps with dashes and Unassigned, and leaves out what was never set', async () => {
    renderTicket([
      ticketLookup(
        publicTicket({
          status: '',
          assigneeName: '',
          dueDate: null,
          isDone: false,
          labels: [],
          description: '',
        }),
      ),
    ]);
    await screen.findByRole('heading', { level: 1 });

    expect(within(fact('Status')).getByText('—')).toBeInTheDocument();
    expect(within(fact('Assignee')).getByText('Unassigned')).toBeInTheDocument();
    expect(within(fact('Due')).getByText('—')).toBeInTheDocument();
    expect(screen.queryByText('Done')).not.toBeInTheDocument();
    expect(screen.queryByText('payments')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('says the link no longer works when the server shares nothing', async () => {
    renderTicket([ticketLookup(null)]);
    expect(await screen.findByText(EXPIRED)).toBeInTheDocument();
  });

  it('does not ask the server when the link carries no token', () => {
    renderTicket([], '/ticket');
    expect(screen.getByText(EXPIRED)).toBeInTheDocument();
  });
});
