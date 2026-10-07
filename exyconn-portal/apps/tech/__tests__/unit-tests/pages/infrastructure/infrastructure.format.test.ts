import { describe, expect, it } from 'vitest';
import {
  formatDuration,
  formatPort,
} from '../../../../src/pages/infrastructure/infrastructure.format';

describe('formatDuration', () => {
  it('shows a dash for no uptime at all, or a negative one', () => {
    expect(formatDuration(0)).toBe('—');
    expect(formatDuration(-30)).toBe('—');
  });

  it('writes days, hours and minutes', () => {
    expect(formatDuration(275_400)).toBe('3d 4h 30m');
  });

  it('leaves out the days and hours a short uptime does not have', () => {
    expect(formatDuration(59)).toBe('0m');
    expect(formatDuration(3600 + 120)).toBe('1h 2m');
    expect(formatDuration(86_400 + 60)).toBe('1d 1m');
  });
});

describe('formatPort', () => {
  it('shows only the inside of a port that is not published', () => {
    expect(formatPort({ ip: '', publicPort: 0, privatePort: 27017, protocol: 'tcp' })).toBe(
      '27017/tcp',
    );
  });

  it('names the host address a published port is bound to', () => {
    expect(
      formatPort({ ip: '127.0.0.1', publicPort: 4004, privatePort: 4004, protocol: 'tcp' }),
    ).toBe('127.0.0.1:4004 → 4004/tcp');
  });

  it('shows the bare host port when the engine reports no address', () => {
    expect(formatPort({ ip: '', publicPort: 8080, privatePort: 80, protocol: 'udp' })).toBe(
      '8080 → 80/udp',
    );
  });
});
