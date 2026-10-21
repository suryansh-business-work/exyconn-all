import { randomUUID } from 'node:crypto';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { PolicyModel } from '../../../../src/modules/legal/policy.model';
import { PolicyAcknowledgementModel } from '../../../../src/modules/legal/policy-acknowledgement.model';
import { policyAcknowledgementService } from '../../../../src/modules/legal/policy-acknowledgement.service';
import { trackerDeviceService } from '../../../../src/modules/tracker/tracker.device.service';
import { updateTrackerSettings } from '../../../../src/modules/tracker/tracker.settings.service';
import {
  TrackerAccessModel,
  TrackerDeviceModel,
  TrackerLocationModel,
} from '../../../../src/modules/tracker/models';
import { AttendanceModel } from '../../../../src/modules/hr/attendance.model';
import { LeaveRequestModel } from '../../../../src/modules/hr/hr.model';
import { saveDefaultWorkDays } from '../../../../src/modules/admin/work-week';
import { codeOf } from '../codeOf';
import { officeFix } from '../../../fixtures/location';
import { freezeClock, useTestOrganization, useWorkingEveryDay } from '../../../helpers';

// Off days are covered by tracker.offday and tracker.expected.service; here every day is a
// working day, in a company, so the suite does not depend on the day it runs.
useTestOrganization();
useWorkingEveryDay();

const DEVICE_ID = 'device-consent';
const SLUG = 'tracking-disclosure';

async function grantedEmployee() {
  const user = await UserModel.create({
    name: 'Asha',
    email: `${randomUUID()}@exyconn.com`,
    passwordHash: randomUUID(),
  });
  const userId = user._id.toHexString();
  await TrackerAccessModel.create({ userId, grantedBy: 'admin' });
  await TrackerDeviceModel.create({
    userId,
    deviceId: DEVICE_ID,
    tokenHash: 'h',
    platform: 'win32',
  });
  return userId;
}

/** The workspace points the tracker at a published Legal policy that must be signed. */
async function disclosurePolicy() {
  const policy = await PolicyModel.create({
    title: 'Monitoring policy',
    slug: SLUG,
    body: '<p>We record activity counts and screenshots.</p>',
    status: 'PUBLISHED',
    version: 2,
    effectiveDate: new Date('2026-01-01T00:00:00.000Z'),
    requiresAcknowledgement: true,
  });
  await updateTrackerSettings({ consentPolicySlug: SLUG });
  return policy._id.toHexString();
}

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('accepting the disclosure', () => {
  it('asks for a typed name when the policy has to be signed', async () => {
    const userId = await grantedEmployee();
    await disclosurePolicy();
    const sign = jest.spyOn(policyAcknowledgementService, 'sign');

    await expect(trackerDeviceService.acceptConsent(userId, '   ')).rejects.toThrow(
      'Type your name to sign the tracking policy.',
    );
    await expect(codeOf(trackerDeviceService.acceptConsent(userId))).resolves.toBe(
      'BAD_USER_INPUT',
    );
    expect(sign).not.toHaveBeenCalled();
    const access = await TrackerAccessModel.findOne({ userId }).lean();
    expect(access?.consentedAt).toBeNull();
  });

  it('signs the policy in Legal under the trimmed name, and records the consent', async () => {
    const userId = await grantedEmployee();
    const policyId = await disclosurePolicy();
    const sign = jest
      .spyOn(policyAcknowledgementService, 'sign')
      .mockResolvedValue({} as Awaited<ReturnType<typeof policyAcknowledgementService.sign>>);

    await expect(trackerDeviceService.acceptConsent(userId, '  Asha Rao ')).resolves.toBe(true);

    expect(sign).toHaveBeenCalledWith(userId, policyId, 'Asha Rao');
    const access = await TrackerAccessModel.findOne({ userId }).lean();
    expect(access?.consentedAt).toBeInstanceOf(Date);
  });

  it('refuses once the grant has been revoked', async () => {
    const userId = await grantedEmployee();
    await TrackerAccessModel.updateOne({ userId }, { isActive: false });

    await expect(codeOf(trackerDeviceService.acceptConsent(userId))).resolves.toBe('FORBIDDEN');
  });
});

