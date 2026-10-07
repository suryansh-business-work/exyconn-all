import { File, Paths } from 'expo-file-system';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import { describe, expect, it, vi } from 'vitest';
import { shareReport } from '../../../../src/components/report/share-report';
import { fileSystemTest } from '../../mocks/expo-file-system';

const REPORT = {
  fileName: 'tracker-report-2026-02.csv',
  content: 'Day,Worked,Idle\n2026-02-03,6h 0m,2h 0m\n',
};
const CACHED = 'file:///cache/tracker-report-2026-02.csv';

describe('shareReport', () => {
  it('writes the CSV into the cache and hands that file to the share sheet', async () => {
    await expect(shareReport(REPORT, 'Report for February 2026')).resolves.toBe('shared');

    expect(fileSystemTest.files.get(CACHED)).toBe(REPORT.content);
    expect(shareAsync).toHaveBeenCalledWith(CACHED, {
      mimeType: 'text/csv',
      UTI: 'public.comma-separated-values-text',
      dialogTitle: 'Report for February 2026',
    });
  });

  it('replaces a copy left behind by an earlier share instead of failing on it', async () => {
    new File(Paths.cache, REPORT.fileName).write('stale,month\n');

    await expect(shareReport(REPORT, 'Report')).resolves.toBe('shared');

    expect(fileSystemTest.files.get(CACHED)).toBe(REPORT.content);
  });

  it('writes nothing and says so when the phone has no share sheet', async () => {
    vi.mocked(isAvailableAsync).mockResolvedValueOnce(false);

    await expect(shareReport(REPORT, 'Report')).resolves.toBe('unavailable');

    expect(fileSystemTest.files.size).toBe(0);
    expect(shareAsync).not.toHaveBeenCalled();
  });

  it('lets a failed hand-off reach the caller, which tells the employee', async () => {
    vi.mocked(shareAsync).mockRejectedValueOnce(new Error('Share sheet crashed'));

    await expect(shareReport(REPORT, 'Report')).rejects.toThrow('Share sheet crashed');
  });
});
