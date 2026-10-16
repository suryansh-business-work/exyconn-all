import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { TableFileFormat } from '@exyconn/shell/graphql/generated';
import { downloadBase64File } from '@exyconn/shell/utils/file';
import { ExportMenuButton } from '../../../src/transfer/ExportMenuButton';
import { GridTransferBar } from '../../../src/transfer/GridTransferBar';
import { deferred } from '../import/importFixtures';
import { renderWithProviders } from '../test-utils';
import {
  clientColumns,
  exportMock,
  gridQuery,
  tableInfo,
  type Client,
  type TableInfo,
} from './transferFixtures';

vi.mock('@exyconn/shell/utils/file', async (importActual) => ({
  ...(await importActual<typeof import('@exyconn/shell/utils/file')>()),
  downloadBase64File: vi.fn(),
}));

interface BarOptions {
  info?: TableInfo | null;
  canExport?: boolean;
  canImport?: boolean;
  mocks?: MockLink.MockedResponse[];
}

const renderBar = ({
  info = tableInfo(),
  canExport = true,
  canImport = true,
  mocks = [],
}: BarOptions = {}) =>
  renderWithProviders(
    <GridTransferBar<Client>
      list="listClientsPaged"
      info={info}
      columnDefs={clientColumns}
      fileName="clients"
      title="Import client records"
      getQuery={() => gridQuery}
      canExport={canExport}
      canImport={canImport}
      canEdit
      onImported={vi.fn()}
    />,
    { mocks },
  );

const exportAs = async (label: string) => {
  await userEvent.click(screen.getByRole('button', { name: 'Export' }));
  await userEvent.click(screen.getByRole('menuitem', { name: label }));
};

beforeEach(() => {
  vi.mocked(downloadBase64File).mockClear();
});

describe('GridTransferBar', () => {
  it('renders nothing when the viewer may neither export nor import', () => {
    const { container } = renderBar({ canExport: false, canImport: false });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for an import-only viewer on a list the server does not import', () => {
    const { container } = renderBar({ canExport: false, info: null });
    expect(container).toBeEmptyDOMElement();
  });

  it('offers export alone when the viewer may not create', () => {
    renderBar({ canImport: false });
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Import' })).not.toBeInTheDocument();
  });

  it('exports as CSV and says how many rows were written', async () => {
    renderBar({ mocks: [exportMock(TableFileFormat.Csv)] });
    const button = screen.getByRole('button', { name: 'Export' });
    expect(button).not.toHaveAttribute('aria-expanded');
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(screen.getByRole('menuitem', { name: 'CSV' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Exported 3 rows.');
    expect(downloadBase64File).toHaveBeenCalledWith(
      'clients-2026-10-16.csv',
      'text/csv',
      'TmFtZQ==',
    );
    expect(screen.getByRole('button', { name: 'Export' })).toBeEnabled();
  });

  it("reports the server's reason when an Excel export fails", async () => {
    renderBar({
      mocks: [exportMock(TableFileFormat.Xlsx, { errors: [{ message: 'Too many rows' }] })],
    });
    await exportAs('Excel (.xlsx)');

    expect(await screen.findByRole('alert')).toHaveTextContent('Too many rows');
    expect(downloadBase64File).not.toHaveBeenCalled();
  });

  it('closes the format menu without exporting', async () => {
    renderBar();
    await userEvent.click(screen.getByRole('button', { name: 'Export' }));
    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(downloadBase64File).not.toHaveBeenCalled();
  });

  it('opens the import wizard and closes it again', async () => {
    renderBar({ canExport: false });
    await userEvent.click(screen.getByRole('button', { name: 'Import' }));
    expect(screen.getByRole('dialog', { name: 'Import client records' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Export' })).not.toBeInTheDocument();
  });
});

describe('ExportMenuButton', () => {
  it('locks itself while the file is being written', async () => {
    const pending = deferred<number>();
    const onExport = vi.fn(() => pending.promise);
    renderWithProviders(<ExportMenuButton onExport={onExport} />);
    await exportAs('Excel (.xlsx)');

    expect(onExport).toHaveBeenCalledWith(TableFileFormat.Xlsx);
    expect(screen.getByRole('button', { name: 'Exporting…' })).toBeDisabled();
    pending.resolve(12);
    expect(await screen.findByRole('alert')).toHaveTextContent('Exported 12 rows.');
    expect(screen.getByRole('button', { name: 'Export' })).toBeEnabled();
  });
});
