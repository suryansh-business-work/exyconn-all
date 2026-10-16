import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { downloadCsv } from '@exyconn/shell/utils/csv';
import { ImportDialog } from '../../../src/import';
import type { ImportSource } from '../../../src/import/import.types';
import { renderWithProviders } from '../test-utils';
import {
  chunkSpy,
  csvFile,
  deferred,
  leadSource,
  okChunk,
  parseMock,
  type Mode,
} from './importFixtures';

vi.mock('@exyconn/shell/utils/csv', async (importActual) => ({
  ...(await importActual<typeof import('@exyconn/shell/utils/csv')>()),
  downloadCsv: vi.fn(),
}));

const twoRows = [
  ['Acme', 'hi@acme.test', 'x'],
  ['Beta', 'hi@beta.test', ''],
];

const renderDialog = (
  source: ImportSource<Mode>,
  mocks: MockLink.MockedResponse[] = [parseMock(twoRows)],
) => {
  const onImported = vi.fn();
  const onClose = vi.fn();
  renderWithProviders(<ImportDialog source={source} onImported={onImported} onClose={onClose} />, {
    mocks,
  });
  return { onImported, onClose };
};

const upload = async () => {
  await userEvent.upload(screen.getByLabelText('Choose a CSV or Excel file'), csvFile());
  await screen.findByText('leads.csv: 2 rows ready to map.');
};

const click = (name: string) => userEvent.click(screen.getByRole('button', { name }));

/** Uploads the file and walks to the options step. */
const toOptions = async () => {
  await upload();
  await click('Next');
  await click('Next');
  await screen.findByText('What should the import do?');
};

beforeEach(() => {
  vi.mocked(downloadCsv).mockClear();
});

