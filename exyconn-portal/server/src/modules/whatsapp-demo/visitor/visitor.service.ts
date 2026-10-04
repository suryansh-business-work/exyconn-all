import { runForOrganization } from '../../../lib/tenant';
import { platformOperatorOrganizationId } from '../../../lib/platformAccess';
import { notFound } from '../../../utils/errors';
import { tableQuery, tableStats, type TableQueryInput } from '../../../utils/tableQuery';
import { withId, withIds } from '../../../utils/serialize';
import { WhatsappDemoVisitorModel } from './visitor.model';
import { readVisitorPass } from './visitor.token';

/** A signed-in demo visitor, as a request knows them. */
export interface DemoVisitor {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  /** The company the demos belong to — every query the visitor makes is confined to it. */
  organizationId: string;
}

export const VISITOR_TABLE = {
  searchFields: ['name', 'email', 'company', 'phone'],
  filterFields: ['source', 'blocked'],
  sortFields: ['name', 'email', 'company', 'createdAt', 'lastSignInAt', 'signInCount'],
  defaultSort: { field: 'createdAt', dir: 'DESC' as const },
};

/**
 * The visitor a pass belongs to, or null when the pass is forged, retired (blocked, or its
 * token version raised) or the visitor has been deleted.
 */
export async function visitorForPass(token: string): Promise<DemoVisitor | null> {
  const claims = readVisitorPass(token);
  const organizationId = claims ? await platformOperatorOrganizationId() : null;
  if (!claims || organizationId === null) {
    return null;
  }
  const visitor = await runForOrganization(organizationId, () =>
    WhatsappDemoVisitorModel.findById(claims.vid).lean(),
  );
  if (!visitor || visitor.blocked || visitor.tokenVersion !== claims.tv) {
    return null;
  }
  return {
    id: String(visitor._id),
    name: visitor.name,
    email: visitor.email,
    phone: visitor.phone,
    company: visitor.company,
    organizationId,
  };
}

/** One visitor, read in the scope the caller entered (the demo owner's company). */
export async function getVisitor(id: string) {
  const visitor = await WhatsappDemoVisitorModel.findById(id).lean();
  if (!visitor) notFound('Visitor');
  return withId(visitor);
}

/** Website › WhatsApp Leads: every visitor, newest first, in the caller's (the operator's) scope. */
export async function listVisitors(input: TableQueryInput) {
  const page = await tableQuery(WhatsappDemoVisitorModel, input, VISITOR_TABLE);
  return { rows: withIds(page.rows as Array<{ _id: unknown }>), totalCount: page.totalCount };
}

/** The leads page's cards: how many, from where, and how many are switched off. */
export function visitorStats() {
  return tableStats(WhatsappDemoVisitorModel, { countBy: ['source', 'blocked'] });
}

/** Blocking retires the visitor's pass at once; unblocking lets them sign in with a new code. */
export async function setVisitorBlocked(id: string, blocked: boolean) {
  const visitor = await WhatsappDemoVisitorModel.findByIdAndUpdate(
    id,
    blocked ? { blocked, $inc: { tokenVersion: 1 } } : { blocked },
    { new: true },
  ).lean();
  if (!visitor) notFound('Visitor');
  return withId(visitor);
}

export async function deleteVisitor(id: string): Promise<boolean> {
  const result = await WhatsappDemoVisitorModel.deleteOne({ _id: id });
  if (result.deletedCount === 0) notFound('Visitor');
  return true;
}
