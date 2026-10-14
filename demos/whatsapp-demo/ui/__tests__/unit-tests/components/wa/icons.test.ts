import { describe, expect, it } from 'vitest';
import { ICON_KEYS } from '@exyconn/wa-flow';
import { WA_ICONS } from '../../../../src/components/wa/icons';

describe('WA_ICONS', () => {
  it('has an icon for every icon name a workflow may use, and no others', () => {
    expect(Object.keys(WA_ICONS)).toHaveLength(ICON_KEYS.length);
    expect(new Set(Object.keys(WA_ICONS))).toEqual(new Set(ICON_KEYS));
  });

  it.each(ICON_KEYS)('maps "%s" to an MUI icon component', (key) => {
    expect(WA_ICONS[key]).toBeTruthy();
    expect(['function', 'object']).toContain(typeof WA_ICONS[key]);
  });
});
