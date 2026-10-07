import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LicenceStatus } from '@exyconn/shell/graphql/generated';
import { renewalsDueWithin, seatsInUse } from '../../../../src/pages/licences';
import { licenceRow } from '../page-kit/fixtures';

const NOW = Date.parse('2026-10-01T00:00:00.000Z');

describe('seatsInUse', () => {
  it('adds up the people holding a seat across every licence', () => {
    const licences = [
      licenceRow({ assigneeIds: ['a', 'b'] }),
      licenceRow({ id: 'licence-2', assigneeIds: ['c'] }),
    ];
    expect(seatsInUse(licences)).toBe(3);
  });

  it('is zero with no licences', () => {
    expect(seatsInUse([])).toBe(0);
  });
});

describe('renewalsDueWithin', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists active licences renewing inside the window, soonest first', () => {
    const later = licenceRow({ id: 'later', renewalDate: '2026-10-20T00:00:00.000Z' });
    const sooner = licenceRow({ id: 'sooner', renewalDate: '2026-10-05T00:00:00.000Z' });
    const outside = licenceRow({ id: 'outside', renewalDate: '2026-12-01T00:00:00.000Z' });

    const due = renewalsDueWithin([later, outside, sooner], 30);

    expect(due.map((licence) => licence.id)).toEqual(['sooner', 'later']);
  });

  it('counts a renewal falling exactly on the last day of the window', () => {
    const edge = licenceRow({ renewalDate: '2026-10-31T00:00:00.000Z' });
    expect(renewalsDueWithin([edge], 30)).toHaveLength(1);
  });

  it('includes overdue renewals, which are still owed', () => {
    const overdue = licenceRow({ renewalDate: '2026-09-15T00:00:00.000Z' });
    expect(renewalsDueWithin([overdue], 30)).toEqual([overdue]);
  });

  it('leaves out a cancelled licence even when its date is close', () => {
    const cancelled = licenceRow({
      status: LicenceStatus.Cancelled,
      renewalDate: '2026-10-03T00:00:00.000Z',
    });
    expect(renewalsDueWithin([cancelled], 30)).toEqual([]);
  });

  it('keeps the caller list in the order it was given', () => {
    const later = licenceRow({ id: 'later', renewalDate: '2026-10-20T00:00:00.000Z' });
    const sooner = licenceRow({ id: 'sooner', renewalDate: '2026-10-05T00:00:00.000Z' });
    const list = [later, sooner];

    renewalsDueWithin(list, 30);

    expect(list.map((licence) => licence.id)).toEqual(['later', 'sooner']);
  });
});
