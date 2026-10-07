import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { LicenceStatus } from '@exyconn/shell/graphql/generated';
import { AssetLicenceSeats } from '../../../../../src/pages/assets/detail';
import { formatDate } from '../../../core/settings.mock';
import { renderWithProviders } from '../../../test-utils';

const gql = vi.hoisted(() => ({ seats: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useLicenceSeatsForQuery: gql.seats,
}));

const renderSeats = (employeeId: string, employeeName: string) =>
  renderWithProviders(
    <AssetLicenceSeats
      employeeId={employeeId}
      employeeName={employeeName}
      formatDate={formatDate}
    />,
  );

const SEATS = [
  {
    id: 'lic-1',
    name: 'Figma',
    vendor: 'Figma Inc',
    renewalDate: '2027-01-01',
    status: LicenceStatus.Active,
  },
  {
    id: 'lic-2',
    name: 'Zoom',
    vendor: 'Zoom Video',
    renewalDate: '2026-12-01',
    status: LicenceStatus.Cancelled,
  },
];

describe('AssetLicenceSeats', () => {
  beforeEach(() => {
    gql.seats.mockReset().mockReturnValue({ data: undefined, loading: false });
  });

  it('shows nothing, and asks for nothing, while nobody holds the asset', () => {
    renderSeats('', '');
    expect(screen.queryByText(/Licences held/)).not.toBeInTheDocument();
    expect(gql.seats).toHaveBeenCalledWith({ variables: { employeeId: '' }, skip: true });
  });

  it('shows a spinner until the seats first answer', () => {
    gql.seats.mockReturnValue({ data: undefined, loading: true });
    renderSeats('emp-1', 'Ana Rao');
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('says so when the holder has no seats', () => {
    renderSeats('emp-1', 'Ana Rao');
    expect(screen.getByText('Licences held by Ana Rao (0)')).toBeInTheDocument();
    expect(screen.getByText('No licence seats are assigned to this person.')).toBeInTheDocument();
  });

  it('lists each seat with its vendor, renewal and status', () => {
    gql.seats.mockReturnValue({ data: { licenceSeatsFor: SEATS }, loading: true });
    renderSeats('emp-1', '');
    expect(screen.getByText('Licences held (2)')).toBeInTheDocument();
    expect(screen.getByText('Figma · Figma Inc')).toBeInTheDocument();
    expect(screen.getByText('Renews on 2027-01-01')).toBeInTheDocument();
    expect(screen.getByText('Zoom · Zoom Video')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('CANCELLED')).toBeInTheDocument();
  });
});
