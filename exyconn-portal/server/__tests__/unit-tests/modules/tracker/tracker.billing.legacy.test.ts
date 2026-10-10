import { randomUUID } from 'node:crypto';
import { UserModel } from '../../../../src/modules/admin/user.model';
import {
  TrackerIntervalModel,
  TrackerManualEntryModel,
  TrackerSessionModel,
} from '../../../../src/modules/tracker/models';
import { trackerBillingService } from '../../../../src/modules/tracker/tracker.billing.service';
import { useTestOrganization } from '../../../helpers';

useTestOrganization({ currency: 'USD' });

const FROM = new Date('2026-09-01T00:00:00.000Z');
const TO = new Date('2026-10-01T00:00:00.000Z');
const IN_RANGE = new Date('2026-09-04T09:00:00.000Z');
const HOUR = 3_600_000;

async function user(name: string) {
  const row = await UserModel.create({
    name,
    email: `${randomUUID()}@exyconn.com`,
    passwordHash: randomUUID(),
  });
  return row._id.toHexString();
}

describe('time booked before sessions and manual entries carried a project', () => {
  it('files tracked time of a session with no project under the "No project" label', async () => {
    const userId = await user('Asha');
    const session = await TrackerSessionModel.create({
      userId,
      deviceId: 'd1',
      startedAt: IN_RANGE,
      status: 'stopped',
    });
    await TrackerSessionModel.updateOne(
      { _id: session._id },
      { $unset: { projectId: 1, projectName: 1 } },
    );
    await TrackerIntervalModel.create({
      userId,
      sessionId: session._id.toHexString(),
      startedAt: IN_RANGE,
      endedAt: new Date(IN_RANGE.getTime() + HOUR),
      activeMs: HOUR,
    });

    const rows = await trackerBillingService.billingByProject(FROM, TO);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      projectId: '',
      projectName: 'No project',
      clientId: null,
      hours: 1,
      currency: 'USD',
    });
  });

  it('files an approved manual entry with no project under the same label', async () => {
    const userId = await user('Dev');
    const entry = await TrackerManualEntryModel.create({
      userId,
      startedAt: IN_RANGE,
      endedAt: new Date(IN_RANGE.getTime() + 2 * HOUR),
      durationMs: 2 * HOUR,
      note: 'Client workshop',
      status: 'APPROVED',
    });
    await TrackerManualEntryModel.updateOne(
      { _id: entry._id },
      { $unset: { projectId: 1, projectName: 1 } },
    );

    const rows = await trackerBillingService.billingByProject(FROM, TO);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ projectName: 'No project', hours: 2 });
    expect(rows[0].employees).toMatchObject([{ employeeName: 'Dev', hours: 2 }]);
  });
});
