import { describe, it, expect } from 'vitest';
import { countBy } from '../../src/pages/overview/tracker-overview';

interface Device {
  platform: string;
}

const devices: Device[] = [
  { platform: 'darwin' },
  { platform: 'win32' },
  { platform: 'darwin' },
  { platform: 'linux' },
];

describe('countBy', () => {
  it('tallies one bucket per distinct value', () => {
    expect(countBy(devices, (d) => d.platform)).toEqual([
      { value: 'darwin', count: 2 },
      { value: 'win32', count: 1 },
      { value: 'linux', count: 1 },
    ]);
  });

  it('keeps first-seen order, so the breakdown is stable between renders', () => {
    const reversed = countBy([...devices].reverse(), (d) => d.platform);
    expect(reversed.map((bucket) => bucket.value)).toEqual(['linux', 'darwin', 'win32']);
  });

  it('returns nothing for an empty list rather than a zero bucket', () => {
    expect(countBy([] as Device[], (d) => d.platform)).toEqual([]);
  });
});
