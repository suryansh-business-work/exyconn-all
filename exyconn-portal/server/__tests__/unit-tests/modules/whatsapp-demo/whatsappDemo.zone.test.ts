import { companyProfile, type CompanyProfile } from '../../../../src/lib/company';
import {
  companyTimezone,
  localNow,
  zonedToEpoch,
} from '../../../../src/modules/whatsapp-demo/whatsappDemo.zone';

jest.mock('../../../../src/lib/company', () => ({ companyProfile: jest.fn() }));

const profile = jest.mocked(companyProfile);

const withTimezone = (timezone: string): CompanyProfile => ({
  currency: 'USD',
  locale: 'en-US',
  timezone,
  country: 'US',
  fiscalYearStartMonth: 1,
  taxSystem: 'NONE',
});

describe('the company timezone the demo reads dates in', () => {
  it("is the company's own when it is a real IANA zone", async () => {
    profile.mockResolvedValueOnce(withTimezone('Europe/London'));
    await expect(companyTimezone()).resolves.toBe('Europe/London');
  });

  it("falls back to India's when the company's zone is not a real one", async () => {
    profile.mockResolvedValueOnce(withTimezone('Mars/Olympus'));
    await expect(companyTimezone()).resolves.toBe('Asia/Kolkata');
  });

  it("falls back to India's when no company is in scope", async () => {
    profile.mockRejectedValueOnce(new Error('no organization in scope'));
    await expect(companyTimezone()).resolves.toBe('Asia/Kolkata');
  });
});

describe('a wall-clock time on the business clock as an instant', () => {
  it('reads a date-time in a zone ahead of UTC', () => {
    expect(zonedToEpoch('2026-10-05T17:00', 'Asia/Kolkata')).toBe(Date.UTC(2026, 9, 5, 11, 30));
  });

  it('reads a plain date as its midnight', () => {
    expect(zonedToEpoch('2026-10-05', 'Asia/Kolkata')).toBe(Date.UTC(2026, 9, 4, 18, 30));
  });

  it('ignores surrounding whitespace and anything after the minutes', () => {
    expect(zonedToEpoch('  2026-10-05T17:00:59  ', 'UTC')).toBe(Date.UTC(2026, 9, 5, 17, 0));
  });

  it('lands right on both sides of a daylight-saving change', () => {
    expect(zonedToEpoch('2026-03-08T12:00', 'America/New_York')).toBe(Date.UTC(2026, 2, 8, 16, 0));
    expect(zonedToEpoch('2026-11-01T12:00', 'America/New_York')).toBe(Date.UTC(2026, 10, 1, 17, 0));
  });

  it('is null for text that is not a date', () => {
    expect(zonedToEpoch('tomorrow', 'UTC')).toBeNull();
  });

  it('is null when a date part is not a number', () => {
    expect(zonedToEpoch('2026-ab-05T10:00', 'UTC')).toBeNull();
  });

  it('is null when the time is not HH:mm', () => {
    expect(zonedToEpoch('2026-10-05T5pm', 'UTC')).toBeNull();
  });

  it('is null for a year no date can hold', () => {
    expect(zonedToEpoch('300000-01-01T00:00', 'UTC')).toBeNull();
  });
});

describe('now on the business clock', () => {
  it('names the weekday, date and 24-hour time in the zone', () => {
    expect(localNow(Date.UTC(2026, 9, 5, 11, 30), 'Asia/Kolkata')).toBe('Monday 2026-10-05 17:00');
  });

  it('writes midnight as 00, never 24', () => {
    expect(localNow(Date.UTC(2026, 9, 5, 0, 5), 'UTC')).toBe('Monday 2026-10-05 00:05');
  });
});
