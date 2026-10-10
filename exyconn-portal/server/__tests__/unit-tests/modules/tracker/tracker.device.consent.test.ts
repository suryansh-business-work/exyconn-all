import { randomUUID } from 'node:crypto';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { PolicyModel } from '../../../../src/modules/legal/policy.model';
import { PolicyAcknowledgementModel } from '../../../../src/modules/legal/policy-acknowledgement.model';
import { policyAcknowledgementService } from '../../../../src/modules/legal/policy-acknowledgement.service';
import { trackerDeviceService } from '../../../../src/modules/tracker/tracker.device.service';
import { updateTrackerSettings } from '../../../../src/modules/tracker/tracker.settings.service';
import { TrackerAccessModel, TrackerDeviceModel } from '../../../../src/modules/tracker/models';
import { codeOf } from '../codeOf';

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

    const workday = await trackerDeviceService.markAttendance(userId, 'UTC', 'WFH', 'From home');

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
      codeOf(trackerDeviceService.markAttendance(userId, 'UTC', 'PRESENT')),
    ).resolves.toBe('FORBIDDEN');
  });

  it('refuses a deleted account after the grant check', async () => {
    const userId = await grantedEmployee();
    await UserModel.deleteOne({ _id: userId });

    await expect(trackerDeviceService.markAttendance(userId, 'UTC', 'PRESENT')).rejects.toThrow(
      'Account no longer exists',
    );
  });
});
