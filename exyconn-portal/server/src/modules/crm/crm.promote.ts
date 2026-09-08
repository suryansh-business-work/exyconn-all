import { CompanyModel, type CompanyDocument } from './company.model';
import { ContactModel } from './contact.model';
import { ClientModel } from '../clients/clients.model';
import { assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { withId } from '../../utils/serialize';
import { badRequest, notFound } from '../../utils/errors';
import type { GraphQLContext } from '../../middleware/auth';

/** What a deal says about who to bill, when it is won. */
interface WonDeal {
  companyId?: string | null;
  contactId?: string | null;
  title: string;
}

/** A company row as `.lean()` returns it. */
type CompanyRow = CompanyDocument & { _id: unknown };

/**
 * The person the client record is addressed to: the deal's own contact when it names
 * one, else the first still-active person at the account.
 */
async function billingContact(company: CompanyRow, contactId: string | null | undefined) {
  if (contactId) {
    const named = await ContactModel.findById(contactId).select('email phone').lean();
    if (named) {
      return named;
    }
  }
  return ContactModel.findOne({ companyId: String(company._id), status: 'ACTIVE' })
    .sort({ createdAt: 1 })
    .select('email phone')
    .lean();
}

/**
 * The client record an account becomes, created once and reused for every later win.
 *
 * A client must have an email — it is where invoices go — so an account with no contact
 * on file is refused rather than filed with a blank address. The domain is the fallback:
 * `unknown@acme.com` reaches somebody's inbox, an empty string reaches nobody.
 */
export async function ensureClient(
  company: CompanyRow,
  contactId?: string | null,
): Promise<string> {
  if (company.clientId) {
    return company.clientId;
  }
  const contact = await billingContact(company, contactId);
  const email = contact?.email || (company.domain ? `unknown@${company.domain}` : '');
  if (!email) {
    badRequest(
      `"${company.name}" has no contact with an email address. Add one before making it a client.`,
    );
  }
  const client = await ClientModel.create({
    name: company.name,
    company: company.name,
    email,
    phone: company.phone || contact?.phone || '',
    status: 'ACTIVE',
  });
  const clientId = String(client._id);
  await CompanyModel.updateOne({ _id: company._id }, { clientId });
  return clientId;
}

/**
 * The client a won deal bills. A deal with no account cannot become one — there is
 * nothing to bill — and is refused with what to fix.
 */
export async function clientForDeal(deal: WonDeal): Promise<string> {
  if (!deal.companyId) {
    badRequest(`Deal "${deal.title}" has no company. Set one before marking it won.`);
  }
  const company = await CompanyModel.findById(deal.companyId).lean();
  if (!company) {
    notFound('Company');
  }
  return ensureClient(company, deal.contactId);
}

/** The row action on the companies grid: the same hand-off, without a deal. */
export async function promoteCompanyToClient(
  _p: unknown,
  { id }: { id: string },
  ctx: GraphQLContext,
) {
  assertRole(ctx, [ROLES.CRM]);
  const company = await CompanyModel.findById(id).lean();
  if (!company) {
    notFound('Company');
  }
  await ensureClient(company);
  const updated = await CompanyModel.findById(id).lean();
  if (!updated) {
    notFound('Company');
  }
  return withId(updated);
}
