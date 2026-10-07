import {
  MS_PER_DAY,
  MS_PER_HOUR,
  NOT_SET,
  countBy,
  dayKeys,
  dayOf,
  fillTrend,
  houseTimezone,
  oneDecimal,
  toMetrics,
} from '../../../../src/modules/analytics/analytics.metrics';
import { AppSettingsModel } from '../../../../src/modules/admin/settings.model';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { zonedDateKey } from '../../../../src/modules/tracker/tracker.timezone';
import { ROLES, type Role } from '../../../../src/constants/roles';

const person = (name: string, roles: Role[]) =>
  UserModel.create({ name, email: `${name}@exyconn.com`, passwordHash: 'x', roles });

describe('toMetrics', () => {
  it('labels a missing, null or empty group as not set', () => {
    const metrics = toMetrics([
      { _id: undefined, value: 1 },
      { _id: '', value: 1 },
      { _id: null, value: 1 },
    ]);

    expect(metrics.map((metric) => metric.label)).toEqual([NOT_SET, NOT_SET, NOT_SET]);
  });

  it('puts the largest first and breaks ties alphabetically', () => {
    expect(
      toMetrics([
        { _id: 'web', value: 2 },
        { _id: 'android', value: 2 },
        { _id: 42, value: 5 },
      ]),
    ).toEqual([
      { label: '42', value: 5 },
      { label: 'android', value: 2 },
      { label: 'web', value: 2 },
    ]);
  });

  it('is empty for no rows', () => {
    expect(toMetrics([])).toEqual([]);
  });
});

describe('countBy', () => {
  it('groups on the field among the matched rows', async () => {
    const model = { aggregate: jest.fn().mockResolvedValue([{ _id: 'ACTIVE', value: 3 }]) };

    await expect(countBy(model, { roles: 'EMPLOYEE' }, 'employmentStatus')).resolves.toEqual([
      { label: 'ACTIVE', value: 3 },
    ]);
    expect(model.aggregate).toHaveBeenCalledWith([
      { $match: { roles: 'EMPLOYEE' } },
      { $group: { _id: '$employmentStatus', value: { $sum: 1 } } },
    ]);
  });

  it('counts an array field once per element when unwound', async () => {
    await person('a', [ROLES.ADMIN, ROLES.EMPLOYEE]);
    await person('b', [ROLES.EMPLOYEE]);

    await expect(countBy(UserModel, {}, 'roles', true)).resolves.toEqual([
      { label: 'EMPLOYEE', value: 2 },
      { label: 'ADMIN', value: 1 },
    ]);
  });
});

describe('houseTimezone', () => {
  it('falls back to UTC before the workspace has settings', async () => {
    await expect(houseTimezone()).resolves.toBe('UTC');
  });

  it('reads the zone set in Admin settings', async () => {
    await AppSettingsModel.create({ key: 'global', timezone: 'Asia/Tokyo' });

    await expect(houseTimezone()).resolves.toBe('Asia/Tokyo');
  });
});

describe('day keys and trends', () => {
  it('reads the days on the given zone’s clock', () => {
    const lateUtc = Date.UTC(2026, 0, 31, 20);

    expect(dayKeys(2, 'UTC', lateUtc)).toEqual(['2026-01-30', '2026-01-31']);
    expect(dayKeys(2, 'Asia/Kolkata', lateUtc)).toEqual(['2026-01-31', '2026-02-01']);
  });

  it('ends today when no clock is given', () => {
    const keys = dayKeys(3, 'UTC');

    expect(keys).toHaveLength(3);
    expect(keys[2]).toBe(zonedDateKey(new Date(), 'UTC'));
  });

  it('fills missing periods with zero and ignores rows outside the keys', () => {
    expect(
      fillTrend(
        ['2026-01', '2026-02'],
        [
          { _id: '2026-02', value: 3 },
          { _id: '2025-12', value: 9 },
        ],
      ),
    ).toEqual([
      { period: '2026-01', value: 0 },
      { period: '2026-02', value: 3 },
    ]);
  });

  it('groups a date field by day in a zone', () => {
    expect(dayOf('createdAt', 'Europe/Paris')).toEqual({
      $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Europe/Paris' },
    });
  });
});

describe('units', () => {
  it('rounds to one decimal place', () => {
    expect(oneDecimal(1.25)).toBe(1.3);
    expect(oneDecimal(1.24)).toBe(1.2);
    expect(oneDecimal(0)).toBe(0);
  });

  it('has an hour and a day in milliseconds', () => {
    expect(MS_PER_HOUR).toBe(3_600_000);
    expect(MS_PER_DAY).toBe(24 * 3_600_000);
  });
});
