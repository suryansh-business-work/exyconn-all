import { complianceResolvers, RiskModel } from '../../src/modules/compliance';
import { objectiveAchievement, riskLevel } from '../../src/modules/compliance/compliance.constants';
import { ROLES } from '../../src/constants/roles';
import { useTestOrganization } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';

useTestOrganization();

const asCompliance: GraphQLContext = {
  user: { id: 'user-1', roles: [ROLES.COMPLIANCE], email: 'qms@exyconn.com' },
};

const asEmployee: GraphQLContext = {
  user: { id: 'user-2', roles: [ROLES.EMPLOYEE], email: 'dev@exyconn.com' },
};

const riskInput = (over: Record<string, unknown> = {}) => ({
  title: 'Laptop theft',
  description: 'A laptop with client data is taken off site.',
  standards: ['ISO_27001'],
  category: 'INFORMATION_SECURITY',
  subject: 'Endpoints',
  ownerId: 'user-1',
  ownerName: 'Asha',
  likelihood: 3,
  impact: 5,
  treatment: 'REDUCE',
  controls: 'Full-disk encryption, remote wipe, asset register.',
  residualLikelihood: 2,
  residualImpact: 2,
  status: 'TREATING',
  identifiedOn: new Date('2026-09-01T00:00:00.000Z'),
  reviewDueOn: new Date('2027-03-01T00:00:00.000Z'),
  ...over,
});

const objectiveInput = (over: Record<string, unknown> = {}) => ({
  title: 'Fewer customer complaints',
  description: 'Quality objective for the year.',
  standards: ['ISO_9001'],
  category: 'QUALITY',
  scope: 'COMPANY',
  area: '',
  ownerId: 'user-1',
  ownerName: 'Asha',
  measure: 'Complaints per 1,000 orders',
  unit: 'per 1k',
  baseline: 20,
  target: 10,
  actual: 15,
  frequency: 'QUARTERLY',
  periodStart: new Date('2026-04-01T00:00:00.000Z'),
  periodEnd: new Date('2027-03-31T00:00:00.000Z'),
  status: 'ON_TRACK',
  plan: 'Root-cause every complaint, monthly review.',
  ...over,
});

const createRisk = (over: Record<string, unknown> = {}) =>
  complianceResolvers.Mutation.createRisk(null, { input: riskInput(over) } as never, asCompliance);

const createObjective = (over: Record<string, unknown> = {}) =>
  complianceResolvers.Mutation.createObjective(
    null,
    { input: objectiveInput(over) } as never,
    asCompliance,
  );

describe('risk rating', () => {
  it('bands a 1-25 rating the same way everywhere it is read', () => {
    expect(riskLevel(25)).toBe('CRITICAL');
    expect(riskLevel(15)).toBe('CRITICAL');
    expect(riskLevel(12)).toBe('HIGH');
    expect(riskLevel(6)).toBe('MEDIUM');
    expect(riskLevel(4)).toBe('LOW');
    expect(riskLevel(1)).toBe('LOW');
  });

  it('is derived from both axes, before and after the controls', () => {
    const risk = { likelihood: 3, impact: 5, residualLikelihood: 2, residualImpact: 2 };

    expect(complianceResolvers.Risk.inherentScore(risk)).toBe(15);
    expect(complianceResolvers.Risk.inherentLevel(risk)).toBe('CRITICAL');
    expect(complianceResolvers.Risk.residualScore(risk)).toBe(4);
    expect(complianceResolvers.Risk.residualLevel(risk)).toBe('LOW');
  });
});

describe('the risk register', () => {
  it('numbers each risk from the company series, without gaps or repeats', async () => {
    const first = (await createRisk()) as { reference: string };
    const second = (await createRisk({ title: 'Supplier outage' })) as { reference: string };

    expect(first.reference).toBe('RISK-0001');
    expect(second.reference).toBe('RISK-0002');
  });

  it('keeps the reference the client sent out of it', async () => {
    const created = (await complianceResolvers.Mutation.createRisk(
      null,
      { input: { ...riskInput(), reference: 'RISK-9999' } } as never,
      asCompliance,
    )) as { reference: string };

    expect(created.reference).toBe('RISK-0001');
  });

  it('is refused to somebody without the compliance role', async () => {
    await expect(
      complianceResolvers.Mutation.createRisk(null, { input: riskInput() } as never, asEmployee),
    ).rejects.toThrow();
    await expect(
      complianceResolvers.Query.listRisks(null, {} as never, asEmployee),
    ).rejects.toThrow();
  });

  it('lists what was filed, with the rating it was filed at', async () => {
    await createRisk();

    const rows = (await complianceResolvers.Query.listRisks(
      null,
      {} as never,
      asCompliance,
    )) as Array<{ title: string; likelihood: number; impact: number }>;

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ title: 'Laptop theft', likelihood: 3, impact: 5 });
    await expect(RiskModel.countDocuments()).resolves.toBe(1);
  });
});

