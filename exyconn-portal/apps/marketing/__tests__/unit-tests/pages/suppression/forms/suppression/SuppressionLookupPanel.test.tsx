import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { AudienceRecordKind } from '@exyconn/shell/graphql/generated';
import { SuppressionLookupPanel } from '../../../../../../src/pages/suppression/forms/suppression/SuppressionLookupPanel';
import { renderWithProviders } from '../../../../test-utils';
import { suppressionRow } from '../../../../fixtures';
import { link, lookup } from '../../suppression.fixtures';

describe('SuppressionLookupPanel', () => {
  it('shows a labelled placeholder while the CRM is being looked up', () => {
    renderWithProviders(<SuppressionLookupPanel lookup={lookup()} loading />);

    expect(screen.getByLabelText('Looking up the CRM…')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders nothing before an address has been looked up', () => {
    const { container } = renderWithProviders(
      <SuppressionLookupPanel lookup={null} loading={false} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('says no CRM record holds a new address, with no existing-entry warning', () => {
    renderWithProviders(<SuppressionLookupPanel lookup={lookup()} loading={false} />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'No CRM contact or company uses this address.',
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('warns that an address is already on the list', () => {
    renderWithProviders(
      <SuppressionLookupPanel lookup={lookup({ existing: suppressionRow() })} loading={false} />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'gone@acme.io is already on the suppression list.',
    );
  });

  it('warns that an archived address is still suppressed', () => {
    renderWithProviders(
      <SuppressionLookupPanel
        lookup={lookup({ existing: suppressionRow({ archivedAt: '2026-09-02T00:00:00.000Z' }) })}
        loading={false}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'gone@acme.io is already suppressed (archived). It is still excluded from every campaign.',
    );
  });

  it('lists the CRM records holding the address with their other addresses only', () => {
    renderWithProviders(
      <SuppressionLookupPanel
        lookup={lookup({
          linkedRecords: [
            link(),
            link({
              kind: AudienceRecordKind.Company,
              id: 'company-1',
              name: 'Acme',
              emails: ['gone@acme.io'],
            }),
          ],
        })}
        loading={false}
      />,
    );

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('Grace Hopper')).toBeInTheDocument();
    expect(within(items[0]).getByText('Contact')).toBeInTheDocument();
    expect(within(items[0]).getByText('grace@home.io')).toBeInTheDocument();
    expect(within(items[0]).queryByText(/gone@acme\.io/)).not.toBeInTheDocument();
    expect(within(items[1]).getByText('Acme')).toBeInTheDocument();
    expect(within(items[1]).getByText('Company')).toBeInTheDocument();
    expect(within(items[1]).getByText('No other addresses')).toBeInTheDocument();
    expect(screen.getByText('Found in the CRM')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Only this address is suppressed. Other addresses on these records are not.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('No CRM contact or company uses this address.'),
    ).not.toBeInTheDocument();
  });
});
