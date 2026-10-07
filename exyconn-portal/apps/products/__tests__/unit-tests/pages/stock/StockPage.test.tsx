import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ColDef } from 'ag-grid-community';
import { ListStockMovementsPagedDocument } from '@exyconn/shell/graphql/generated';
import { StockPage } from '../../../../src/pages/stock';
import { MOVEMENT_COLUMNS } from '../../../../src/pages/stock/stock-grid';
import { renderWithProviders } from '../../test-utils';
import { movementRow } from '../../fixtures';
import { paged } from '../../crud-dashboard-stub';

interface GridProps {
  columnDefs: ColDef[];
  fetchRows: unknown;
  refreshSignal: number;
  onQuery: (query: object) => void;
  searchPlaceholder: string;
}

interface ExportProps {
  fileName: string;
  columnDefs: ColDef[];
  fetchRows: unknown;
  getQuery: () => object;
}

const recorded = vi.hoisted(() => ({ grid: null as unknown, exporter: null as unknown }));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../crud-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    usePagedFetcher: stub.usePagedFetcherStub,
    GridExportButton: (props: Readonly<ExportProps>) => {
      recorded.exporter = props;
      return <button type="button">Export</button>;
    },
  };
});

/** ag-grid does not lay out under jsdom; the stand-in records what the page hands it. */
vi.mock('@exyconn/shell/components/data/ServerDataGrid', () => ({
  ServerDataGrid: (props: Readonly<GridProps>) => {
    recorded.grid = props;
    return <p>{`Grid refresh ${props.refreshSignal}`}</p>;
  },
}));

vi.mock('../../../../src/pages/stock/forms/stock-movement', async () => ({
  StockMovementForm: (await import('../../form-stub')).FormStub,
}));

const grid = () => recorded.grid as GridProps;
const exporter = () => recorded.exporter as ExportProps;

describe('StockPage', () => {
  beforeEach(() => {
    recorded.grid = null;
    recorded.exporter = null;
  });

  it('lists every movement in the server grid, with an export of the same rows', () => {
    renderWithProviders(<StockPage />);
    const page = { totalCount: 1, rows: [movementRow()] };

    expect(screen.getByRole('heading', { name: 'Stock' })).toBeInTheDocument();
    expect(paged.document).toBe(ListStockMovementsPagedDocument);
    expect(paged.select?.({ listStockMovementsPaged: page } as never)).toBe(page);
    expect(grid()).toMatchObject({ columnDefs: MOVEMENT_COLUMNS, refreshSignal: 0 });
    expect(exporter()).toMatchObject({ fileName: 'stock-movements', columnDefs: MOVEMENT_COLUMNS });
    expect(exporter().fetchRows).toBe(grid().fetchRows);
  });

  it('exports under whatever search and sort the grid last reported', () => {
    renderWithProviders(<StockPage />);
    const query = { search: 'Widget', sort: [] };

    grid().onQuery(query);

    expect(exporter().getQuery()).toBe(query);
  });

  it('records a movement on its own page and goes back to the log from the back link', async () => {
    renderWithProviders(<StockPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Record movement' }));
    expect(screen.getByRole('heading', { name: 'Record stock movement' })).toBeInTheDocument();
    expect(screen.getByText('Blank form')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Back to Stock' }));
    expect(screen.getByRole('heading', { name: 'Stock' })).toBeInTheDocument();
    expect(screen.getByText('Grid refresh 0')).toBeInTheDocument();
  });

  it('goes back without reloading when the form is cancelled', async () => {
    renderWithProviders(<StockPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Record movement' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));

    expect(screen.getByText('Grid refresh 0')).toBeInTheDocument();
  });

  it('goes back and re-reads the log once a movement is recorded', async () => {
    renderWithProviders(<StockPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Record movement' }));
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(screen.getByText('Grid refresh 1')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Record movement' }));
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(screen.getByText('Grid refresh 2')).toBeInTheDocument();
  });
});
