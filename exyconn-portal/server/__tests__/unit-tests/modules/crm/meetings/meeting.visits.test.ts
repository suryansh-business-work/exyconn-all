import {
  MeetingVisitModel,
  countryOfZone,
  meetingTracking,
  recordVisit,
} from '../../../../../src/modules/crm/meetings/meeting.visits';

const DAY = 24 * 60 * 60 * 1000;

describe('countryOfZone', () => {
  it('names the country a time zone belongs to', () => {
    expect(countryOfZone('Asia/Kolkata')).toBe('IN');
    expect(countryOfZone('Europe/Berlin')).toBe('DE');
  });

  it('is empty for no zone, an unknown zone, a zone of no country and a bare offset', () => {
    expect(countryOfZone(null)).toBe('');
    expect(countryOfZone(undefined)).toBe('');
    expect(countryOfZone('')).toBe('');
    expect(countryOfZone('Mars/Olympus')).toBe('');
    expect(countryOfZone('UTC')).toBe('');
    // A valid zone for Intl that the country table does not know.
    expect(countryOfZone('+05:30')).toBe('');
  });
});

describe('recordVisit', () => {
  it('stores the kind, the meeting and the country, and nothing about the person', async () => {
    await recordVisit('VIEW', 'intro', 'Asia/Kolkata');
    await recordVisit('BOOKED', '', null);

    const rows = await MeetingVisitModel.find().sort({ kind: 1 }).lean();

    expect(rows.map(({ kind, meetingSlug, country }) => ({ kind, meetingSlug, country }))).toEqual([
      { kind: 'BOOKED', meetingSlug: '', country: '' },
      { kind: 'VIEW', meetingSlug: 'intro', country: 'IN' },
    ]);
  });
});

describe('meetingTracking', () => {
  const visit = (kind: 'VIEW' | 'BOOKED', meetingSlug: string, country: string, daysAgo: number) =>
    MeetingVisitModel.create({
      kind,
      meetingSlug,
      country,
      createdAt: new Date(Date.now() - daysAgo * DAY),
    });

  it('totals, groups and lists the visits within the period, most viewed first', async () => {
    await visit('VIEW', 'intro', 'IN', 1);
    await visit('VIEW', 'intro', 'IN', 2);
    await visit('BOOKED', 'intro', 'IN', 2);
    await visit('VIEW', 'demo', '', 1);
    await visit('VIEW', 'demo', 'DE', 40);

    const tracking = await meetingTracking(30);

    expect(tracking).toMatchObject({ days: 30, views: 3, bookings: 1 });
    expect(tracking.byCountry).toEqual([
      { key: 'IN', views: 2, bookings: 1, country: 'IN', countryName: 'India' },
      { key: '', views: 1, bookings: 0, country: '', countryName: '' },
    ]);
    expect(tracking.byMeeting).toEqual([
      { key: 'intro', views: 2, bookings: 1, meetingSlug: 'intro' },
      { key: 'demo', views: 1, bookings: 0, meetingSlug: 'demo' },
    ]);
    expect(tracking.byDay.map((row) => row.day)).toEqual(
      [...new Set(tracking.byDay.map((row) => row.day))].sort((a, b) => a.localeCompare(b)),
    );
    expect(tracking.byDay.reduce((sum, row) => sum + row.views, 0)).toBe(3);
    expect(tracking.recent).toHaveLength(4);
    expect(tracking.recent[0]).toEqual(
      expect.objectContaining({
        kind: 'VIEW',
        countryName: expect.any(String),
        id: expect.any(String),
      }),
    );
    const names: string[] = tracking.recent.map((row) => row.countryName);
    expect([...names].sort((a, b) => a.localeCompare(b))).toEqual(['', 'India', 'India', 'India']);
  });

  it('keeps the period between one day and a year', async () => {
    await visit('VIEW', 'intro', 'IN', 2);

    await expect(meetingTracking(0.4)).resolves.toMatchObject({ days: 1, views: 0 });
    await expect(meetingTracking(-5)).resolves.toMatchObject({ days: 1 });
    await expect(meetingTracking(10_000)).resolves.toMatchObject({ days: 365, views: 1 });
  });
});
