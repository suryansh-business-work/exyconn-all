import { randomUUID } from 'node:crypto';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { SalaryStructureModel } from '../../../../src/modules/employee/salary.model';
import { ProjectModel } from '../../../../src/modules/projects/projects.model';
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

async function employee(name: string, billingRate?: number) {
  const user = await UserModel.create({
    name,
    email: `${randomUUID()}@exyconn.com`,
    passwordHash: randomUUID(),
  });
  const id = String(user._id);
  if (billingRate !== undefined) {
    await SalaryStructureModel.create({ employeeId: id, currency: 'EUR', billingRate });
  }
  return id;
}

/** A session booked to a project, with one interval of `activeMs` inside the range. */
async function tracked(userId: string, project: { id: string; name: string }, activeMs: number) {
  const session = await TrackerSessionModel.create({
    userId,
    deviceId: 'd1',
    startedAt: IN_RANGE,
    status: 'stopped',
    projectId: project.id,
    projectName: project.name,
  });
  await TrackerIntervalModel.create({
    userId,
    sessionId: String(session._id),
    startedAt: IN_RANGE,
    endedAt: new Date(IN_RANGE.getTime() + activeMs),
    activeMs,
  });
}

function approved(userId: string, durationMs: number, project = { id: '', name: '' }) {
  return TrackerManualEntryModel.create({
    userId,
    projectId: project.id,
    projectName: project.name,
    startedAt: IN_RANGE,
    endedAt: new Date(IN_RANGE.getTime() + durationMs),
    durationMs,
    note: 'Client workshop',
    status: 'APPROVED',
  });
}

describe('per-employee billing with off-computer time', () => {
  it('bills approved time on top of tracked time, and somebody who only had meetings', async () => {
    const asha = await employee('Asha', 100);
    const dev = await employee('Dev', 50);
    await tracked(asha, { id: '', name: '' }, HOUR);
    await approved(asha, HOUR);
    await approved(dev, 3 * HOUR);

    const billing = await trackerBillingService.billing(FROM, TO);

    expect(billing.rows.map((row) => [row.name, row.activeMs, row.manualMs, row.amount])).toEqual([
      ['Dev', 3 * HOUR, 3 * HOUR, 150],
      ['Asha', 2 * HOUR, HOUR, 200],
    ]);
    expect(billing).toMatchObject({ totalHours: 5, totalAmount: 350, currency: 'EUR' });
  });

  it('answers in the company currency when nothing was worked', async () => {
    await expect(trackerBillingService.billing(FROM, TO)).resolves.toMatchObject({
      rows: [],
      currency: 'USD',
    });
  });
});

describe('billing grouped by project', () => {
  async function apollo() {
    const project = await ProjectModel.create({
      name: 'Apollo',
      status: 'ACTIVE',
      clientId: 'client-1',
      clientName: 'Acme Ltd',
      budgetAmount: 10_000,
      budgetHours: 80,
    });
    return { id: String(project._id), name: 'Apollo (as booked)' };
  }

  it('files tracked and approved time under each project, priced per employee', async () => {
    const asha = await employee('Asha', 100);
    const dev = await employee('Dev', 40);
    const project = await apollo();
    await tracked(asha, project, 2 * HOUR);
    await approved(dev, HOUR, project);
    await tracked(dev, project, HOUR);

    const [row] = await trackerBillingService.billingByProject(FROM, TO);

    expect(row).toEqual({
      projectId: project.id,
      // The live name wins over the one the session recorded.
      projectName: 'Apollo',
      clientId: 'client-1',
      clientName: 'Acme Ltd',
      currency: 'EUR',
      employees: [
        { employeeId: asha, employeeName: 'Asha', hours: 2, rate: 100, amount: 200 },
        { employeeId: dev, employeeName: 'Dev', hours: 2, rate: 40, amount: 80 },
      ],
      hours: 4,
      amount: 280,
      budgetHours: 80,
      budgetAmount: 10_000,
    });
  });

  it('keeps time on deleted and missing projects, labelled as it was booked', async () => {
    const asha = await employee('Asha');
    await tracked(asha, { id: 'retired-project', name: 'Old rollout' }, 2 * HOUR);
    await approved(asha, HOUR);

    const rows = await trackerBillingService.billingByProject(FROM, TO);

    expect(rows.map((row) => [row.projectName, row.hours, row.clientId, row.budgetHours])).toEqual([
      ['Old rollout', 2, null, null],
      ['No project', 1, null, null],
    ]);
    // No salary structure: nobody priced the work, and it bills in the company's money.
    expect(rows[0]).toMatchObject({ amount: 0, currency: 'USD', clientName: '' });
  });

  it('narrows to one project when asked', async () => {
    const asha = await employee('Asha', 100);
    const project = await apollo();
    await tracked(asha, project, HOUR);
    await tracked(asha, { id: 'other', name: 'Other' }, 5 * HOUR);
    await approved(asha, 4 * HOUR, { id: 'other', name: 'Other' });

    const rows = await trackerBillingService.billingByProject(FROM, TO, project.id);

    expect(rows.map((row) => row.projectName)).toEqual(['Apollo']);
  });

  it('leaves out sessions with no active time and intervals from no real session', async () => {
    const asha = await employee('Asha', 100);
    await tracked(asha, { id: 'idle', name: 'Idle project' }, 0);
    await TrackerIntervalModel.create({
      userId: asha,
      sessionId: 'offline-queue-1',
      startedAt: IN_RANGE,
      endedAt: new Date(IN_RANGE.getTime() + HOUR),
      activeMs: HOUR,
    });

    await expect(trackerBillingService.billingByProject(FROM, TO)).resolves.toEqual([]);
  });
});
