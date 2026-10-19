import { afterEach, describe, expect, it, vi } from 'vitest';
import { errorText, log } from '../../../src/runtime/log';

const linesOf = (spy: { mock: { calls: unknown[][] } }) =>
  spy.mock.calls.map(([line]) => JSON.parse(String(line)) as Record<string, unknown>);

describe('the voice server log', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes info to stdout as one JSON line with its fields', () => {
    const out = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    log.info('call ended', { callId: 'c1', status: 'ENDED' });
    expect(String(out.mock.calls[0][0]).endsWith('}\n')).toBe(true);
    expect(linesOf(out)[0]).toMatchObject({ level: 'info', message: 'call ended', callId: 'c1' });
  });

  it('writes warnings and errors to stderr, fields optional', () => {
    const err = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    log.warn('slow');
    log.error('broken', { callId: 'c2' });
    expect(linesOf(err)).toMatchObject([
      { level: 'warn', message: 'slow' },
      { level: 'error', message: 'broken', callId: 'c2' },
    ]);
    expect(Number.isNaN(Date.parse(String(linesOf(err)[0].time)))).toBe(false);
  });

  it('describes whatever was thrown', () => {
    expect(errorText(new Error('refused'))).toBe('refused');
    expect(errorText({ code: 403 })).toBe('{"code":403}');
    expect(errorText('plain')).toBe('"plain"');
  });
});
