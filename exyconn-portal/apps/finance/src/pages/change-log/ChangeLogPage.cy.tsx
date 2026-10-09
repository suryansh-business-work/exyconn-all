import { MockedProvider } from '@apollo/client/testing/react';
import type { DocumentNode } from 'graphql';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import {
  AuditAction,
  ListFinanceChangeLogPagedDocument,
  ListFinanceChangeLogStatsDocument,
} from '@exyconn/shell/graphql/generated';
import { ChangeLogPage } from './ChangeLogPage';

const row = {
  __typename: 'AuditLog' as const,
  id: 'a1',
  actorId: 'u1',
  actorName: 'Asha',
  actorEmail: 'asha@exyconn.com',
  action: AuditAction.Update,
  module: 'Invoice',
  entityId: 'i1',
  entityLabel: 'INV-001',
  summary: 'Payment recorded on Invoice INV-001',
  changes: JSON.stringify({ status: { from: 'SENT', to: 'PARTIALLY_PAID' } }),
  ip: '203.0.113.1',
  createdAt: '2026-09-01T10:00:00.000Z',
};

const bucket = (value: string, count: number) => ({ __typename: 'StatBucket', value, count });

/** Answers every call of `query`, whatever its variables. */
const answer = (query: DocumentNode, data: object) => ({
  request: { query, variables: () => true },
  result: { data },
  maxUsageCount: 10,
});

const mocks = [
  answer(ListFinanceChangeLogPagedDocument, {
    listFinanceChangeLogPaged: { __typename: 'AuditLogPage', totalCount: 1, rows: [row] },
  }),
  answer(ListFinanceChangeLogStatsDocument, {
    listFinanceChangeLogStats: {
      __typename: 'TableStats',
      total: 9,
      counts: [
        {
          __typename: 'StatFieldCounts',
          field: 'action',
          buckets: [bucket('CREATE', 5), bucket('UPDATE', 3), bucket('DELETE', 1)],
        },
      ],
      sums: [],
    },
  }),
];

/** The stat tile whose label is `label` — label and figure sit two levels apart. */
const tile = (label: string) => cy.contains(label).parent().parent();

const mount = () => {
  // Desktop width, so the page renders the grid rather than the phone's card list.
  cy.viewport(1280, 800);
  cy.mount(
    <MemoryRouter>
      <MockedProvider mocks={mocks}>
        <ThemeProvider theme={theme}>
          <NotificationProvider>
            <ChangeLogPage />
          </NotificationProvider>
        </ThemeProvider>
      </MockedProvider>
    </MemoryRouter>,
  );
};

describe('ChangeLogPage', () => {
  it('shows the finance tiles and a row from the server', () => {
    mount();
    cy.contains('h1', 'Change log').should('be.visible');
    tile('Entries').should('contain.text', '9');
    tile('Created').should('contain.text', '5');
    tile('Updated').should('contain.text', '3');
    tile('Deleted').should('contain.text', '1');
    // The grid is lazy-loaded; the first spec to mount it waits for the chunk to compile.
    cy.contains('Payment recorded on Invoice INV-001', { timeout: 20_000 }).should('be.visible');
    cy.contains('[role="gridcell"]', 'Invoice').should('be.visible');
  });

  it('opens the field diff when a row is clicked, and closes it again', () => {
    mount();
    cy.contains('Payment recorded on Invoice INV-001').click();
    cy.contains('Change details').should('be.visible');
    cy.get('table[aria-label="changed fields"]').should('contain.text', 'PARTIALLY_PAID');
    cy.get('[aria-label="Close"]').click();
    cy.contains('Change details').should('not.exist');
  });
});