describe('the disclosure gate on rehydrate', () => {
  it('asks again when the employee agreed in the app but never signed this version', async () => {
    const userId = await grantedEmployee();
    const policyId = await disclosurePolicy();
    await TrackerAccessModel.updateOne({ userId }, { consentedAt: new Date() });

    const before = await trackerDeviceService.me(userId, DEVICE_ID);
    await PolicyAcknowledgementModel.create({
      policyId,
      policyTitle: 'Monitoring policy',
      version: 2,
      userId,
      signedName: 'Asha',
    });
    const after = await trackerDeviceService.me(userId, DEVICE_ID);

    expect(before.consentRequired).toBe(true);
    expect(before.consentPolicy).toMatchObject({ id: policyId, acknowledged: false });
    expect(after.consentRequired).toBe(false);
    expect(after.consentPolicy).toMatchObject({ acknowledged: true });
  });

  it('signs a deleted account out rather than rebuilding its session', async () => {
    const userId = await grantedEmployee();
    await UserModel.deleteOne({ _id: userId });

    await expect(trackerDeviceService.me(userId, DEVICE_ID)).rejects.toThrow(
      'Account no longer exists',
    );
  });

  it('answers with the presence the employee last stated, and their workday', async () => {
    const userId = await grantedEmployee();
    await TrackerAccessModel.updateOne({ userId }, { presence: 'LUNCH', presenceNote: 'canteen' });

    const me = await trackerDeviceService.me(userId, DEVICE_ID);

    expect(me.presence).toMatchObject({ status: 'LUNCH', note: 'canteen' });
    expect(me.workday).toMatchObject({ activeMs: 0, manualMs: 0, attendanceMarked: false });
    expect(me.unreadMessages).toBe(0);
    expect(me.notices).toEqual([]);
  });
});

