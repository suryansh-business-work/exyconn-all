import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { downloadCsv } from '@exyconn/shell/utils/csv';
import { ExportCsvButton } from '../../../src/page/ExportCsvButton';
import { renderWithProviders } from '../test-utils';

vi.mock('@exyconn/shell/utils/csv', async (importActual) => ({
  ...(await importActual<typeof import('@exyconn/shell/utils/csv')>()),
  downloadCsv: vi.fn(),
}));

interface Lead {
  name: string;
  value: number;
}

const columns = [
  { header: 'Name', value: (row: Lead) => row.name },
  { header: 'Value', value: (row: Lead) => row.value },
];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-07T09:30:00Z'));
  vi.mocked(downloadCsv).mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ExportCsvButton', () => {
  it('saves the rows as a dated CSV and says how many went out', async () => {
    const loadRows = vi.fn(() =>
      Promise.resolve([
        { name: 'Acme', value: 10 },
        { name: 'Globex', value: 20 },
      ]),
    );
    renderWithProviders(<ExportCsvButton fileName="leads" columns={columns} loadRows={loadRows} />);

    await userEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Exported 2 rows.');
    expect(downloadCsv).toHaveBeenCalledWith(
      'leads-2026-10-07',
      'Name,Value\r\nAcme,10\r\nGlobex,20',
    );
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeEnabled();
  });

  it('is disabled while the rows load', async () => {
    let finish: (rows: Lead[]) => void = () => undefined;
    const loadRows = vi.fn(
      () =>
        new Promise<Lead[]>((resolve) => {
          finish = resolve;
        }),
    );
    renderWithProviders(<ExportCsvButton fileName="leads" columns={columns} loadRows={loadRows} />);

    await userEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeDisabled();

    finish([]);
    expect(await screen.findByRole('alert')).toHaveTextContent('Exported 0 rows.');
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeEnabled();
    expect(downloadCsv).toHaveBeenCalledWith('leads-2026-10-07', 'Name,Value');
  });

  it('shows why the export failed and saves nothing', async () => {
    const loadRows = vi.fn(() => Promise.reject(new Error('Your role may not export this data.')));
    renderWithProviders(<ExportCsvButton fileName="leads" columns={columns} loadRows={loadRows} />);

    await userEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Your role may not export this data.',
    );
    expect(downloadCsv).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeEnabled();
  });

  it('falls back to a general message for a failure that is not an Error', async () => {
    const notAnError: unknown = 'offline';
    const loadRows = vi.fn(() => Promise.reject(notAnError));
    renderWithProviders(<ExportCsvButton fileName="leads" columns={columns} loadRows={loadRows} />);

    await userEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The export failed.');
  });
});
