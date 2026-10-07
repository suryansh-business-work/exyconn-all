import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { downloadCsv } from '@exyconn/shell/utils/csv';
import type { GridQuery } from '@exyconn/shell/components/data/serverGridQuery';
import { CanExportDocument, SortDir } from '@exyconn/shell/graphql/generated';
import { actionsColumn, dateColumn, textColumn } from '../../../src/grid/columns';
import { GridExportButton, useGridQuery } from '../../../src/page/ExportCsvButton';
import { renderWithProviders } from '../test-utils';

vi.mock('@exyconn/shell/utils/csv', async (importActual) => ({
  ...(await importActual<typeof import('@exyconn/shell/utils/csv')>()),
  downloadCsv: vi.fn(),
}));

interface Lead {
  name: string;
  createdAt: string;
}

const columnDefs = [
  textColumn<Lead>('name', 'Name'),
  dateColumn<Lead>('createdAt', 'Created'),
  actionsColumn<Lead>(),
];

const query: GridQuery = { search: 'ac', sort: { field: 'name', dir: SortDir.Asc }, filters: [] };

const canExportMock = (result: MockLink.MockedResponse['result']): MockLink.MockedResponse => ({
  request: { query: CanExportDocument, variables: { module: 'Leads' } },
  result,
});

const fetchOnePage = () =>
  vi.fn(() =>
    Promise.resolve({ rows: [{ name: 'Acme', createdAt: '2026-10-02' }], totalCount: 1 }),
  );

const renderButton = (
  fetchRows: ReturnType<typeof fetchOnePage>,
  extra: { permissionModule?: string; mocks?: MockLink.MockedResponse[]; context?: object } = {},
) =>
  renderWithProviders(
    <GridExportButton<Lead>
      fileName="leads"
      columnDefs={columnDefs}
      fetchRows={fetchRows}
      getQuery={() => query}
      context={extra.context}
      permissionModule={extra.permissionModule}
    />,
    { mocks: extra.mocks },
  );

const clickExport = () => userEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-07T09:30:00Z'));
  vi.mocked(downloadCsv).mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('GridExportButton', () => {
  it("exports every row under the grid's query, as the grid shows it", async () => {
    const fetchRows = fetchOnePage();
    renderButton(fetchRows, { context: { formatDate: (iso: string) => `on ${iso}` } });
    await clickExport();

    expect(await screen.findByRole('alert')).toHaveTextContent('Exported 1 rows.');
    expect(fetchRows).toHaveBeenCalledWith({ ...query, page: 0, pageSize: 200 });
    expect(downloadCsv).toHaveBeenCalledWith(
      'leads-2026-10-07',
      'Name,Created\r\nAcme,on 2026-10-02',
    );
  });

  it("formats dates through the viewer's settings when the page passes no context", async () => {
    renderButton(fetchOnePage());
    await clickExport();

    expect(await screen.findByRole('alert')).toHaveTextContent('Exported 1 rows.');
    const csv = vi.mocked(downloadCsv).mock.calls[0]?.[1] ?? '';
    expect(csv.startsWith('Name,Created\r\nAcme,')).toBe(true);
    expect(csv).not.toContain('2026-10-02');
    expect(csv).toContain('2026');
  });

  it('asks the server once whether the role may export before reading a page', async () => {
    const fetchRows = fetchOnePage();
    renderButton(fetchRows, {
      permissionModule: 'Leads',
      mocks: [canExportMock({ data: { canExport: true } })],
    });
    await clickExport();

    expect(await screen.findByRole('alert')).toHaveTextContent('Exported 1 rows.');
    expect(fetchRows).toHaveBeenCalledTimes(1);
  });

  it('refuses the export when the role may not export', async () => {
    const fetchRows = fetchOnePage();
    renderButton(fetchRows, {
      permissionModule: 'Leads',
      mocks: [canExportMock({ data: { canExport: false } })],
    });
    await clickExport();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Your role may not export this data.',
    );
    expect(fetchRows).not.toHaveBeenCalled();
    expect(downloadCsv).not.toHaveBeenCalled();
  });

  it('reports a failed permission check', async () => {
    const fetchRows = fetchOnePage();
    renderButton(fetchRows, {
      permissionModule: 'Leads',
      mocks: [canExportMock({ errors: [{ message: 'Not signed in' }] })],
    });
    await clickExport();

    expect(await screen.findByRole('alert')).toHaveTextContent('Not signed in');
    expect(fetchRows).not.toHaveBeenCalled();
  });
});

describe('useGridQuery', () => {
  it('starts empty, remembers the last query and stays stable', () => {
    const { result, rerender } = renderHook(() => useGridQuery());
    const first = result.current;
    expect(first.getQuery()).toEqual({ search: null, sort: null, filters: [] });

    act(() => first.onQuery(query));
    rerender();
    expect(result.current).toBe(first);
    expect(result.current.getQuery()).toBe(query);
  });
});
