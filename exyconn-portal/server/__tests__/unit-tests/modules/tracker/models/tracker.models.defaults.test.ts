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
import { TRACKER_DEFAULTS } from '../../../../../src/modules/tracker/tracker.constants';

const startedAt = new Date('2026-10-01T09:00:00.000Z');
const endedAt = new Date('2026-10-01T09:10:00.000Z');

describe('tracker model defaults', () => {
  it('grants access as active, unconsented and WORKING until the employee says otherwise', () => {
    const access = new TrackerAccessModel({ userId: 'emp-1', grantedBy: 'admin-1' });

    expect(access.validateSync()).toBeUndefined();
    expect(access.grantedAt).toBeInstanceOf(Date);
    expect(access.toObject()).toMatchObject({
      isActive: true,
      revokedAt: null,
      revokedBy: '',
      consentedAt: null,
      timezone: '',
      presence: 'WORKING',
      presenceNote: '',
      presenceAt: null,
    });
  });

  it('registers a device as active with blank hardware details and fresh timestamps', () => {
    const device = new TrackerDeviceModel({
      userId: 'emp-1',
      deviceId: 'dev-1',
      tokenHash: 'a'.repeat(64),
      platform: 'darwin',
    });

    expect(device.validateSync()).toBeUndefined();
    expect(device.issuedAt).toBeInstanceOf(Date);
    expect(device.lastSeenAt).toBeInstanceOf(Date);
    expect(device.toObject()).toMatchObject({
      isActive: true,
      revokedAt: null,
      hostname: '',
      machineId: '',
      cpuCores: 0,
      totalMemoryMb: 0,
      screenCount: 0,
    });
  });

  it('opens a session as active with no project, no ticket and zeroed roll-ups', () => {
    const session = new TrackerSessionModel({ userId: 'emp-1', deviceId: 'dev-1', startedAt });

    expect(session.validateSync()).toBeUndefined();
    expect(session.toObject()).toMatchObject({
      status: 'active',
      endedAt: null,
      projectId: '',
      projectName: '',
      taskId: '',
      taskKey: '',
      taskTitle: '',
      activeMs: 0,
      idleMs: 0,
      keyCount: 0,
      mouseCount: 0,
    });
  });

  it('starts an interval with every counter at zero', () => {
    const interval = new TrackerIntervalModel({
      userId: 'emp-1',
      sessionId: 's-1',
      startedAt,
      endedAt,
    });

    expect(interval.validateSync()).toBeUndefined();
    expect(interval.toObject()).toMatchObject({
      keyCount: 0,
      mouseCount: 0,
      activeMs: 0,
      idleMs: 0,
      activityPercent: 0,
    });
  });

  it('records window usage with an empty title and trims the app name', () => {
    const usage = new TrackerWindowUsageModel({
      userId: 'emp-1',
      sessionId: 's-1',
      intervalStartedAt: startedAt,
      appName: '  Code  ',
    });

    expect(usage.validateSync()).toBeUndefined();
    expect(usage.toObject()).toMatchObject({ appName: 'Code', windowTitle: '', durationMs: 0 });
  });

  it('stores a screenshot as unblurred with no provider file id by default', () => {
    const shot = new TrackerScreenshotModel({
      userId: 'emp-1',
      sessionId: 's-1',
      intervalStartedAt: startedAt,
      capturedAt: endedAt,
      imageUrl: ' https://img.example.test/a.png ',
    });

    expect(shot.validateSync()).toBeUndefined();
    expect(shot.toObject()).toMatchObject({
      imageUrl: 'https://img.example.test/a.png',
      fileId: '',
      displayId: '',
      blurred: false,
    });
  });

  it('files a manual entry as PENDING and unreviewed', () => {
    const entry = new TrackerManualEntryModel({
      userId: 'emp-1',
      startedAt,
      endedAt,
      durationMs: 600000,
      note: ' Client call ',
    });

    expect(entry.validateSync()).toBeUndefined();
    expect(entry.toObject()).toMatchObject({
      status: 'PENDING',
      note: 'Client call',
      projectId: '',
      taskId: '',
      reviewedBy: '',
      reviewedAt: null,
      reviewNote: '',
    });
  });

  it('sends a message as an unread CHAT line with no title', () => {
    const message = new TrackerMessageModel({
      userId: 'emp-1',
      direction: 'TO_EMPLOYEE',
      body: ' Hello ',
      authorId: 'admin-1',
    });

    expect(message.validateSync()).toBeUndefined();
    expect(message.toObject()).toMatchObject({
      kind: 'CHAT',
      title: '',
      body: 'Hello',
      authorName: '',
      readAt: null,
    });
  });

  it('builds the global settings document entirely from TRACKER_DEFAULTS', () => {
    const settings = new TrackerSettingsModel({});

    expect(settings.validateSync()).toBeUndefined();
    expect(settings.toObject()).toMatchObject({
      ...TRACKER_DEFAULTS,
      key: 'global',
      dailyDigestLastRun: '',
      weeklyDigestLastRun: '',
    });
  });

  it('normalises the consent policy slug to trimmed lower case', () => {
    const settings = new TrackerSettingsModel({ consentPolicySlug: '  Tracking-Policy ' });

    expect(settings.consentPolicySlug).toBe('tracking-policy');
  });
});
