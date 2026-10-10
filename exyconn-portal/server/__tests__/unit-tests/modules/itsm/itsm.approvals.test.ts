import { IT_APPROVAL_SOURCES } from '../../../../src/modules/itsm/itsm.approvals';
import {
  ItAccessRequestModel,
  ItChangeModel,
  ItPurchaseRequestModel,
} from '../../../../src/modules/itsm/models';
import { ROLES } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import { ctxFor, HOUR, itStaff } from './itsm.fixtures';

/** IT reads every pending row: its decisions are not split by reporting line. */
const EVERYONE = { ownerIds: null };

const source = (kind: string) => {
  const found = IT_APPROVAL_SOURCES.find((row) => row.kind === kind);
  if (!found) {
    throw new Error(`No approval source ${kind}`);
  }
  return found;
};

describe('IT decisions in the shared approvals queue', () => {
  useTestOrganization();

  it('lends three IT-only sources that a manager may not decide', () => {
    expect(IT_APPROVAL_SOURCES.map((row) => [row.kind, row.link])).toEqual([
      ['IT_ACCESS', '/it/access'],
      ['IT_CHANGE', '/it/changes'],
      ['IT_PURCHASE', '/it/procurement'],
    ]);
    expect(IT_APPROVAL_SOURCES.every((row) => !row.managerMayDecide)).toBe(true);
  });

  it('describes pending access requests, crediting the employee when nobody else asked', async () => {
    await ItAccessRequestModel.create([
      {
        employeeId: 'emp-1',
        employeeName: 'Asha Rao',
        application: 'Figma',
        kind: 'ROLE_CHANGE',
        reason: 'Design lead',
      },
      { employeeId: 'emp-2', application: 'Jira', reason: 'r', status: 'FULFILLED' },
    ]);

    const pending = await source('IT_ACCESS').pending(EVERYONE);

    expect(pending).toEqual([
      expect.objectContaining({
        title: 'role change — Figma for Asha Rao',
        summary: 'Design lead',
        requestedById: 'emp-1',
        amount: null,
        currency: null,
      }),
    ]);
  });

  it('describes pending changes with their environment and risk', async () => {
    await ItChangeModel.create({
      title: 'Rotate keys',
      description: 'Quarterly',
      system: 'Vault',
      status: 'PENDING_APPROVAL',
      risk: 'HIGH',
      environment: 'PRODUCTION',
      requestedById: 'it-9',
      plannedStart: new Date(Date.now() + HOUR),
      plannedEnd: new Date(Date.now() + 2 * HOUR),
    });

    const [row] = await source('IT_CHANGE').pending(EVERYONE);

    expect(row).toMatchObject({
      title: 'Rotate keys (production, high risk)',
      summary: 'Quarterly',
      requestedById: 'it-9',
    });
  });

  it("prices pending purchases in the company's currency, and lists nothing when none wait", async () => {
    expect(await source('IT_PURCHASE').pending(EVERYONE)).toEqual([]);
    await ItPurchaseRequestModel.create({
      title: 'Monitors',
      quantity: 3,
      estimatedCost: 900,
      justification: 'New desks',
      status: 'QUOTED',
    });

    const [row] = await source('IT_PURCHASE').pending(EVERYONE);

    expect(row).toMatchObject({
      title: '3 × Monitors',
      summary: 'New desks',
      amount: 900,
      currency: 'USD',
    });
  });

  it('decides through the same path as the IT screens', async () => {
    const { ctx } = await itStaff();
    const created = await ItPurchaseRequestModel.create({
      title: 'Monitors',
      justification: 'j',
    });

    await source('IT_PURCHASE').decide(
      { recordId: created._id.toHexString(), decision: 'APPROVED', note: ' ok ' },
      ctx,
    );

    const saved = await ItPurchaseRequestModel.findById(created._id).lean();
    expect(saved).toMatchObject({
      status: 'APPROVED',
      decidedByName: 'Ira Tech',
      decisionNote: 'ok',
    });
  });

  it('refuses a decision from outside IT', async () => {
    const created = await ItChangeModel.create({
      title: 'T',
      description: 'd',
      system: 's',
      status: 'PENDING_APPROVAL',
      plannedStart: new Date(),
      plannedEnd: new Date(Date.now() + HOUR),
    });
    const employee = ctxFor('emp-1', [ROLES.EMPLOYEE]);

    const attempt = source('IT_CHANGE').decide(
      { recordId: created._id.toHexString(), decision: 'APPROVED', note: null },
      employee,
    );

    expect(await codeOf(attempt)).toBe('FORBIDDEN');
    expect((await ItChangeModel.findById(created._id).lean())?.status).toBe('PENDING_APPROVAL');
  });
});
