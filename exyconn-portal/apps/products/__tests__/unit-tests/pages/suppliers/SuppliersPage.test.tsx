import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListSuppliersPagedDocument } from '@exyconn/shell/graphql/generated';
import { SuppliersPage } from '../../../../src/pages/suppliers';
import { SUPPLIER_COLUMNS } from '../../../../src/pages/suppliers/suppliers-grid';
import { renderWithProviders } from '../../test-utils';
import { pending, supplierRow, tableStats } from '../../fixtures';
import { dashboardProps, paged } from '../../crud-dashboard-stub';
import { confirmRowDelete, runRowAction, statLines } from '../../crud-page-helpers';

const gql = vi.hoisted(() => ({ stats: vi.fn(), refetch: vi.fn(), deleteSupplier: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListSuppliersStatsQuery: () => gql.stats(),
  useDeleteSupplierMutation: () => [gql.deleteSupplier],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../crud-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/suppliers/forms/supplier', async () => ({
  SupplierForm: (await import('../../form-stub')).FormStub,
}));

describe('SuppliersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.deleteSupplier.mockResolvedValue({ data: { deleteSupplier: true } });
    gql.stats.mockReturnValue({
      data: {
        listSuppliersStats: tableStats(10, { status: { ACTIVE: 6, ON_HOLD: 1, INACTIVE: 3 } }),
      },
      loading: false,
      refetch: gql.refetch,
    });
  });

  it('counts the suppliers by status from the stats query', () => {
    renderWithProviders(<SuppliersPage />);

    expect(statLines()).toEqual(['Suppliers: 10', 'Active: 6', 'On hold: 1', 'Inactive: 3']);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('marks the tiles loading until the stats answer', () => {
    gql.stats.mockReturnValue(pending());
    renderWithProviders(<SuppliersPage />);

    expect(dashboardProps().statsLoading).toBe(true);
    expect(statLines()[0]).toBe('Suppliers: 0');
  });

  it('drives the server grid with the paged suppliers query and the supplier columns', () => {
    renderWithProviders(<SuppliersPage />);
    const page = { totalCount: 1, rows: [supplierRow()] };

    expect(paged.document).toBe(ListSuppliersPagedDocument);
    expect(paged.select?.({ listSuppliersPaged: page } as never)).toBe(page);
    expect(dashboardProps().columnDefs).toBe(SUPPLIER_COLUMNS);
    expect(dashboardProps()).toMatchObject({ title: 'Suppliers', exportFileName: 'suppliers' });
  });

  it('opens the form blank for a new supplier and with the row for an edit', async () => {
    renderWithProviders(<SuppliersPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));

    await runRowAction('edit', supplierRow({ name: 'Globex Parts' }));
    expect(screen.getByText(/"name":"Globex Parts"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(screen.queryByText(/Globex Parts/)).not.toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('deletes a supplier after confirming, by its id', async () => {
    renderWithProviders(<SuppliersPage />);

    await confirmRowDelete(supplierRow({ id: 'supplier-4' }), 'Delete supplier "Acme Supplies"?');

    expect(gql.deleteSupplier).toHaveBeenCalledWith({ variables: { id: 'supplier-4' } });
    expect(await screen.findByText('Supplier deleted')).toBeInTheDocument();
  });

  it('reports a delete the server refused and keeps the stats as they were', async () => {
    gql.deleteSupplier.mockRejectedValueOnce(new Error('Supplier has open orders'));
    renderWithProviders(<SuppliersPage />);

    await confirmRowDelete(supplierRow(), 'Delete supplier "Acme Supplies"?');

    expect(await screen.findByText('Supplier has open orders')).toBeInTheDocument();
    expect(gql.refetch).not.toHaveBeenCalled();
  });
});
