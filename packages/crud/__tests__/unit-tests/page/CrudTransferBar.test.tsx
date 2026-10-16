import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import type { GridFetcher } from '@exyconn/shell/components/data/ServerDataGrid';
import type { PermissionActionKey } from '@exyconn/shell/hooks/usePermissions';
import { CrudTransferBar } from '../../../src/page/CrudTransferBar';
import { renderWithProviders } from '../test-utils';
import { tableInfo, tableInfoMock } from '../transfer/transferFixtures';
import { fetchLeads, leadColumns, type Lead } from './dashboardFixtures';

const listFetcher = (): GridFetcher<Lead> =>
  Object.assign(fetchLeads(), { list: 'listLeadsPaged' });

interface BarOptions {
  fetchRows?: GridFetcher<Lead>;
  exportFileName?: string;
  may?: (action: PermissionActionKey) => boolean;
  mocks?: MockLink.MockedResponse[];
}

const renderBar = ({
  fetchRows = fetchLeads(),
  exportFileName,
  may = () => true,
  mocks = [],
}: BarOptions = {}) =>
  renderWithProviders(
    <CrudTransferBar<Lead>
      fetchRows={fetchRows}
      columnDefs={leadColumns}
      exportFileName={exportFileName}
      entityLabel="lead"
      gridQuery={{ getQuery: () => ({ search: null, sort: null, filters: [] }), onQuery: vi.fn() }}
      gridContext={{}}
      may={may}
      onImported={vi.fn()}
    />,
    { mocks },
  );

describe('CrudTransferBar on a registered paged list', () => {
  it('offers server export and import once the server opens the list to import', async () => {
    renderBar({
      fetchRows: listFetcher(),
      exportFileName: 'leads',
      mocks: [tableInfoMock('listLeadsPaged', tableInfo())],
    });
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();

    await userEvent.click(await screen.findByRole('button', { name: 'Import' }));
    expect(screen.getByRole('dialog', { name: 'Import lead records' })).toBeInTheDocument();
  });

  it('has no export without a file name, and no import when the role may not create', async () => {
    const may = vi.fn((action: PermissionActionKey) => action !== 'create');
    const { container } = renderBar({
      fetchRows: listFetcher(),
      may,
      mocks: [tableInfoMock('listLeadsPaged', tableInfo())],
    });
    await vi.waitFor(() => expect(may).toHaveBeenCalledWith('edit'));
    expect(container).toBeEmptyDOMElement();
  });
});

describe('CrudTransferBar on its own query input', () => {
  it('keeps the CSV export built from the grid pages', () => {
    renderBar({ exportFileName: 'leads' });
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Import' })).not.toBeInTheDocument();
  });

  it('shows nothing without a file name or when the role may not export', () => {
    const { container, unmount } = renderBar();
    expect(container).toBeEmptyDOMElement();
    unmount();

    const denied = renderBar({ exportFileName: 'leads', may: (action) => action !== 'export' });
    expect(denied.container).toBeEmptyDOMElement();
  });
});
