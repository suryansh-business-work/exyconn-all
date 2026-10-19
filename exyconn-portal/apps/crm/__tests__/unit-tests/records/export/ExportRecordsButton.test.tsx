import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrmObject } from '@exyconn/shell/graphql/generated';
import { ExportRecordsButton } from '../../../../src/records/export';
import { renderWithProviders } from '../../test-utils';
import { objectSchema, property, recordRow } from '../records-fixtures';

const mocked = vi.hoisted(() => ({
  canExport: vi.fn(),
  schema: vi.fn(),
  fetchAll: vi.fn(),
  download: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCanExportQuery: (options: unknown) => mocked.canExport(options),
}));

vi.mock('../../../../src/records/schema', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/records/schema')>()),
  useObjectSchema: () => mocked.schema(),
}));

vi.mock('../../../../src/records/export/fetchRecords', () => ({
  fetchAllRecords: (...args: unknown[]) => mocked.fetchAll(...args),
}));

vi.mock('@exyconn/shell/utils/csv', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/utils/csv')>()),
  downloadCsv: (...args: unknown[]) => mocked.download(...args),
}));

vi.mock('@exyconn/shell/logging/portalLogger', () => ({
  portalLogger: { error: (...args: unknown[]) => mocked.logError(...args) },
}));

const NAME = property();
const EMAIL = property({ key: 'email', label: 'Email' });
const QUERY = { search: '', groups: [], sorts: [] };

function renderButton(columns: readonly string[] = ['email']) {
  return renderWithProviders(
    <ExportRecordsButton
      object={CrmObject.Company}
      query={QUERY}
      columns={columns}
      fileName="companies"
    />,
  );
}

async function exportWith(option: string) {
  await userEvent.click(screen.getByRole('button', { name: 'Export' }));
  await userEvent.click(screen.getByRole('menuitem', { name: option }));
}

describe('ExportRecordsButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.canExport.mockReturnValue({ data: { canExport: true } });
    mocked.schema.mockReturnValue(objectSchema([NAME, EMAIL]));
    mocked.fetchAll.mockResolvedValue({
      rows: [recordRow({ name: 'Acme', email: 'hi@acme.io' })],
      totalCount: 1,
    });
  });

  it('is hidden for a role that may not export', () => {
    mocked.canExport.mockReturnValue({ data: { canExport: false } });
    renderButton();
    expect(screen.queryByRole('button', { name: 'Export' })).not.toBeInTheDocument();
    expect(mocked.canExport).toHaveBeenCalledWith({ variables: { module: 'Company' } });
  });

  it('is hidden until the permission answers', () => {
    mocked.canExport.mockReturnValue({ data: undefined });
    renderButton();
    expect(screen.queryByRole('button', { name: 'Export' })).not.toBeInTheDocument();
  });

  it('is disabled until the properties have loaded', () => {
    mocked.schema.mockReturnValue(objectSchema([]));
    renderButton();
    expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled();
  });

  it('exports every property and says how many rows were saved', async () => {
    renderButton();
    const button = screen.getByRole('button', { name: 'Export' });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await exportWith('Export all properties');

    await screen.findByText('Exported 1 rows.');
    expect(mocked.fetchAll).toHaveBeenCalledWith(expect.anything(), CrmObject.Company, QUERY);
    const [fileName, csv] = mocked.download.mock.calls[0] as [string, string];
    expect(fileName).toMatch(/^companies-\d{4}-\d{2}-\d{2}$/);
    expect(csv).toContain('Name,Email');
    expect(csv).toContain('Acme,hi@acme.io');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('exports only the visible columns', async () => {
    renderButton(['email']);
    await exportWith('Export visible columns');

    await waitFor(() => expect(mocked.download).toHaveBeenCalled());
    const csv = mocked.download.mock.calls[0][1] as string;
    expect(csv).toContain('Email');
    expect(csv).not.toContain('Name');
  });

  it('cannot export visible columns when none are shown', async () => {
    renderButton([]);
    await userEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(screen.getByRole('button', { name: 'Export', hidden: true })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('menuitem', { name: 'Export visible columns' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('warns when the cap cut the export short', async () => {
    mocked.fetchAll.mockResolvedValue({ rows: [recordRow({ name: 'Acme' })], totalCount: 9 });
    renderButton();
    await exportWith('Export all properties');

    await screen.findByText(
      'Exported the first 1 of 9 rows. Narrow the filters to export the rest.',
    );
  });

  it('shows the failure, logs it and frees the button again', async () => {
    let fail: (reason: Error) => void = () => undefined;
    mocked.fetchAll.mockReturnValue(
      new Promise((_resolve, reject) => {
        fail = reject;
      }),
    );
    renderButton();
    await exportWith('Export all properties');

    expect(await screen.findByRole('button', { name: 'Exporting…' })).toBeDisabled();
    fail(new Error('Server down'));

    await screen.findByText('Server down');
    expect(mocked.logError).toHaveBeenCalledWith('CRM export failed', expect.any(Error));
    expect(screen.getByRole('button', { name: 'Export' })).toBeEnabled();
    expect(mocked.download).not.toHaveBeenCalled();
  });

  it('still logs when reporting the failure itself fails', async () => {
    mocked.fetchAll.mockRejectedValue(new Error('Server down'));
    mocked.logError.mockImplementationOnce(() => {
      throw new Error('Logger offline');
    });
    renderButton();
    await exportWith('Export all properties');

    await waitFor(() =>
      expect(mocked.logError).toHaveBeenLastCalledWith(
        'Starting a CRM export failed',
        expect.objectContaining({ message: 'Logger offline' }),
      ),
    );
    expect(screen.getByRole('button', { name: 'Export' })).toBeEnabled();
  });
});