describe('ImportDialog', () => {
  it('uploads, maps, runs and reports, then downloads the failed rows', async () => {
    const runChunk = chunkSpy(() =>
      Promise.resolve(
        okChunk({
          created: 1,
          updated: 0,
          skipped: 1,
          issues: [
            { row: 3, message: 'Email taken', skipped: false },
            { row: 2, message: 'No match', skipped: true },
          ],
        }),
      ),
    );
    const { onImported, onClose } = renderDialog(leadSource({ runChunk }));

    expect(screen.getByRole('dialog', { name: 'Import leads' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    await upload();
    await click('Next');

    // Organisation reached Company through a synonym, Mail reached Email through an alias.
    expect(screen.getByLabelText('Import Organisation as')).toHaveTextContent('Company *');
    expect(screen.getByLabelText('Import Mail as')).toHaveTextContent('Email *');
    // Notes matches nothing, so it starts as "Don't import" (an empty selection).
    expect(screen.getByLabelText('Import Notes as')).not.toHaveTextContent(/[a-z]/i);
    await click('Next');

    await userEvent.click(screen.getByRole('radio', { name: 'Create new only' }));
    expect(screen.getByText(/Rows are matched to existing records by Email\./)).toBeInTheDocument();
    await click('Start import');

    expect(await screen.findByText('Created')).toBeInTheDocument();
    expect(runChunk).toHaveBeenCalledWith(
      [
        { name: 'Acme', email: 'hi@acme.test' },
        { name: 'Beta', email: 'hi@beta.test' },
      ],
      'CREATE',
      2,
    );
    expect(onImported).toHaveBeenCalledTimes(1);
    const counts = screen.getAllByRole('status').at(-1);
    expect(counts).toHaveTextContent('Created1Updated0Skipped1Failed1');
    const issues = screen.getByRole('list', { name: 'Import issues' });
    expect(within(issues).getByText('Line 3')).toBeInTheDocument();
    expect(within(issues).getByText('Email taken')).toBeInTheDocument();

    await click('Download issues CSV');
    expect(downloadCsv).toHaveBeenCalledWith(
      'leads-issues',
      [
        'Organisation,Mail,Notes,Line,Issue',
        'Beta,hi@beta.test,,3,Email taken',
        'Acme,hi@acme.test,x,2,No match',
      ].join('\r\n'),
    );

    await click('Close');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('holds the map step until every required field has a column', async () => {
    renderDialog(leadSource(), [parseMock(twoRows, ['Company', 'Extra', ''])]);
    await upload();
    await click('Next');

    expect(screen.getByText('Map a column to each required field: Email.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();

    await userEvent.click(screen.getByLabelText('Import Extra as'));
    await userEvent.click(screen.getByRole('option', { name: 'Email *' }));
    expect(
      screen.queryByText('Map a column to each required field: Email.'),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();

    await click('Back');
    expect(screen.getByText('leads.csv: 2 rows ready to map.')).toBeInTheDocument();
  });

  it('closes straight away from the upload step', async () => {
    const { onClose } = renderDialog(leadSource());
    await click('Cancel');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('logs a close that fails rather than leaving it unhandled', async () => {
    const logError = vi.spyOn(portalLogger, 'error').mockImplementation(() => undefined);
    const failure = new Error('Parent unmounted');
    renderWithProviders(
      <ImportDialog
        source={leadSource()}
        onImported={vi.fn()}
        onClose={() => {
          throw failure;
        }}
      />,
    );
    await click('Cancel');

    await vi.waitFor(() =>
      expect(logError).toHaveBeenCalledWith('Closing an import failed', failure),
    );
    logError.mockRestore();
  });

  it('shows why the fields could not be loaded', () => {
    renderDialog(leadSource({ loadError: 'Could not load the fields.' }));
    expect(screen.getByText('Could not load the fields.')).toBeInTheDocument();
  });

  it('downloads a sample, and says so when that fails', async () => {
    const downloadTemplate = vi
      .fn<(format: string) => Promise<void>>()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Sample unavailable'));
    renderDialog(leadSource({ downloadTemplate }));

    await click('Download sample CSV');
    expect(downloadTemplate).toHaveBeenLastCalledWith('CSV');
    expect(screen.queryByRole('alert', { hidden: true })).not.toBeInTheDocument();

    await click('Download sample Excel');
    expect(downloadTemplate).toHaveBeenLastCalledWith('XLSX');
    // The snackbar sits behind the modal dialog, so it is found by its text.
    expect(await screen.findByText('Sample unavailable')).toBeInTheDocument();
  });

  it('asks before closing mid-run, and keeps going when told to', async () => {
    const chunk = deferred<ReturnType<typeof okChunk>>();
    const runChunk = chunkSpy(() => chunk.promise);
    const { onClose, onImported } = renderDialog(leadSource({ runChunk }));
    await toOptions();
    await click('Start import');

    expect(screen.getByText('Imported 0 of 2 rows')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Import leads' }), { key: 'Escape' });
    expect(await screen.findByText('Stop the import?')).toBeInTheDocument();
    await click('Keep importing');
    expect(onClose).not.toHaveBeenCalled();

    chunk.resolve(okChunk({ created: 2 }));
    expect(await screen.findByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(onImported).toHaveBeenCalledTimes(1);
  });

  it('stops after the chunk in flight when closed mid-run', async () => {
    const chunk = deferred<ReturnType<typeof okChunk>>();
    const runChunk = chunkSpy(() => chunk.promise);
    const { onClose } = renderDialog(leadSource({ runChunk }));
    await toOptions();
    await click('Start import');

    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Import leads' }), { key: 'Escape' });
    await click('Stop import');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cancels between chunks and keeps what was imported', async () => {
    const many = Array.from({ length: 501 }, (_, index) => [`Lead ${index}`, `l${index}@x.test`]);
    const first = deferred<ReturnType<typeof okChunk>>();
    const runChunk = chunkSpy(() => first.promise);
    renderDialog(leadSource({ runChunk }), [parseMock(many, ['Organisation', 'Mail'])]);
    await userEvent.upload(screen.getByLabelText('Choose a CSV or Excel file'), csvFile());
    await screen.findByText('leads.csv: 501 rows ready to map.');
    await click('Next');
    await click('Next');
    await click('Start import');

    await click('Cancel import');
    expect(screen.getByRole('button', { name: 'Cancel import' })).toBeDisabled();
    expect(screen.getByText('Stopping after the rows being imported now…')).toBeInTheDocument();

    first.resolve(okChunk({ created: 500 }));
    expect(
      await screen.findByText('The import was cancelled after 500 of 501 rows.'),
    ).toBeInTheDocument();
    expect(runChunk).toHaveBeenCalledTimes(1);
    expect(runChunk.mock.calls[0]?.[0]).toHaveLength(500);
  });

  it('sends 500 rows a call and numbers each chunk from its file line', async () => {
    const many = Array.from({ length: 501 }, (_, index) => [`Lead ${index}`, `l${index}@x.test`]);
    const runChunk = chunkSpy(() => Promise.resolve(okChunk({ created: 0, updated: 1 })));
    const { onImported } = renderDialog(leadSource({ runChunk }), [
      parseMock(many, ['Organisation', 'Mail']),
    ]);
    await userEvent.upload(screen.getByLabelText('Choose a CSV or Excel file'), csvFile());
    await screen.findByText('leads.csv: 501 rows ready to map.');
    await click('Next');
    await click('Next');
    await click('Start import');

    expect(await screen.findByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(runChunk.mock.calls.map((call) => [call[0].length, call[2]])).toEqual([
      [500, 2],
      [1, 502],
    ]);
    expect(onImported).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('button', { name: 'Download issues CSV' })).not.toBeInTheDocument();
  });

  it('stops the run when a chunk fails and says why', async () => {
    const runChunk = chunkSpy(() => Promise.reject(new Error('Permission denied')));
    const { onImported } = renderDialog(leadSource({ runChunk }));
    await toOptions();
    await click('Start import');

    expect(
      await screen.findByText('The import stopped after 0 of 2 rows: Permission denied'),
    ).toBeInTheDocument();
    expect(onImported).not.toHaveBeenCalled();
  });
});
