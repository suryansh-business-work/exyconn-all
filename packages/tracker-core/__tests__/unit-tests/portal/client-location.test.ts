import { afterEach, describe, expect, it, vi } from 'vitest';
import { TrackerAuthError } from '../../../src/portal/portal-error';
import { LOCATION } from '../controller-data';
import { clientWith, nextToken, respond, sent } from './portal-fixture';

afterEach(() => {
  vi.unstubAllGlobals();
});

const FROM = '2026-03-01T00:00:00.000Z';
const TO = '2026-04-01T00:00:00.000Z';

describe('portal client — location and earnings', () => {
  it('pins a move with the device token and answers whether the portal kept it', async () => {
    const token = nextToken();
    respond(200, { data: { trackerRecordLocation: false } });

    await expect(clientWith(token).recordLocation(LOCATION)).resolves.toBe(false);
    expect(sent().authorization).toBe(`Bearer ${token}`);
    expect(sent().query).toContain('trackerRecordLocation');
    expect(sent().variables).toEqual({ location: LOCATION });
  });

  it('lists the employee’s own pins for one local day', async () => {
    const pins = [{ ...LOCATION, id: 'l1', kind: 'ATTENDANCE' }];
    respond(200, { data: { myTrackerLocations: pins } });

    await expect(clientWith(nextToken()).fetchMyLocations('2026-03-02')).resolves.toEqual(pins);
    expect(sent().variables).toEqual({ date: '2026-03-02' });
  });

  it('prices tracked time over a range', async () => {
    const earnings = { payType: 'FIXED', rate: 0, currency: 'INR', trackedMs: 0, amount: null };
    respond(200, { data: { myTrackerEarnings: earnings } });

    await expect(clientWith(nextToken()).fetchMyEarnings(FROM, TO)).resolves.toEqual(earnings);
    expect(sent().variables).toEqual({ from: FROM, to: TO });
  });

  it('asks for the contract and its XLSX in the given zone', async () => {
    const contract = {
      workHoursPerDay: 8,
      days: [{ date: '2026-03-01', expectedMs: 0, offReason: 'WEEKEND', offLabel: null }],
    };
    respond(200, { data: { myTrackerExpected: contract } });
    await expect(
      clientWith(nextToken()).fetchMyExpected(FROM, TO, 'Asia/Kolkata'),
    ).resolves.toEqual(contract);
    expect(sent().variables).toEqual({ from: FROM, to: TO, timezone: 'Asia/Kolkata' });

    const file = { fileName: 'hours.xlsx', mimeType: 'application/x', contentBase64: 'UEs=' };
    respond(200, { data: { myTrackerExpectedReport: file } });
    await expect(clientWith(nextToken()).fetchMyExpectedReport(FROM, TO, 'UTC')).resolves.toEqual(
      file,
    );
    expect(sent().variables).toEqual({ from: FROM, to: TO, timezone: 'UTC' });
  });

  it('refuses a location write without a device token', async () => {
    respond(200, { data: { trackerRecordLocation: true } });

    await expect(clientWith(null).recordLocation(LOCATION)).rejects.toBeInstanceOf(
      TrackerAuthError,
    );
  });
});
