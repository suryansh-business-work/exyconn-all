import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readBackupStatus } from '../../../../src/modules/health/backup.status';
import { logger } from '../../../../src/utils/logger';

/** What deploy/backup-mongo.sh writes after a run. */
const status = (over: Record<string, unknown> = {}) => ({
  ok: true,
  startedAt: '2026-10-06T01:00:00.000Z',
  finishedAt: '2026-10-06T01:02:30.000Z',
  archive: 'exyconn-2026-10-06.gz',
  bytes: 5 * 1024 * 1024 + 256 * 1024,
  seconds: 150,
  retainDays: 14,
  message: 'Backup finished',
  ...over,
});

let dir: string;

const fileWith = (content: string) => {
  const file = path.join(dir, 'status.json');
  writeFileSync(file, content, 'utf8');
  return file;
};

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'backup-status-'));
  jest.spyOn(logger, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
  jest.restoreAllMocks();
});

describe('readBackupStatus', () => {
  it('reports "not configured" when no path is set', () => {
    expect(readBackupStatus('')).toEqual({
      configured: false,
      ok: false,
      lastRunAt: null,
      archive: '',
      sizeMb: 0,
      retainDays: 0,
      message: expect.stringContaining('install-backups.sh'),
    });
  });

  it('reports "not configured" when the path has no file behind it', () => {
    expect(readBackupStatus(path.join(dir, 'missing.json'))).toMatchObject({
      configured: false,
      lastRunAt: null,
    });
  });

  it('reads a successful run, with the archive size in megabytes to one decimal', () => {
    expect(readBackupStatus(fileWith(JSON.stringify(status())))).toEqual({
      configured: true,
      ok: true,
      lastRunAt: new Date('2026-10-06T01:02:30.000Z'),
      archive: 'exyconn-2026-10-06.gz',
      sizeMb: 5.3,
      retainDays: 14,
      message: 'Backup finished',
    });
  });

  it('carries a failed run through as not ok, with its message', () => {
    const file = fileWith(JSON.stringify(status({ ok: false, message: 'mongodump exited 1' })));

    expect(readBackupStatus(file)).toMatchObject({
      configured: true,
      ok: false,
      message: 'mongodump exited 1',
    });
  });

  it('says the file is unreadable, and logs it, when a field is missing or mistyped', () => {
    const file = fileWith(JSON.stringify(status({ bytes: 'lots' })));

    expect(readBackupStatus(file)).toMatchObject({
      configured: true,
      ok: false,
      lastRunAt: null,
      message: 'The status file is unreadable.',
    });
    expect(logger.error).toHaveBeenCalledWith({ path: file }, expect.any(String));
  });

  it('says the file is unreadable rather than throwing when it is not JSON at all', () => {
    const file = fileWith('{"ok": true, "startedAt": ');

    expect(readBackupStatus(file)).toMatchObject({
      configured: true,
      ok: false,
      message: 'The status file is unreadable.',
    });
  });
});
