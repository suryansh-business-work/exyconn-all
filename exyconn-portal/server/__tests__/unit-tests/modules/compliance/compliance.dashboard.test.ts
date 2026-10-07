import { Types } from 'mongoose';
import { complianceDashboardResolvers } from '../../../../src/modules/compliance/compliance.dashboard';
import { RiskModel } from '../../../../src/modules/compliance/risk.model';
import { FindingModel } from '../../../../src/modules/compliance/finding.model';
import { InternalAuditModel } from '../../../../src/modules/compliance/audit.model';
import { ManagementReviewModel } from '../../../../src/modules/compliance/review.model';
import { ROLES } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';
import type { GraphQLContext } from '../../../../src/middleware/auth';

const DAY = 86_400_000;
const organizationId = useTestOrganization();
const officer: GraphQLContext = {
  user: { id: 'u1', roles: [ROLES.COMPLIANCE], email: 'meera@exyconn.com' },
};
const overview = () => complianceDashboardResolvers.Query.complianceOverview(null, null, officer);
const ownOrganization = () => new Types.ObjectId(organizationId);

let serial = 0;
const finding = (type: string) => {
  serial += 1;
  return FindingModel.create({
    reference: `NC-${serial}`,
    title: 'A finding',
    category: 'QUALITY',
    type,
    raisedOn: new Date(),
  });
};

const audit = (reference: string, status: string) =>
  InternalAuditModel.create({
    reference,
    title: 'Audit',
    scope: 'The ISMS',
    standards: ['ISO_14001'],
    plannedOn: new Date(Date.now() - 20 * DAY),
    performedOn: new Date(Date.now() - 10 * DAY),
    status,
  });

describe('the compliance overview breakdowns', () => {
  it('groups risks without a stored status under UNSET', async () => {
    // A row written before status was required: the raw collection skips the schema default.
    await RiskModel.collection.insertOne({
      reference: 'RISK-LEGACY',
      title: 'Legacy risk',
      category: 'OPERATIONAL',
      likelihood: 2,
      impact: 2,
      residualLikelihood: 1,
      residualImpact: 1,
      identifiedOn: new Date(),
      organizationId: ownOrganization(),
    });

    const result = await overview();

    expect(result.risksByStatus).toEqual([{ label: 'UNSET', value: 1 }]);
    expect(result.openRisks).toBe(1);
    expect(result.residualHeat).toEqual([{ label: 'LOW', value: 1 }]);
  });

  it('orders the finding types from the most common down', async () => {
    await finding('OBSERVATION');
    await finding('MINOR_NONCONFORMITY');
    await finding('MINOR_NONCONFORMITY');

    const { findingsByType, findings, openFindings } = await overview();

    expect(findingsByType).toEqual([
      { label: 'MINOR_NONCONFORMITY', value: 2 },
      { label: 'OBSERVATION', value: 1 },
    ]);
    expect(findings).toBe(3);
    expect(openFindings).toBe(3);
  });

  it('counts audits, and the ones still only planned', async () => {
    await audit('AUD-1', 'PLANNED');
    await audit('AUD-2', 'REPORTED');

    const result = await overview();

    expect(result).toMatchObject({ audits: 2, auditsPlanned: 1 });
    // Only the reported audit is evidence; the planned one has not happened.
    expect(result.standardCoverage).toContainEqual({ label: 'ISO_14001', value: 1 });
  });

  it('covers no standard from a reported audit that names none', async () => {
    await InternalAuditModel.collection.insertOne({
      reference: 'AUD-LEGACY',
      title: 'Audit before standards were recorded',
      scope: 'Everything',
      plannedOn: new Date(Date.now() - 20 * DAY),
      performedOn: new Date(Date.now() - 10 * DAY),
      status: 'REPORTED',
      organizationId: ownOrganization(),
    });

    const { standardCoverage } = await overview();

    expect(standardCoverage.every((row) => row.value === 0)).toBe(true);
    expect(standardCoverage).toHaveLength(4);
  });

  it('reads the last meeting actually held, not one only planned', async () => {
    await ManagementReviewModel.create({
      reference: 'MR-0001',
      title: 'Half-year review',
      heldOn: new Date(Date.now() - 30 * DAY),
      status: 'HELD',
    });
    await ManagementReviewModel.create({
      reference: 'MR-0002',
      title: 'Next review',
      heldOn: new Date(Date.now() + 30 * DAY),
      status: 'PLANNED',
    });

    const result = await overview();

    expect(result.reviews).toBe(2);
    expect(result.lastReviewTitle).toBe('Half-year review');
    expect(result.lastReviewOn).toBeInstanceOf(Date);
  });

  it('reads an empty register as zeros and empty charts', async () => {
    const result = await overview();

    expect(result).toMatchObject({
      risks: 0,
      findings: 0,
      audits: 0,
      objectives: 0,
      objectivesAtRisk: 0,
      risksByStatus: [],
      findingsByType: [],
      residualHeat: [],
    });
  });
});
