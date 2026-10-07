import { describe, expect, it } from 'vitest';
import { offsetLabel } from '@exyconn/tracker-core';
import { timezoneOptions } from '../../../../src/lib/settings/timezone-options';

describe('timezoneOptions', () => {
  it('captions zones with their offset right now when no instant is given', () => {
    const options = timezoneOptions('Europe/London', ['UTC', 'Asia/Tokyo']);
    const london = options.find((option) => option.value === 'Europe/London');
    expect(london?.caption).toBe(offsetLabel('Europe/London', new Date()));
    expect(options.findIndex((option) => option.value === 'Asia/Tokyo')).toBeGreaterThan(
      options.findIndex((option) => option.value === 'UTC'),
    );
  });
});
