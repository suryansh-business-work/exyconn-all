import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { AudienceRecordKind } from '@exyconn/shell/graphql/generated';
import { SuppressionDetails } from '../../../../src/pages/suppression/SuppressionDetails';
import { renderWithProviders } from '../../test-utils';
import { answered, pending } from '../../fixtures';
import { historyRow, link, pagedRow } from './suppression.fixtures';

const gql = vi.hoisted(() => ({ history: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useMarketingSuppressionHistoryQuery: (options: unknown) => gql.history(options),
}));

/** The value printed under a fact's label. */
const fact = (label: string) => screen.getByText(label).nextElementSibling;

/** The list that follows the heading `heading`. */
const listAfter = (heading: string) => {
  const list = screen.getByText(heading).nextElementSibling;
  if (!(list instanceof HTMLElement)) {
    throw new TypeError(`Nothing follows ${heading}`);
  }
  return list;
};

describe('SuppressionDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.history.mockReturnValue(answered({ marketingSuppressionHistory: [] }));
  });

  it('shows every fact of an active suppression, with dashes for blanks', () => {
    renderWithProviders(<SuppressionDetails row={pagedRow({ source: '' })} />);

    expect(fact('Email')).toHaveTextContent('gone@acme.io');
    expect(fact('Reason')).toHaveTextContent('UNSUBSCRIBED');
    expect(fact('Source')).toHaveTextContent('SUBSCRIBER');
    expect(fact('Source detail')).toHaveTextContent('—');
    expect(fact('Scope')).toHaveTextContent('ORGANIZATION MARKETING');
    expect(fact('Status')).toHaveTextContent('ACTIVE');
    expect(fact('Added on')).toHaveTextContent(/2026/);
    expect(fact('Added by')).toHaveTextContent('—');
    expect(fact('Internal note')).toHaveTextContent('—');
    expect(screen.queryByText(/^Archived:/)).not.toBeInTheDocument();
  });

  it('shows the source detail, who added it and the note when recorded', () => {
    renderWithProviders(
      <SuppressionDetails row={pagedRow({ addedByName: 'Ada Admin', note: 'Asked by phone' })} />,
    );

    expect(fact('Source detail')).toHaveTextContent('Footer link');
    expect(fact('Added by')).toHaveTextContent('Ada Admin');
    expect(fact('Internal note')).toHaveTextContent('Asked by phone');
  });

  it('marks an archived suppression and says it still applies', () => {
    renderWithProviders(
      <SuppressionDetails row={pagedRow({ archivedAt: '2026-09-02T00:00:00.000Z' })} />,
    );

    expect(fact('Status')).toHaveTextContent('ARCHIVED');
    expect(
      screen.getByText('Archived: hidden from the main list, still excluded from every campaign.'),
    ).toBeInTheDocument();
  });

  it.each([
    ['no linked records', pagedRow({ linkedRecords: [] })],
    ['linked records left out', pagedRow({ linkedRecords: null })],
  ])('says no CRM record uses the address when there are %s', (_, row) => {
    renderWithProviders(<SuppressionDetails row={row} />);

    expect(screen.getByText('No CRM contact or company uses this address.')).toBeInTheDocument();
  });

  it('lists the CRM contacts and companies holding the address with all their addresses', () => {
    renderWithProviders(
      <SuppressionDetails
        row={pagedRow({
          linkedRecords: [
            link(),
            link({
              kind: AudienceRecordKind.Company,
              id: 'co-1',
              name: 'Acme',
              emails: ['gone@acme.io'],
            }),
          ],
        })}
      />,
    );

    const items = within(listAfter('Linked CRM records')).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'Grace Hopper (Contact)Addresses: gone@acme.io, grace@home.io',
      'Acme (Company)Addresses: gone@acme.io',
    ]);
  });

  it('reads the address history fresh from the server', () => {
    renderWithProviders(<SuppressionDetails row={pagedRow()} />);

    expect(gql.history).toHaveBeenCalledWith({
      variables: { email: 'gone@acme.io' },
      fetchPolicy: 'network-only',
    });
    expect(screen.getByText('No recorded changes yet.')).toBeInTheDocument();
  });

  it('treats a history answer with no data as no changes', () => {
    gql.history.mockReturnValue({ data: undefined, loading: false, error: undefined });
    renderWithProviders(<SuppressionDetails row={pagedRow()} />);

    expect(screen.getByText('No recorded changes yet.')).toBeInTheDocument();
  });

  it('shows a placeholder while the history loads', () => {
    gql.history.mockReturnValue(pending());
    renderWithProviders(<SuppressionDetails row={pagedRow()} />);

    expect(screen.queryByText('No recorded changes yet.')).not.toBeInTheDocument();
    expect(listAfter('History')).toHaveClass('MuiSkeleton-root');
  });

  it('shows why the history could not be read', () => {
    gql.history.mockReturnValue({ data: undefined, loading: false, error: new Error('Forbidden') });
    renderWithProviders(<SuppressionDetails row={pagedRow()} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Forbidden');
  });

  it('lists each change with who made it, naming the system when no one did', () => {
    gql.history.mockReturnValue(
      answered({
        marketingSuppressionHistory: [
          historyRow({ id: 'audit-2', summary: 'Note changed' }),
          historyRow({ id: 'audit-1', actorName: '', summary: 'Added from a bounce' }),
        ],
      }),
    );
    renderWithProviders(<SuppressionDetails row={pagedRow()} />);

    const items = within(listAfter('History')).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('Note changed')).toBeInTheDocument();
    expect(within(items[0]).getByText(/^Ada Admin · .*2026/)).toBeInTheDocument();
    expect(within(items[1]).getByText('Added from a bounce')).toBeInTheDocument();
    expect(within(items[1]).getByText(/^System · .*2026/)).toBeInTheDocument();
  });
});
