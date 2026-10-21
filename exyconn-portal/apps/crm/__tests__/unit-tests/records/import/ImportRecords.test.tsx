import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ImportSource } from '@exyconn/crud';
import {
  CrmImportMode,
  CrmObject,
  CrmPropertyType,
  TableFileFormat,
} from '@exyconn/shell/graphql/generated';
import { ImportRecordsButton } from '../../../../src/records/import';
import { HEADER_SYNONYMS } from '../../../../src/records/import/synonyms';
import { renderWithProviders } from '../../test-utils';
import { objectSchema, property } from '../records-fixtures';

const mocked = vi.hoisted(() => ({
  schema: vi.fn(),
  importRecords: vi.fn(),
  template: vi.fn(),
  source: undefined as ImportSource<CrmImportMode> | undefined,
  onImported: undefined as (() => void) | undefined,
}));

vi.mock('@exyconn/crud', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/crud')>()),
  downloadCsvTemplate: (...args: unknown[]) => mocked.template(...args),
  ImportDialog: ({
    source,
    onImported,
    onClose,
  }: Readonly<{
    source: ImportSource<CrmImportMode>;
    onImported: () => void;
    onClose: () => void;
  }>) => {
    mocked.source = source;
    mocked.onImported = onImported;
    return (
      <div role="dialog" aria-label={source.title}>
        <button type="button" onClick={onClose}>
          Close wizard
        </button>
      </div>
    );
  },
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useImportCrmRecordsMutation: () => [mocked.importRecords],
}));

vi.mock('../../../../src/records/schema', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/records/schema')>()),
  useObjectSchema: () => mocked.schema(),
}));

const EMAIL = property({
  key: 'email',
  label: 'Email',
  type: CrmPropertyType.Email,
  required: true,
});
const TIER = property({ key: 'tier', label: 'Tier', builtIn: false });
const HIDDEN = property({ key: 'hasEmail', label: 'Has email', importable: false });

async function openWizard(onImported = vi.fn()) {
  renderWithProviders(<ImportRecordsButton object={CrmObject.Contact} onImported={onImported} />);
  await userEvent.click(screen.getByRole('button', { name: 'Import' }));
  const source = mocked.source;
  if (!source) {
    throw new Error('The import wizard did not open');
  }
  return source;
}

describe('ImportRecordsButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.source = undefined;
    mocked.schema.mockReturnValue({ ...objectSchema([EMAIL, TIER, HIDDEN]), dedupeKey: 'email' });
  });

  it('opens the wizard on click and closes it again', async () => {
    const onImported = vi.fn();
    await openWizard(onImported);
    expect(screen.getByRole('dialog', { name: 'Import records' })).toBeInTheDocument();
    mocked.onImported?.();
    expect(onImported).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Close wizard' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('maps the importable properties, built-in and custom', async () => {
    const source = await openWizard();
    expect(source.fields).toEqual([
      {
        key: 'email',
        label: 'Email',
        required: true,
        group: 'Built-in',
        typeLabel: 'Email',
        aliases: ['Email'],
      },
      {
        key: 'tier',
        label: 'Tier',
        required: false,
        group: 'Custom',
        typeLabel: 'Text',
        aliases: ['Tier'],
      },
    ]);
    expect(source.modes.map((mode) => mode.mode)).toEqual([
      CrmImportMode.Upsert,
      CrmImportMode.Create,
      CrmImportMode.Update,
    ]);
    expect(source.matchLabel).toBe('Email');
    expect(source.synonyms).toBe(HEADER_SYNONYMS);
    expect(source.loadError).toBeNull();
  });

  it('names the raw dedupe key when it is not a known property', async () => {
    mocked.schema.mockReturnValue({ ...objectSchema([TIER]), dedupeKey: 'domain' });
    expect((await openWizard()).matchLabel).toBe('domain');
  });

  it('says when the properties could not be loaded', async () => {
    mocked.schema.mockReturnValue({ ...objectSchema([]), error: new Error('down') });
    expect((await openWizard()).loadError).toBe('The properties could not be loaded.');
  });

  it('downloads a template headed by the importable labels', async () => {
    const source = await openWizard();
    expect(source.templateFormats).toEqual([TableFileFormat.Csv]);
    await source.downloadTemplate(TableFileFormat.Csv);
    expect(mocked.template).toHaveBeenCalledWith('contact-import-template', ['Email', 'Tier']);
  });

  it('sends each chunk through importCrmRecords and returns its result', async () => {
    const outcome = { created: 1, updated: 0, skipped: 0, errors: [] };
    mocked.importRecords.mockResolvedValue({ data: { importCrmRecords: outcome } });
    const source = await openWizard();
    const rows = [{ email: 'a@b.io' }];

    await expect(source.runChunk(rows, CrmImportMode.Create, 2)).resolves.toBe(outcome);
    expect(mocked.importRecords).toHaveBeenCalledWith({
      variables: {
        input: { object: CrmObject.Contact, mode: CrmImportMode.Create, rows, firstRowNumber: 2 },
      },
    });
  });

  it('fails a chunk the server answered without data', async () => {
    mocked.importRecords.mockResolvedValue({ data: undefined });
    const source = await openWizard();
    await expect(source.runChunk([], CrmImportMode.Upsert, 1)).rejects.toThrow(
      'The CRM import returned no data',
    );
  });
});
