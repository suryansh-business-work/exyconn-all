import { complianceDashboardResolvers } from '../../src/modules/compliance/compliance.dashboard';
import { findingResolvers } from '../../src/modules/compliance/finding.resolvers';
import { RiskModel } from '../../src/modules/compliance/risk.model';
import { FindingModel } from '../../src/modules/compliance/finding.model';
import { InternalAuditModel } from '../../src/modules/compliance/audit.model';
import { ObjectiveModel } from '../../src/modules/compliance/objective.model';
import { ManagementReviewModel } from '../../src/modules/compliance/review.model';
import { ROLES } from '../../src/constants/roles';
import { useTestOrganization } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';

const DAY = 86_400_000;
const officer: GraphQLContext = {
  user: { id: 'u1', roles: [ROLES.COMPLIANCE], email: 'meera@exyconn.com' },
};
const overview = () => complianceDashboardResolvers.Query.complianceOverview(null, null, officer);

const risk = (overrides: Record<string, unknown> = {}) =>
  RiskModel.create({
    reference: `RISK-${Math.random().toString().slice(2, 6)}`,
    title: 'A risk',
    category: 'OPERATIONAL',
    ownerId: 'u1',
    ownerName: 'Meera Iyer',
    status: 'TREATING',
    treatment: 'REDUCE',
    identifiedOn: new Date(),
    likelihood: 4,
    impact: 4,
    residualLikelihood: 2,
    residualImpact: 2,
    ...overrides,
  });

const finding = (overrides: Record<string, unknown> = {}) =>
  FindingModel.create({
    reference: `NC-${Math.random().toString().slice(2, 6)}`,
    title: 'A finding',
    source: 'INTERNAL_AUDIT',
    type: 'MINOR_NONCONFORMITY',
    category: 'QUALITY',
    ownerId: 'u1',
    ownerName: 'Meera Iyer',
    raisedOn: new Date(),
    status: 'OPEN',
    ...overrides,
  });

describe('the compliance overview', () => {
  useTestOrganization();

  it('counts what is open and what is late', async () => {
    await risk();
    await risk({ status: 'CLOSED' });
    await risk({ reviewDueOn: new Date(Date.now() - DAY) });
    await finding();
    await finding({ dueOn: new Date(Date.now() - 2 * DAY) });
    await finding({ status: 'CLOSED', dueOn: new Date(Date.now() - 30 * DAY) });

    const result = await overview();

    expect(result).toMatchObject({
      risks: 3,
      openRisks: 2,
      risksPastReview: 1,
      findings: 3,
      openFindings: 2,
      findingsOverdue: 1,
    });
  });

  it('bands open risks by what is left after the controls', async () => {
    // Inherent 25, residual 4 — a risk with controls that work reads as LOW, not CRITICAL.
    await risk({ likelihood: 5, impact: 5, residualLikelihood: 2, residualImpact: 2 });
    await risk({ residualLikelihood: 5, residualImpact: 5 });

    const { residualHeat } = await overview();

    const banded = [...residualHeat].sort((a, b) => a.label.localeCompare(b.label));

    expect(banded).toEqual([
      { label: 'CRITICAL', value: 1 },
      { label: 'LOW', value: 1 },
    ]);
  });

  it('names a standard with no audit behind it in the last year', async () => {
    await InternalAuditModel.create({
      reference: 'AUD-0001',
      title: 'Information security audit',
      kind: 'INTERNAL',
      standards: ['ISO_27001'],
      scope: 'The ISMS',
      criteria: 'ISO/IEC 27001:2022',
      leadAuditorName: 'Dev Shah',
      auditeeName: 'Engineering',
      plannedOn: new Date(Date.now() - 40 * DAY),
      performedOn: new Date(Date.now() - 30 * DAY),
      status: 'REPORTED',
    });
    await InternalAuditModel.create({
      reference: 'AUD-0002',
      title: 'Old quality audit',
      kind: 'INTERNAL',
      standards: ['ISO_9001'],
      scope: 'QMS',
      criteria: 'ISO 9001:2015',
      leadAuditorName: 'Dev Shah',
      auditeeName: 'Operations',
      plannedOn: new Date(Date.now() - 800 * DAY),
      performedOn: new Date(Date.now() - 800 * DAY),
      status: 'CLOSED',
    });

    const { standardCoverage } = await overview();
    const audited = standardCoverage.filter((row) => row.value > 0).map((row) => row.label);
    const never = standardCoverage.filter((row) => row.value === 0).map((row) => row.label);

    expect(audited).toEqual(['ISO_27001']);
    // A year-old audit does not count as coverage, which is the point of the window.
    expect(never).toContain('ISO_9001');
  });

  it('says when leadership last met, and when they never have', async () => {
    expect(await overview()).toMatchObject({ lastReviewOn: null, lastReviewTitle: '' });

    await ManagementReviewModel.create({
      reference: 'MR-0001',
      title: 'Q3 management review',
      heldOn: new Date(Date.now() - 10 * DAY),
      status: 'MINUTED',
      attendees: 'The board',
      inputs: 'Everything',
      decisions: 'Carry on',
    });
    await ObjectiveModel.create({
      title: 'Cut incidents',
      scope: 'COMPANY',
      category: 'QUALITY',
      measure: 'Incidents per quarter',
      unit: 'count',
      baseline: 10,
      target: 4,
      actual: 9,
      frequency: 'QUARTERLY',
      status: 'AT_RISK',
      periodStart: new Date(Date.now() - 60 * DAY),
      periodEnd: new Date(Date.now() + 30 * DAY),
      ownerId: 'u1',
      ownerName: 'Meera Iyer',
    });

    const result = await overview();

    expect(result.lastReviewTitle).toBe('Q3 management review');
    expect(result.objectivesAtRisk).toBe(1);
  });

  it('is compliance only', async () => {
    await expect(
      complianceDashboardResolvers.Query.complianceOverview(null, null, {
        user: { id: 'u2', roles: [ROLES.EMPLOYEE], email: 'nobody@exyconn.com' },
      }),
    ).rejects.toThrow();
  });
});

describe('evidence on a finding', () => {
  useTestOrganization();

  it('stamps who attached it and when, whatever the client sent', async () => {
    const created = (await findingResolvers.Mutation.createFinding(
      null,
      {
        input: {
          title: 'Access review not evidenced',
          description: '',
          source: 'INTERNAL_AUDIT',
          auditId: '',
          riskId: '',
          standards: ['ISO_27001'],
          category: 'INFORMATION_SECURITY',
          clause: '27001:A.5.15',
          type: 'MINOR_NONCONFORMITY',
          immediateAction: '',
          rootCause: '',
          correctiveAction: '',
          ownerId: 'u1',
          ownerName: 'Meera Iyer',
          raisedOn: new Date(),
          status: 'OPEN',
          evidence: [
            {
              url: 'https://cdn.example.com/review.pdf',
              name: 'review.pdf',
              contentType: 'application/pdf',
            },
          ],
        },
      } as never,
      officer,
    )) as { id: string };

    const stored = await FindingModel.findById(created.id).lean();

    expect(stored?.evidence).toHaveLength(1);
    expect(stored?.evidence[0]).toMatchObject({
      url: 'https://cdn.example.com/review.pdf',
      name: 'review.pdf',
      uploadedBy: 'meera@exyconn.com',
    });
    expect(stored?.evidence[0].uploadedAt).toBeInstanceOf(Date);
  });

  it('reads as an empty list on a finding raised before evidence existed', () => {
    expect(findingResolvers.Finding.evidence({})).toEqual([]);
  });
});
