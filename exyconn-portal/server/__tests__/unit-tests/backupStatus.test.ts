import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readBackupStatus } from '../../src/modules/health/backup.status';

/**
 * The backup card has one job: never claim a backup that did not happen. Every case here
 * is a way the file can be absent or wrong, and each has to read as "no backup".
 */
describe('the nightly backup status', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'exyconn-backup-'));

  const fileWith = (name: string, contents: string) => {
    const file = path.join(directory, name);
    writeFileSync(file, contents);
    return file;
  };

  it('says so when nothing is mounted', () => {
    expect(readBackupStatus('')).toMatchObject({ configured: false, ok: false, lastRunAt: null });
  });

  it('says so when the file is not there', () => {
    expect(readBackupStatus(path.join(directory, 'missing.json'))).toMatchObject({
      configured: false,
      ok: false,
    });
  });

  it('reports a successful run in megabytes', () => {
    const file = fileWith(
      'ok.json',
      JSON.stringify({
        ok: true,
        startedAt: '2026-09-20T02:30:00Z',
        finishedAt: '2026-09-20T02:31:04Z',
        archive: 'exyconn-20260920-023000.archive.gz',
        bytes: 5_452_595,
        seconds: 64,
        retainDays: 14,
        message: 'ok',
      }),
    );

    expect(readBackupStatus(file)).toEqual({
      configured: true,
      ok: true,
      lastRunAt: new Date('2026-09-20T02:31:04Z'),
      archive: 'exyconn-20260920-023000.archive.gz',
      sizeMb: 5.2,
      retainDays: 14,
      message: 'ok',
    });
  });

  it('carries a failed run through rather than hiding it', () => {
    const file = fileWith(
      'failed.json',
      JSON.stringify({
        ok: false,
        startedAt: '2026-09-20T02:30:00Z',
        finishedAt: '2026-09-20T02:30:02Z',
        archive: 'exyconn-20260920-023000.archive.gz',
        bytes: 0,
        seconds: 2,
        retainDays: 14,
        message: 'mongodump failed',
      }),
    );

    expect(readBackupStatus(file)).toMatchObject({
      configured: true,
      ok: false,
      message: 'mongodump failed',
    });
  });

  it('refuses to guess when the file is not what it should be', () => {
    const file = fileWith('junk.json', '{"ok":"yes"}');

    expect(readBackupStatus(file)).toMatchObject({ configured: true, ok: false });
  });
});
