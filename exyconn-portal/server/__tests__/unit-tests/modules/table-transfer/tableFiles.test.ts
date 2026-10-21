import ExcelJS from 'exceljs';
import {
  MAX_IMPORT_FILE_BYTES,
  MAX_IMPORT_ROWS,
  exportCell,
  fileNameFor,
  parseTableFile,
  writeTableFile,
} from '../../../../src/modules/table-transfer/tableFiles';

const csv = (text: string) => Buffer.from(text, 'utf8');

async function xlsx(build: (workbook: ExcelJS.Workbook) => void): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  build(workbook);
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

async function readWorkbook(base64: string): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(base64, 'base64') as unknown as ExcelJS.Buffer);
  return workbook;
}

describe('exportCell', () => {
  it('keeps numbers and booleans typed, joins lists and writes the rest as text', () => {
    expect(exportCell(42)).toBe(42);
    expect(exportCell(false)).toBe(false);
    expect(exportCell(['vip', 3, null])).toBe('vip; 3; ');
    expect(exportCell('Asha')).toBe('Asha');
    expect(exportCell(null)).toBe('');
  });
});

describe('fileNameFor', () => {
  const today = new Date(Date.UTC(2026, 9, 16));

  it('slugs the name and stamps the day', () => {
    expect(fileNameFor('  Client list ', 'XLSX', today)).toBe('client-list-2026-10-16.xlsx');
    expect(fileNameFor('--Q4 / leads--', 'CSV', today)).toBe('q4-leads-2026-10-16.csv');
  });

  it('trims long runs of dashes at both ends without touching the inner ones', () => {
    const dashes = '-'.repeat(20_000);
    expect(fileNameFor(`${dashes}a--b${dashes}`, 'CSV', today)).toBe('a--b-2026-10-16.csv');
    expect(fileNameFor(dashes, 'CSV', today)).toBe('export-2026-10-16.csv');
  });

  it('falls back to "export" when nothing of the name survives', () => {
    expect(fileNameFor(' ** ', 'CSV', today)).toBe('export-2026-10-16.csv');
  });
});

describe('writeTableFile', () => {
  const people = {
    name: 'People',
    headers: ['Name', 'Seats'],
    rows: [
      ['Asha', 2],
      ['Bina', 3],
    ],
  };

  it('writes the first sheet as a UTF-8 CSV that Excel opens', async () => {
    const file = await writeTableFile('CSV', 'People', [people]);
    expect(file.mimeType).toBe('text/csv;charset=utf-8');
    expect(file.fileName).toMatch(/^people-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(file.rowCount).toBe(2);
    expect(Buffer.from(file.contentBase64, 'base64').toString('utf8')).toBe(
      '﻿Name,Seats\r\nAsha,2\r\nBina,3',
    );
  });

  it('writes every sheet into a workbook, a long sheet name cut to what Excel allows', async () => {
    const notes = {
      name: 'A sheet name well over thirty-one characters',
      headers: ['Note'],
      rows: [],
    };
    const file = await writeTableFile('XLSX', 'People', [people, notes]);
    expect(file.mimeType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(file.rowCount).toBe(2);

    const workbook = await readWorkbook(file.contentBase64);
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      'People',
      'A sheet name well over thirty-o',
    ]);
    const [sheet] = workbook.worksheets;
    expect(sheet.getCell('A1').font?.bold).toBe(true);
    expect(sheet.getRow(3).values).toEqual([undefined, 'Bina', 3]);
    expect(sheet.getColumn(1).width).toBe(10);
  });
});

describe('parseTableFile', () => {
  it('reads a CSV (or .tsv / .txt) with its header trimmed and blank rows kept in place', async () => {
    const parsed = await parseTableFile('People.CSV', csv(' Name , Seats\nAsha,2\n,\nBina,3\n'));
    expect(parsed).toEqual({
      headers: ['Name', 'Seats'],
      rows: [
        ['Asha', '2'],
        ['', ''],
        ['Bina', '3'],
      ],
    });
    await expect(parseTableFile('people.txt', csv('Name\nAsha\n'))).resolves.toMatchObject({
      headers: ['Name'],
    });
  });

  it('reads the first sheet of a workbook, a date cell as its ISO instant', async () => {
    const signed = new Date(Date.UTC(2026, 0, 2, 3, 4, 5));
    const content = await xlsx((workbook) => {
      const sheet = workbook.addWorksheet('People');
      sheet.addRow(['Name', 'Signed', 'Seats']);
      sheet.addRow(['Asha', signed, 2]);
      workbook.addWorksheet('Ignored').addRow(['x']);
    });
    await expect(parseTableFile('people.xlsx', content)).resolves.toEqual({
      headers: ['Name', 'Signed', 'Seats'],
      rows: [['Asha', '2026-01-02T03:04:05.000Z', '2']],
    });
  });

  it('refuses a workbook with no sheet as having no header', async () => {
    const content = await xlsx(() => undefined);
    await expect(parseTableFile('empty.xlsx', content)).rejects.toThrow(
      'The file has no header row. The first line must name the columns.',
    );
  });

  it('refuses a file that is not a readable workbook', async () => {
    await expect(parseTableFile('broken.xlsx', csv('not a zip'))).rejects.toThrow(
      'The file is not a readable Excel workbook.',
    );
  });

  it('refuses any other kind of file, including a name with no extension', async () => {
    await expect(parseTableFile('people.pdf', csv('Name\nAsha'))).rejects.toThrow(
      'Choose a .csv or .xlsx file.',
    );
    await expect(parseTableFile('people', csv('Name\nAsha'))).rejects.toThrow(
      'Choose a .csv or .xlsx file.',
    );
  });

  it('refuses a file over the size limit before reading it', async () => {
    const content = Buffer.alloc(MAX_IMPORT_FILE_BYTES + 1, 'a');
    await expect(parseTableFile('big.csv', content)).rejects.toThrow(
      'The file is larger than 10 MB. Split it into smaller files.',
    );
  });

  it('refuses a blank header, and a header with nothing under it', async () => {
    await expect(parseTableFile('a.csv', csv(' , \nAsha,2'))).rejects.toThrow(
      'The file has no header row.',
    );
    await expect(parseTableFile('a.csv', csv('Name,Seats\n,\n , \n'))).rejects.toThrow(
      'The file has no rows to import.',
    );
  });

  it('takes the most rows allowed, and refuses one more', async () => {
    const lines = (count: number) =>
      ['Name', ...Array.from({ length: count }, () => 'x')].join('\n');
    await expect(parseTableFile('a.csv', csv(lines(MAX_IMPORT_ROWS)))).resolves.toMatchObject({
      headers: ['Name'],
    });
    await expect(parseTableFile('a.csv', csv(lines(MAX_IMPORT_ROWS + 1)))).rejects.toThrow(
      `The file has ${MAX_IMPORT_ROWS + 1} rows; up to ${MAX_IMPORT_ROWS} can be imported at once.`,
    );
  });
});
