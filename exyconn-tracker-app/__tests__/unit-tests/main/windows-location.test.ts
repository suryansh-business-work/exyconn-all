import { beforeEach, describe, expect, it, vi } from 'vitest';

type Callback = (error: Error | null, stdout: string) => void;

const { execFile } = vi.hoisted(() => ({ execFile: vi.fn() }));

vi.mock('node:child_process', () => ({ execFile }));

import { parseWindowsFix, readWindowsLocation } from '../../../src/main/windows-location';

const NOW = new Date('2026-10-24T04:00:00.000Z');

/** Makes powershell.exe answer with `stdout`, or fail with `error`. */
function powershellAnswers(stdout: string, error: Error | null = null): void {
  execFile.mockImplementation((_file: string, _args: string[], _options: object, done: Callback) =>
    done(error, stdout),
  );
}

beforeEach(() => {
  execFile.mockReset();
});

describe('parseWindowsFix', () => {
  it('reads a fix Windows gave, with its accuracy', () => {
    expect(parseWindowsFix('{"lat":12.97,"lng":77.59,"accuracy":35}\r\n', NOW)).toEqual({
      lat: 12.97,
      lng: 77.59,
      accuracyM: 35,
      source: 'SYSTEM',
      capturedAt: NOW.toISOString(),
    });
  });

  it.each([
    ['{"code":1,"message":"Windows denied this app location access"}', 'code 1'],
    ['{"code":2,"message":"Windows location services are off"}', 'code 2'],
    ['{"code":3,"message":"Windows found no location in time"}', 'code 3'],
    ['{"lat":1,"lng":2}', 'code 2'],
    ['not json', 'code 2'],
  ])('words a failure the way Chromium numbers it: %s', (stdout, code) => {
    expect(() => parseWindowsFix(stdout, NOW)).toThrow(code);
  });
});

describe('readWindowsLocation', () => {
  it('asks powershell.exe, hidden, with the script encoded', async () => {
    powershellAnswers('{"lat":12.97,"lng":77.59,"accuracy":35}');

    await expect(readWindowsLocation()).resolves.toMatchObject({ lat: 12.97, accuracyM: 35 });
    const [file, args, options] = execFile.mock.calls[0];
    expect(file).toBe('powershell.exe');
    expect(args).toEqual(expect.arrayContaining(['-NoProfile', '-EncodedCommand']));
    expect(options).toMatchObject({ windowsHide: true });
  });

  it('rejects with the reason Windows gave, or a timeout when PowerShell itself failed', async () => {
    powershellAnswers('{"code":1,"message":"Windows denied this app location access"}');
    await expect(readWindowsLocation()).rejects.toThrow(
      'Geolocation failed (code 1): Windows denied this app location access',
    );

    powershellAnswers('', new Error('spawn powershell.exe ENOENT'));
    await expect(readWindowsLocation()).rejects.toThrow('Geolocation failed (code 3)');
  });
});