describe('marking attendance from the app', () => {
  it('answers with the day it marked, in the employee’s zone', async () => {
    const userId = await grantedEmployee();

    const workday = await trackerDeviceService.markAttendance(
      userId,
      'UTC',
      'WFH',
      'From home',
      officeFix,
    );

    expect(workday).toMatchObject({
      attendanceMarked: true,
      attendanceStatus: 'WFH',
      attendanceNote: 'From home',
    });
  });

  it('refuses once the grant has been revoked', async () => {
    const userId = await grantedEmployee();
    await TrackerAccessModel.updateOne({ userId }, { isActive: false });

    await expect(
      codeOf(trackerDeviceService.markAttendance(userId, 'UTC', 'PRESENT', null, officeFix)),
    ).resolves.toBe('FORBIDDEN');
  });

  it('refuses a deleted account after the grant check', async () => {
    const userId = await grantedEmployee();
    await UserModel.deleteOne({ _id: userId });

    await expect(
      trackerDeviceService.markAttendance(userId, 'UTC', 'PRESENT', null, officeFix),
    ).rejects.toThrow('Account no longer exists');
  });

  it('pins where attendance was marked', async () => {
    const userId = await grantedEmployee();

    await trackerDeviceService.markAttendance(userId, 'UTC', 'PRESENT', null, officeFix);

    await expect(TrackerLocationModel.find().lean()).resolves.toEqual([
      expect.objectContaining({ userId, kind: 'ATTENDANCE', lat: officeFix.lat, source: 'GPS' }),
    ]);
  });

  it('refuses an invalid location before marking anything', async () => {
    const userId = await grantedEmployee();

    await expect(
      codeOf(
        trackerDeviceService.markAttendance(userId, 'UTC', 'PRESENT', null, {
          ...officeFix,
          lat: 120,
        }),
      ),
    ).resolves.toBe('BAD_USER_INPUT');
    expect(await AttendanceModel.countDocuments()).toBe(0);
  });

  it('marks in at the address on the employee’s record when no fix could be read', async () => {
    const userId = await grantedEmployee();
    await UserModel.updateOne({ _id: userId }, { address: ' 12 Example Road ' });

    await trackerDeviceService.markAttendance(
      userId,
      'UTC',
      'PRESENT',
      null,
      null,
      'PROFILE_ADDRESS',
    );

    await expect(AttendanceModel.findOne({ employeeId: userId }).lean()).resolves.toMatchObject({
      locationFallback: 'PROFILE_ADDRESS',
      manualLocation: '12 Example Road',
    });
    expect(await TrackerLocationModel.countDocuments()).toBe(0);
  });

  it('marks in without a location when the employee chose to', async () => {
    const userId = await grantedEmployee();

    await trackerDeviceService.markAttendance(userId, 'UTC', 'PRESENT', null, null, 'NONE');

    await expect(AttendanceModel.findOne({ employeeId: userId }).lean()).resolves.toMatchObject({
      locationFallback: 'NONE',
      manualLocation: null,
    });
  });

  it('records no fallback on a mark with a device fix', async () => {
    const userId = await grantedEmployee();

    await trackerDeviceService.markAttendance(userId, 'UTC', 'PRESENT', null, officeFix);

    await expect(AttendanceModel.findOne({ employeeId: userId }).lean()).resolves.toMatchObject({
      locationFallback: null,
      manualLocation: null,
    });
  });

  it.each([
    ['neither a fix nor a fallback', null, null],
    ['both a fix and a fallback', officeFix, 'NONE' as const],
    ['the profile address when HR has not added one', null, 'PROFILE_ADDRESS' as const],
  ])('refuses %s, marking nothing', async (_case, location, fallback) => {
    const userId = await grantedEmployee();

    await expect(
      codeOf(
        trackerDeviceService.markAttendance(userId, 'UTC', 'PRESENT', null, location, fallback),
      ),
    ).resolves.toBe('BAD_USER_INPUT');
    expect(await AttendanceModel.countDocuments()).toBe(0);
    expect(await TrackerLocationModel.countDocuments()).toBe(0);
  });

  // A Wednesday, so the off days below are the only reason a day is off.
  const WEDNESDAY = '2026-01-07T10:00:00.000Z';

  it('refuses the employee’s week off, writing neither a pin nor attendance', async () => {
    const userId = await grantedEmployee();
    await UserModel.updateOne({ _id: userId }, { workDays: [1, 2, 4, 5] });
    freezeClock(WEDNESDAY);

    await expect(
      trackerDeviceService.markAttendance(userId, 'UTC', 'PRESENT', null, officeFix),
    ).rejects.toThrow('Today is your week off — tracking is paused.');
    expect(await TrackerLocationModel.countDocuments()).toBe(0);
    expect(await AttendanceModel.countDocuments()).toBe(0);
  });

  it('refuses a day of approved leave, naming the leave type', async () => {
    const userId = await grantedEmployee();
    const midnight = new Date('2026-01-07T00:00:00.000Z');
    freezeClock(WEDNESDAY);
    await LeaveRequestModel.create({
      employeeId: userId,
      type: 'CL',
      fromDate: midnight,
      toDate: midnight,
      reason: 'Errand',
      status: 'APPROVED',
    });

    await expect(
      codeOf(trackerDeviceService.markAttendance(userId, 'UTC', 'PRESENT', null, officeFix)),
    ).resolves.toBe('FORBIDDEN');
    await expect(
      trackerDeviceService.markAttendance(userId, 'UTC', 'PRESENT', null, officeFix),
    ).rejects.toThrow("You're on approved leave (CL) today");
  });

  it('shows the off day on the workday the app reads', async () => {
    const userId = await grantedEmployee();
    await saveDefaultWorkDays([6]);
    freezeClock(WEDNESDAY);

    const me = await trackerDeviceService.me(userId, DEVICE_ID);

    expect(me.workday).toMatchObject({ offReason: 'WEEKEND', offLabel: null });
    expect(me.workProfile.workDays).toEqual([6]);
  });
});
