import type { Model } from 'mongoose';
import { ROLES } from '../../constants/roles';
import { companyProfile } from '../../lib/company';
import { assertPermission } from '../../lib/permissions';
import type { GraphQLContext } from '../../middleware/auth';
import type { ApprovalSource, DecideArgs } from '../approvals/approvals.types';
import { ItAccessRequestModel, ItChangeModel, ItPurchaseRequestModel } from './models';
import { decideRecord, type DecidableRecord, type DecisionSpec } from './decision';
import { ACCESS_AWAITING, ACCESS_MODULE, accessDecision } from './access';
import { CHANGE_AWAITING, CHANGE_MODULE, changeDecision } from './changes';
import { PURCHASE_AWAITING, PURCHASE_MODULE, purchaseDecision } from './purchases';

/**
 * IT's three decisions, lent to the shared approvals queue. Deciding from the queue runs the
 * same `decideRecord` the IT screens use, so there is one way an IT approval happens.
 */
const NEWEST_FIRST = { createdAt: -1 } as const;
const itOnly = [ROLES.IT];

/** The queue's decide callback for one IT workflow. */
function decider(model: Model<DecidableRecord>, module: string, spec: DecisionSpec) {
  return async (args: DecideArgs, ctx: GraphQLContext) => {
    await assertPermission(ctx, module, itOnly, 'APPROVE');
    await decideRecord(model, spec, { id: args.recordId, ...args }, ctx);
  };
}

const accessSource: ApprovalSource = {
  kind: 'IT_ACCESS',
  label: 'IT Access Request',
  module: ACCESS_MODULE,
  roles: itOnly,
  managerMayDecide: false,
  link: '/it/access',
  async pending() {
    const rows = await ItAccessRequestModel.find({ status: { $in: [...ACCESS_AWAITING] } })
      .sort(NEWEST_FIRST)
      .lean();
    return rows.map((row) => ({
      recordId: String(row._id),
      title: `${row.kind.toLowerCase().replaceAll('_', ' ')} — ${row.application} for ${row.employeeName}`,
      summary: row.reason,
      requestedById: row.requestedById || row.employeeId,
      requestedAt: row.createdAt,
      amount: null,
      currency: null,
    }));
  },
  decide: decider(
    ItAccessRequestModel as unknown as Model<DecidableRecord>,
    ACCESS_MODULE,
    accessDecision,
  ),
};

const changeSource: ApprovalSource = {
  kind: 'IT_CHANGE',
  label: 'IT Change',
  module: CHANGE_MODULE,
  roles: itOnly,
  managerMayDecide: false,
  link: '/it/changes',
  async pending() {
    const rows = await ItChangeModel.find({ status: { $in: [...CHANGE_AWAITING] } })
      .sort(NEWEST_FIRST)
      .lean();
    return rows.map((row) => ({
      recordId: String(row._id),
      title: `${row.title} (${row.environment.toLowerCase()}, ${row.risk.toLowerCase()} risk)`,
      summary: row.description,
      requestedById: row.requestedById,
      requestedAt: row.createdAt,
      amount: null,
      currency: null,
    }));
  },
  decide: decider(
    ItChangeModel as unknown as Model<DecidableRecord>,
    CHANGE_MODULE,
    changeDecision,
  ),
};

const purchaseSource: ApprovalSource = {
  kind: 'IT_PURCHASE',
  label: 'IT Purchase Request',
  module: PURCHASE_MODULE,
  roles: itOnly,
  managerMayDecide: false,
  link: '/it/procurement',
  async pending() {
    const rows = await ItPurchaseRequestModel.find({ status: { $in: [...PURCHASE_AWAITING] } })
      .sort(NEWEST_FIRST)
      .lean();
    if (rows.length === 0) {
      return [];
    }
    // Only read the company's currency when there is an amount to label with it.
    const company = await companyProfile();
    return rows.map((row) => ({
      recordId: String(row._id),
      title: `${row.quantity} × ${row.title}`,
      summary: row.justification,
      requestedById: row.requestedById,
      requestedAt: row.createdAt,
      amount: row.estimatedCost,
      currency: company.currency,
    }));
  },
  decide: decider(
    ItPurchaseRequestModel as unknown as Model<DecidableRecord>,
    PURCHASE_MODULE,
    purchaseDecision,
  ),
};

export const IT_APPROVAL_SOURCES: ApprovalSource[] = [accessSource, changeSource, purchaseSource];
