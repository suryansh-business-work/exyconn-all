import { beforeEach, describe, expect, it, vi } from 'vitest';
import { join } from 'node:path';
import type { BrowserWindow } from 'electron';

const { showSaveDialog, writeFile } = vi.hoisted(() => ({
  showSaveDialog: vi.fn(),
  writeFile: vi.fn(() => Promise.resolve()),
}));

vi.mock('electron', () => ({
  BrowserWindow: class {},
  dialog: { showSaveDialog },
  app: { getPath: (name: string) => `/home/asha/${name}` },
}));
vi.mock('node:fs/promises', () => ({ writeFile }));

import { saveReportFile } from '../../../src/main/report-file';

const REPORT = { fileName: 'tracker-2026-09.csv', content: 'date,worked\n2026-09-14,7.5\n' };
const OPTIONS = {
  defaultPath: join('/home/asha/downloads', REPORT.fileName),
  filters: [{ name: 'CSV spreadsheet', extensions: ['csv'] }],
};
const parent = { id: 1 } as unknown as BrowserWindow;

beforeEach(() => {
  showSaveDialog.mockReset();
  writeFile.mockClear();
});

describe('saveReportFile', () => {
  it('asks where to save, attached to the tracker window, and writes the CSV there', async () => {
    showSaveDialog.mockResolvedValue({ canceled: false, filePath: '/home/asha/report.csv' });

    await expect(saveReportFile(parent, REPORT)).resolves.toEqual({
      path: '/home/asha/report.csv',
    });

    expect(showSaveDialog).toHaveBeenCalledWith(parent, OPTIONS);
    expect(writeFile).toHaveBeenCalledWith('/home/asha/report.csv', REPORT.content, 'utf8');
  });

  it('opens a free-standing dialog when there is no window to attach it to', async () => {
    showSaveDialog.mockResolvedValue({ canceled: false, filePath: '/tmp/r.csv' });

    await saveReportFile(null, REPORT);

    expect(showSaveDialog).toHaveBeenCalledWith(OPTIONS);
  });

  it('answers a cancelled dialog with no path and writes nothing', async () => {
    showSaveDialog.mockResolvedValue({ canceled: true, filePath: '/home/asha/report.csv' });

    await expect(saveReportFile(parent, REPORT)).resolves.toEqual({ path: null });
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('treats a dialog that returned no file as cancelled', async () => {
    showSaveDialog.mockResolvedValue({ canceled: false, filePath: '' });

    await expect(saveReportFile(parent, REPORT)).resolves.toEqual({ path: null });
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('lets a failed write reach the caller, so the screen can say so', async () => {
    showSaveDialog.mockResolvedValue({ canceled: false, filePath: '/readonly/r.csv' });
    writeFile.mockRejectedValueOnce(new Error('EACCES'));

    await expect(saveReportFile(parent, REPORT)).rejects.toThrow('EACCES');
  });
});
