import { beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadCsv, toCsv } from '@exyconn/shell/utils/csv';
import { downloadCsvTemplate } from '../../../src/import/csvTemplate';
import { downloadIssuesCsv } from '../../../src/import/issuesCsv';
import { addChunk, IDLE } from '../../../src/import/useImportRun';
import { activeStep, MAP, RESULTS, RUNNING, UPLOAD } from '../../../src/import/wizardSteps';

vi.mock('@exyconn/shell/utils/csv', async (importActual) => ({
  ...(await importActual<typeof import('@exyconn/shell/utils/csv')>()),
  downloadCsv: vi.fn(),
  toCsv: vi.fn((await importActual<typeof import('@exyconn/shell/utils/csv')>()).toCsv),
}));

beforeEach(() => {
  vi.mocked(downloadCsv).mockClear();
});

describe('activeStep', () => {
  it('shows the chosen step while idle', () => {
    expect(activeStep(MAP, 'idle')).toBe(MAP);
    expect(activeStep(UPLOAD, 'idle')).toBe(UPLOAD);
  });

  it('shows the run step while running and the results once done', () => {
    expect(activeStep(MAP, 'running')).toBe(RUNNING);
    expect(activeStep(MAP, 'done')).toBe(RESULTS);
  });
});

describe('addChunk', () => {
  it('adds a chunk to the running totals and appends its issues', () => {
    const first = addChunk({ ...IDLE, total: 3 }, 2, {
      created: 1,
      updated: 0,
      skipped: 1,
      issues: [{ row: 3, message: 'No match', skipped: true }],
    });
    const second = addChunk(first, 1, {
      created: 0,
      updated: 1,
      skipped: 0,
      issues: [{ row: 4, message: 'Bad email', skipped: false }],
    });
    expect(second).toMatchObject({ total: 3, done: 3, created: 1, updated: 1, skipped: 1 });
    expect(second.issues.map((issue) => issue.row)).toEqual([3, 4]);
  });
});

describe('downloadCsvTemplate', () => {
  it('downloads an empty CSV headed by the labels', () => {
    downloadCsvTemplate('leads-sample', ['Name', 'Email, work']);
    expect(downloadCsv).toHaveBeenCalledWith('leads-sample', 'Name,"Email, work"');
  });

  it('gives every template column a blank cell, so rows added to it start empty', () => {
    downloadCsvTemplate('leads-sample', ['Name']);
    const columns = vi.mocked(toCsv).mock.calls.at(-1)?.[1] ?? [];
    expect(columns.map((column) => column.value(undefined as never))).toEqual(['']);
  });
});

describe('downloadIssuesCsv', () => {
  const file = {
    name: 'Leads.XLSX',
    headers: ['Name', 'Email'],
    rows: [['Acme', 'bad'], ['Beta']],
  };

  it('writes each failed row as it was in the file, with its line and reason', () => {
    downloadIssuesCsv(
      file,
      [
        { row: 2, message: 'Invalid email', skipped: false },
        { row: 3, message: 'Email is required', skipped: false },
        { row: 9, message: 'Gone', skipped: true },
      ],
      { line: 'Line', issue: 'Issue' },
    );
    expect(downloadCsv).toHaveBeenCalledWith(
      'Leads-issues',
      [
        'Name,Email,Line,Issue',
        'Acme,bad,2,Invalid email',
        'Beta,,3,Email is required',
        ',,9,Gone',
      ].join('\r\n'),
    );
  });

  it('keeps a file name without a known extension whole', () => {
    downloadIssuesCsv({ ...file, name: 'export.txt' }, [], { line: 'L', issue: 'I' });
    expect(downloadCsv).toHaveBeenCalledWith('export.txt-issues', 'Name,Email,L,I');
  });
});
