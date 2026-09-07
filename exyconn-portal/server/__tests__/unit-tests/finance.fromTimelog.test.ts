import { financeResolvers } from '../../src/modules/finance';
import { InvoiceModel } from '../../src/modules/finance/finance.model';
import { ClientModel } from '../../src/modules/clients/clients.model';
import { ProjectModel } from '../../src/modules/projects/projects.model';
import { UserModel } from '../../src/modules/admin/user.model';
import { SalaryStructureModel } from '../../src/modules/employee/salary.model';
import {
  TrackerIntervalModel,
  TrackerManualEntryModel,
  TrackerSessionModel,
} from '../../src/modules/tracker/models';
import { trackerBillingService } from '../../src/modules/tracker/tracker.billing.service';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

const HOUR = 3_600_000;
const FROM = new Date('2026-09-01T00:00:00.000Z');
const TO = new Date('2026-10-01T00:00:00.000Z');
const AT = new Date('2026-09-04T09:00:00.000Z');

const asFinance: GraphQLContext = {
  user: { id: 'user-1', roles: [ROLES.FINANCE], email: 'ap@exyconn.com' },
};

async function client() {
  const created = await ClientModel.create({
    name: 'Priya',
    email: 'priya@acme.test',
    phone: '000',
    company: 'Acme',
    status: 'ACTIVE',
  });
  return String(created._id);
}

async function project(clientId: string | null, extra: Record<string, unknown> = {}) {
  const created = await ProjectModel.create({
    name: 'Acme Portal',
    status: 'ACTIVE',
    clientId,
    clientName: clientId ? 'Priya' : '',
    ...extra,
  });
  return String(created._id);
}

async function employee(name: string, billingRate?: number) {
  const user = await UserModel.create({ name, email: `${name}@exyconn.com`, passwordHash: 'x' });
  const id = String(user._id);
  if (billingRate !== undefined) {
    await SalaryStructureModel.create({ employeeId: id, billingRate, effectiveFrom: FROM });
  }
  return id;
}

/** A tracked run on a project with `activeMs` of interval time inside the range. */
async function session(userId: string, projectId: string, activeMs: number) {
  const doc = await TrackerSessionModel.create({
    userId,
    deviceId: 'dev-1',
    startedAt: AT,
    endedAt: new Date(AT.getTime() + activeMs),
    status: 'stopped',
    projectId,
    projectName: 'Acme Portal',
  });
  await TrackerIntervalModel.create({
    userId,
    sessionId: String(doc._id),
    startedAt: AT,
    endedAt: new Date(AT.getTime() + activeMs),
    activeMs,
    idleMs: 0,
    activityPercent: 100,
  });
}

async function manual(userId: string, projectId: string, durationMs: number, status = 'APPROVED') {
  await TrackerManualEntryModel.create({
    userId,
    projectId,
    projectName: 'Acme Portal',
    startedAt: AT,
    endedAt: new Date(AT.getTime() + durationMs),
    durationMs,
    note: 'Client call',
    status,
  });
}

const raise = (projectId: string) =>
  financeResolvers.Mutation.createInvoiceFromTimeLog(
    null,
    { projectId, from: FROM, to: TO } as never,
    asFinance,
  );

describe('billing by project', () => {
  it('files each session under its project and each employee under that', async () => {
    const acme = await project(await client(), { budgetHours: 100, budgetAmount: 90_000 });
    const other = await project(null);
    const asha = await employee('asha', 1_000);
    const ravi = await employee('ravi', 500);
    await session(asha, acme, 2 * HOUR);
    await session(ravi, acme, HOUR);
    await session(asha, other, 3 * HOUR);

    const rows = await trackerBillingService.billingByProject(FROM, TO);

    expect(rows).toHaveLength(2);
    const acmeRow = rows.find((row) => row.projectId === acme);
    expect(acmeRow).toMatchObject({
      projectName: 'Acme Portal',
      clientName: 'Priya',
      hours: 3,
      amount: 2_500,
      budgetHours: 100,
      budgetAmount: 90_000,
    });
    expect(acmeRow?.employees.map((row) => row.employeeName)).toEqual(['asha', 'ravi']);
  });

  it('bills approved off-computer time against its project, and pending time not at all', async () => {
    const acme = await project(await client());
    const asha = await employee('asha', 1_000);
    await manual(asha, acme, 2 * HOUR);
    await manual(asha, acme, 5 * HOUR, 'PENDING');

    const [row] = await trackerBillingService.billingByProject(FROM, TO, acme);

    expect(row).toMatchObject({ hours: 2, amount: 2_000 });
  });
});

describe('createInvoiceFromTimeLog', () => {
  it('raises a draft with one line per employee from sessions and approved entries', async () => {
    const acme = await project(await client());
    const asha = await employee('asha', 1_000);
    const ravi = await employee('ravi', 500);
    await session(asha, acme, 2 * HOUR);
    await manual(asha, acme, HOUR);
    await session(ravi, acme, 1.5 * HOUR);

    const invoice = await raise(acme);

    expect(invoice.number).toMatch(/^INV-\d{4}$/);
    expect(invoice.lines).toEqual([
      expect.objectContaining({
        description: 'asha — 3 h on Acme Portal (2026-09-01–2026-10-01)',
        quantity: 3,
        rate: 1_000,
        taxPercent: 18,
      }),
      expect.objectContaining({ description: expect.stringContaining('ravi — 1.5 h'), rate: 500 }),
    ]);
    // (3 × 1000 + 1.5 × 500) × 1.18
    expect(invoice.amount).toBe(4_425);

    const stored = await InvoiceModel.findOne({ number: invoice.number }).lean();
    expect(stored).toMatchObject({
      status: 'DRAFT',
      clientName: 'Priya',
      projectId: acme,
      periodFrom: FROM,
      periodTo: TO,
    });
  });

  it('refuses when an employee has no billing rate, and says who', async () => {
    const acme = await project(await client());
    await session(await employee('asha', 1_000), acme, HOUR);
    await session(await employee('meera'), acme, HOUR);

    await expect(raise(acme)).rejects.toThrow(/meera/);
    expect(await InvoiceModel.countDocuments()).toBe(0);
  });

  it('refuses a period with no billable hours', async () => {
    const acme = await project(await client());
    await manual(await employee('asha', 1_000), acme, HOUR, 'PENDING');

    await expect(raise(acme)).rejects.toThrow(/no billable hours/i);
  });

  it('refuses a project with no client', async () => {
    const orphan = await project(null);
    await session(await employee('asha', 1_000), orphan, HOUR);

    await expect(raise(orphan)).rejects.toThrow(/client/i);
  });

  it('refuses a role that is neither finance nor projects', async () => {
    const asHr: GraphQLContext = {
      user: { id: 'user-2', roles: [ROLES.HR], email: 'hr@exyconn.com' },
    };
    await expect(
      financeResolvers.Mutation.createInvoiceFromTimeLog(
        null,
        { projectId: 'x', from: FROM, to: TO } as never,
        asHr,
      ),
    ).rejects.toThrow();
  });
});
