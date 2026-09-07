import { LeadModel } from './crm.model';
import { CompanyModel } from './company.model';
import { ContactModel } from './contact.model';
import { DealModel } from './deal.model';
import { assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { withId } from '../../utils/serialize';
import { badRequest, notFound } from '../../utils/errors';
import type { GraphQLContext } from '../../middleware/auth';

export interface ConvertLeadInput {
  companyName: string;
  dealTitle: string;
  value: number;
  expectedCloseDate?: Date | null;
  contactName?: string | null;
  contactEmail?: string | null;
}

/** Matches names regardless of case, so "acme ltd" reuses "Acme Ltd" rather than duplicating it. */
const CASE_INSENSITIVE = { locale: 'en', strength: 2 } as const;

/** The part after the @, which is the company domain the CRM keys accounts by. */
const domainOf = (email: string): string => email.slice(email.indexOf('@') + 1).toLowerCase();

/**
 * The account the lead belongs to. Looked up by name first; failing that by the domain
 * the lead wrote from, because `domain` is unique and creating a second row on it would
 * be refused anyway. Only when neither exists is a company created.
 */
async function findOrCreateCompany(name: string, leadEmail: string, owner: string) {
  const byName = await CompanyModel.findOne({ name: name.trim() })
    .collation(CASE_INSENSITIVE)
    .lean();
  if (byName) {
    return byName;
  }
  const domain = domainOf(leadEmail);
  const byDomain = await CompanyModel.findOne({ domain }).lean();
  if (byDomain) {
    return byDomain;
  }
  const created = await CompanyModel.create({ name: name.trim(), domain, owner });
  return created.toObject();
}

/** The person at the account, reused when that address is already filed under it. */
async function findOrCreateContact(
  company: { _id: unknown; name: string },
  person: { name: string; email: string; owner: string },
) {
  const companyId = String(company._id);
  const email = person.email.toLowerCase();
  const existing = await ContactModel.findOne({ companyId, email }).lean();
  if (existing) {
    return existing;
  }
  const created = await ContactModel.create({
    name: person.name,
    email,
    companyId,
    companyName: company.name,
    status: 'ACTIVE',
    owner: person.owner,
  });
  return created.toObject();
}

/**
 * Converting a lead is the hand-off from prospecting to selling: the lead is marked
 * won and everything the pipeline needs — account, person, opportunity — exists after
 * one call. It runs once per lead; a second conversion would create a second deal for
 * the same opportunity.
 */
export const convertLead = async (
  _p: unknown,
  { id, input }: { id: string; input: ConvertLeadInput },
  ctx: GraphQLContext,
) => {
  assertRole(ctx, [ROLES.CRM]);
  const lead = await LeadModel.findById(id);
  if (!lead) {
    notFound('Lead');
  }
  if (lead.convertedDealId) {
    badRequest(`Lead "${lead.name}" has already been converted to a deal.`);
  }

  const company = await findOrCreateCompany(input.companyName, lead.email, lead.owner);
  const contact = await findOrCreateContact(company, {
    name: input.contactName?.trim() || lead.name,
    email: input.contactEmail?.trim() || lead.email,
    owner: lead.owner,
  });
  const deal = await DealModel.create({
    title: input.dealTitle,
    companyId: String(company._id),
    companyName: company.name,
    contactId: String(contact._id),
    contactName: contact.name,
    stage: 'QUALIFYING',
    value: input.value,
    expectedCloseDate: input.expectedCloseDate ?? null,
    owner: lead.owner,
    notes: lead.notes,
  });

  lead.stage = 'WON';
  lead.convertedDealId = String(deal._id);
  await lead.save();

  return withId(deal.toObject());
};