const findingInput = (over: Record<string, unknown> = {}) => ({
  title: 'Access rights were not reviewed',
  description: 'Leavers kept portal access for three weeks.',
  source: 'INTERNAL_AUDIT',
  auditId: '',
  riskId: '',
  standards: ['ISO_27001'],
  category: 'INFORMATION_SECURITY',
  clause: '27001:A.5.18',
  type: 'MINOR_NONCONFORMITY',
  immediateAction: 'Access revoked the same day.',
  rootCause: 'Offboarding had no access step.',
  correctiveAction: 'Access revocation added to the exit checklist.',
  ownerId: 'user-1',
  ownerName: 'Asha',
  raisedOn: new Date('2026-09-02T00:00:00.000Z'),
  dueOn: new Date('2026-10-02T00:00:00.000Z'),
  status: 'ACTION_AGREED',
  verifiedByName: '',
  effectivenessNote: '',
  ...over,
});

const createFinding = (over: Record<string, unknown> = {}) =>
  complianceResolvers.Mutation.createFinding(
    null,
    { input: findingInput(over) } as never,
    asCompliance,
  );

describe('findings and corrective action', () => {
  it('numbers each finding from its own series', async () => {
    const first = (await createFinding()) as { reference: string };
    const second = (await createFinding({ title: 'Calibration overdue' })) as { reference: string };

    expect(first.reference).toBe('NC-0001');
    expect(second.reference).toBe('NC-0002');
  });

  it('refuses to close one whose corrective action was never verified', async () => {
    const finding = (await createFinding()) as { id: string };

    await expect(
      complianceResolvers.Mutation.updateFinding(
        null,
        { id: finding.id, input: findingInput({ status: 'CLOSED' }) } as never,
        asCompliance,
      ),
    ).rejects.toThrow(/verified/i);
  });

  it('closes one that was verified, and says whether it worked', async () => {
    const finding = (await createFinding()) as { id: string };

    const closed = (await complianceResolvers.Mutation.updateFinding(
      null,
      {
        id: finding.id,
        input: findingInput({
          status: 'CLOSED',
          verifiedOn: new Date('2026-11-01T00:00:00.000Z'),
          verifiedByName: 'Ravi',
          effective: true,
          effectivenessNote: 'No leaver kept access in the following two exits.',
          closedOn: new Date('2026-11-01T00:00:00.000Z'),
        }),
      } as never,
      asCompliance,
    )) as { status: string; effective: boolean };

    expect(closed).toMatchObject({ status: 'CLOSED', effective: true });
  });

  it('refuses a finding that arrives already closed without a verification', async () => {
    await expect(createFinding({ status: 'CLOSED' })).rejects.toThrow(/verified/i);
  });

  it('is listed under the audit that raised it', async () => {
    const audit = (await complianceResolvers.Mutation.createInternalAudit(
      null,
      {
        input: {
          title: 'Information security — September',
          kind: 'INTERNAL',
          standards: ['ISO_27001'],
          scope: 'Joiners, movers and leavers',
          criteria: 'ISO 27001:2022 Annex A.5',
          leadAuditorId: 'user-9',
          leadAuditorName: 'Ravi',
          auditeeName: 'IT',
          plannedOn: new Date('2026-09-15T00:00:00.000Z'),
          status: 'REPORTED',
          summary: 'Sampled six leavers.',
          conclusion: 'Conforms apart from one minor nonconformity.',
        },
      } as never,
      asCompliance,
    )) as { id: string; reference: string };

    await createFinding({ auditId: audit.id });
    await createFinding({ title: 'Unrelated', auditId: '' });

    const found = (await complianceResolvers.InternalAudit.findings(audit)) as Array<{
      title: string;
    }>;

    expect(audit.reference).toBe('AUD-0001');
    expect(found.map((row) => row.title)).toEqual(['Access rights were not reviewed']);
  });
});

describe('management review', () => {
  it('counts what the meeting decided and nobody has done yet', () => {
    const review = {
      actions: [
        { description: 'Retrain the team', done: true },
        { description: 'Rewrite the procedure', done: false },
        { description: 'Re-audit in March', done: false },
      ],
    };

    expect(complianceResolvers.ManagementReview.openActionCount(review)).toBe(2);
    expect(complianceResolvers.ManagementReview.openActionCount({})).toBe(0);
  });
});

describe('objective achievement', () => {
  it('measures the distance travelled from the baseline, not the size of the target', () => {
    // Fewer complaints: 20 -> 10, now at 15, so halfway.
    expect(objectiveAchievement(20, 10, 15)).toBe(50);
    // More of something: 60 -> 90, now at 75.
    expect(objectiveAchievement(60, 90, 75)).toBe(50);
  });

  it('is 100 once the target is reached, and never more or less than that', () => {
    expect(objectiveAchievement(20, 10, 8)).toBe(100);
    expect(objectiveAchievement(20, 10, 25)).toBe(0);
    expect(objectiveAchievement(0, 100, 100)).toBe(100);
  });

  it('treats a target that asks for no movement as met when it is held', () => {
    expect(objectiveAchievement(5, 5, 5)).toBe(100);
    expect(objectiveAchievement(5, 5, 4)).toBe(0);
  });

  it('is reported on the objective itself', async () => {
    const objective = (await createObjective()) as {
      baseline: number;
      target: number;
      actual: number;
    };

    expect(complianceResolvers.Objective.achievementPercent(objective)).toBe(50);
  });
});
