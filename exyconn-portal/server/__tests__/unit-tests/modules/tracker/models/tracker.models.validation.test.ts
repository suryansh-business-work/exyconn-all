import {
  TrackerAccessModel,
  TrackerDeviceModel,
  TrackerIntervalModel,
  TrackerManualEntryModel,
  TrackerMessageModel,
  TrackerScreenshotModel,
  TrackerSessionModel,
  TrackerSettingsModel,
  TrackerWindowUsageModel,
} from '../../../../../src/modules/tracker/models';
import type { Document } from 'mongoose';
import { TRACKER_MESSAGE_LIMITS } from '../../../../../src/modules/tracker/tracker.constants';

/** Which paths failed validation, and why — `{ path: kind }`. */
const failures = (doc: Document): Record<string, string> =>
  Object.fromEntries(
    Object.entries(doc.validateSync()?.errors ?? {}).map(([path, error]) => [path, error.kind]),
  );

const startedAt = new Date('2026-10-01T09:00:00.000Z');
const endedAt = new Date('2026-10-01T09:10:00.000Z');
const interval = { userId: 'emp-1', sessionId: 's-1', startedAt, endedAt };

describe('tracker model validation', () => {
  it('names every required field an empty document is missing', () => {
    expect(failures(new TrackerAccessModel({}))).toMatchObject({
      userId: 'required',
      grantedBy: 'required',
    });
    expect(failures(new TrackerDeviceModel({}))).toMatchObject({
      userId: 'required',
      deviceId: 'required',
      tokenHash: 'required',
      platform: 'required',
    });
    expect(failures(new TrackerSessionModel({}))).toMatchObject({
      userId: 'required',
      deviceId: 'required',
      startedAt: 'required',
    });
    expect(failures(new TrackerScreenshotModel({}))).toMatchObject({
      sessionId: 'required',
      intervalStartedAt: 'required',
      capturedAt: 'required',
      imageUrl: 'required',
    });
    expect(failures(new TrackerManualEntryModel({}))).toMatchObject({
      startedAt: 'required',
      endedAt: 'required',
      durationMs: 'required',
      note: 'required',
    });
  });

  it('refuses values outside the enums the tracker constants define', () => {
    expect(failures(new TrackerAccessModel({ presence: 'NAPPING' }))).toMatchObject({
      presence: 'enum',
    });
    expect(failures(new TrackerDeviceModel({ platform: 'amiga' }))).toMatchObject({
      platform: 'enum',
    });
    expect(failures(new TrackerSessionModel({ status: 'paused' }))).toMatchObject({
      status: 'enum',
    });
    expect(failures(new TrackerManualEntryModel({ status: 'MAYBE' }))).toMatchObject({
      status: 'enum',
    });
    expect(failures(new TrackerMessageModel({ kind: 'SMS', direction: 'SIDEWAYS' }))).toMatchObject(
      { kind: 'enum', direction: 'enum' },
    );
    expect(failures(new TrackerSettingsModel({ webcamCorner: 'centre' }))).toMatchObject({
      webcamCorner: 'enum',
    });
  });

  it('keeps an interval activity share between 0 and 100 and counters non-negative', () => {
    expect(failures(new TrackerIntervalModel({ ...interval, activityPercent: 101 }))).toEqual({
      activityPercent: 'max',
    });
    expect(failures(new TrackerIntervalModel({ ...interval, activityPercent: 100 }))).toEqual({});
    expect(failures(new TrackerIntervalModel({ ...interval, keyCount: -1 }))).toEqual({
      keyCount: 'min',
    });
  });

  it('refuses a negative window-usage duration or device hardware count', () => {
    const usage = new TrackerWindowUsageModel({
      userId: 'emp-1',
      sessionId: 's-1',
      intervalStartedAt: startedAt,
      appName: 'Code',
      durationMs: -5,
    });
    expect(failures(usage)).toEqual({ durationMs: 'min' });
    expect(failures(new TrackerDeviceModel({ cpuCores: -1 }))).toMatchObject({ cpuCores: 'min' });
  });

  it('treats a whitespace-only message body as missing and caps body and title length', () => {
    const base = { userId: 'emp-1', direction: 'TO_ADMIN', authorId: 'emp-1' };

    expect(failures(new TrackerMessageModel({ ...base, body: '   ' }))).toEqual({
      body: 'required',
    });
    const tooLong = new TrackerMessageModel({
      ...base,
      body: 'b'.repeat(TRACKER_MESSAGE_LIMITS.maxBodyChars + 1),
      title: 't'.repeat(TRACKER_MESSAGE_LIMITS.maxTitleChars + 1),
    });
    expect(failures(tooLong)).toEqual({ body: 'maxlength', title: 'maxlength' });
    const atLimit = new TrackerMessageModel({
      ...base,
      body: 'b'.repeat(TRACKER_MESSAGE_LIMITS.maxBodyChars),
      title: 't'.repeat(TRACKER_MESSAGE_LIMITS.maxTitleChars),
    });
    expect(failures(atLimit)).toEqual({});
  });

  it('holds tracker settings to their documented bounds', () => {
    const settings = new TrackerSettingsModel({
      intervalMinutes: 0,
      screenshotsPerInterval: 11,
      idleThresholdSeconds: 59,
      screenshotMaxWidth: 3841,
      autoStartHour: 24,
      syncIntervalMinutes: 61,
    });

    expect(failures(settings)).toEqual({
      intervalMinutes: 'min',
      screenshotsPerInterval: 'max',
      idleThresholdSeconds: 'min',
      screenshotMaxWidth: 'max',
      autoStartHour: 'max',
      syncIntervalMinutes: 'max',
    });
  });
});

describe('tracker unique indexes', () => {
  // Mongoose builds indexes in the background after connecting; init() resolves once they exist.
  beforeAll(() =>
    Promise.all([
      TrackerIntervalModel.init(),
      TrackerDeviceModel.init(),
      TrackerAccessModel.init(),
    ]),
  );

  it('stores a re-synced interval only once', async () => {
    await TrackerIntervalModel.create(interval);

    await expect(TrackerIntervalModel.create({ ...interval, keyCount: 9 })).rejects.toThrow(
      /duplicate key/,
    );
    await TrackerIntervalModel.create({ ...interval, sessionId: 's-2' });
    expect(await TrackerIntervalModel.countDocuments()).toBe(2);
  });

  it('refuses a second device row with the same install id', async () => {
    const device = { userId: 'emp-1', deviceId: 'dev-1', tokenHash: 'h1', platform: 'linux' };
    await TrackerDeviceModel.create(device);

    await expect(TrackerDeviceModel.create({ ...device, userId: 'emp-2' })).rejects.toThrow(
      /duplicate key/,
    );
  });

  it('keeps one access grant per employee', async () => {
    await TrackerAccessModel.create({ userId: 'emp-1', grantedBy: 'admin-1' });

    await expect(
      TrackerAccessModel.create({ userId: 'emp-1', grantedBy: 'admin-2' }),
    ).rejects.toThrow(/duplicate key/);
  });
});
