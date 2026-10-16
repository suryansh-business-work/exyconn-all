import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportStep } from '../../../src/import/ImportStep';
import { MapStep } from '../../../src/import/steps/MapStep';
import { OptionsStep } from '../../../src/import/steps/OptionsStep';
import { ProgressStep } from '../../../src/import/steps/ProgressStep';
import { ResultStep } from '../../../src/import/steps/ResultStep';
import { IDLE } from '../../../src/import/useImportRun';
import { MAP } from '../../../src/import/wizardSteps';
import { renderWithProviders } from '../test-utils';
import { leadFields } from './importFixtures';

const ungrouped = { key: 'note', label: 'Note', required: false };

describe('MapStep', () => {
  const file = { name: 'leads.csv', headers: ['Company', ''], rows: [['Acme', ' '], ['Beta']] };

  it('shows each column with its samples, and names a blank heading or empty column', () => {
    renderWithProviders(
      <MapStep file={file} mapping={['name', null]} fields={leadFields} onAssign={vi.fn()} />,
    );
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('CompanyAcme, Beta');
    expect(rows[2]).toHaveTextContent('(no heading)No values');
    expect(screen.getByLabelText('Import (no heading) as')).toBeInTheDocument();
  });

  it('groups the fields, marks required ones and their type, and un-maps on "Don\'t import"', async () => {
    const onAssign = vi.fn();
    renderWithProviders(
      <MapStep
        file={file}
        mapping={['name']}
        fields={[...leadFields, ungrouped]}
        onAssign={onAssign}
      />,
    );
    await userEvent.click(screen.getByLabelText('Import Company as'));
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByText('Built-in')).toBeInTheDocument();
    expect(within(listbox).getByText('Custom')).toBeInTheDocument();
    expect(within(listbox).getByRole('option', { name: 'Company * (Text)' })).toBeInTheDocument();
    expect(within(listbox).getByRole('option', { name: 'Tier' })).toBeInTheDocument();
    expect(within(listbox).getByRole('option', { name: 'Note' })).toBeInTheDocument();

    await userEvent.click(within(listbox).getByRole('option', { name: "Don't import" }));
    expect(onAssign).toHaveBeenCalledWith(0, null);
  });

  it('maps a column to the field chosen', async () => {
    const onAssign = vi.fn();
    renderWithProviders(
      <MapStep file={file} mapping={[]} fields={leadFields} onAssign={onAssign} />,
    );
    expect(
      screen.getByText('Map a column to each required field: Company, Email.'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('Import (no heading) as'));
    await userEvent.click(screen.getByRole('option', { name: 'Tier' }));
    expect(onAssign).toHaveBeenCalledWith(1, 'tier');
  });
});

describe('OptionsStep', () => {
  it('offers the one mode with no matching note when rows are only created', async () => {
    const onModeChange = vi.fn();
    renderWithProviders(
      <OptionsStep
        mode="CREATE"
        modes={[{ mode: 'CREATE', label: 'Create new records' }]}
        matchLabel={null}
        onModeChange={onModeChange}
      />,
    );
    expect(screen.getByRole('radio', { name: 'Create new records' })).toBeChecked();
    expect(screen.queryByText(/Rows are matched/)).not.toBeInTheDocument();
  });
});

describe('OptionsStep choices', () => {
  const modes = [
    { mode: 'UPSERT', label: 'Create new and update existing' },
    { mode: 'CREATE', label: 'Create new only' },
  ] as const;

  it('passes on the mode chosen, and ignores a value that is not one of its modes', async () => {
    const onModeChange = vi.fn();
    renderWithProviders(
      <OptionsStep mode="UPSERT" modes={modes} matchLabel="Email" onModeChange={onModeChange} />,
    );
    await userEvent.click(screen.getByRole('radio', { name: 'Create new only' }));
    expect(onModeChange).toHaveBeenCalledWith('CREATE');

    // A stale or tampered radio value never reaches the wizard as a mode.
    const stale = screen.getByRole('radio', { name: 'Create new only' });
    stale.setAttribute('value', 'DELETE');
    await userEvent.click(stale);
    expect(onModeChange).toHaveBeenCalledTimes(1);
  });
});

describe('ProgressStep', () => {
  it('shows no progress for an empty run', () => {
    renderWithProviders(<ProgressStep done={0} total={0} cancelling={false} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByRole('status')).toHaveTextContent('Imported 0 of 0 rows');
  });

  it('rounds the share of rows done', () => {
    renderWithProviders(<ProgressStep done={1} total={3} cancelling={false} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '33');
  });
});

describe('ResultStep', () => {
  it('lists the first 20 issues and points to the CSV for the rest', async () => {
    const issues = Array.from({ length: 23 }, (_, index) => ({
      row: index + 2,
      message: `Problem ${index + 2}`,
      skipped: index === 0,
    }));
    const onDownloadIssues = vi.fn();
    renderWithProviders(
      <ResultStep
        state={{ ...IDLE, status: 'done', done: 23, total: 23, issues }}
        onDownloadIssues={onDownloadIssues}
      />,
    );
    const list = screen.getByRole('list', { name: 'Import issues' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(20);
    expect(screen.getByText('3 more in the issues CSV.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Failed22');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Download issues CSV' }));
    expect(onDownloadIssues).toHaveBeenCalledTimes(1);
  });
});

describe('ImportStep', () => {
  it('stays on the upload step when the map step has no file to map', () => {
    renderWithProviders(
      <ImportStep
        step={MAP}
        file={null}
        mapping={[]}
        mode="CREATE"
        modes={[{ mode: 'CREATE', label: 'Create new records' }]}
        fields={leadFields}
        matchLabel={null}
        run={IDLE}
        cancelling={false}
        templateFormats={[]}
        onFile={vi.fn()}
        onDownloadTemplate={vi.fn()}
        onAssign={vi.fn()}
        onModeChange={vi.fn()}
        onDownloadIssues={vi.fn()}
      />,
    );
    expect(screen.getByText('Drop a CSV or Excel file here')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
