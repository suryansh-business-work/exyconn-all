import { assertPermission } from '../../lib/permissions';
import { ROLES } from '../../constants/roles';
import { badRequest, notFound } from '../../utils/errors';
import type { GraphQLContext } from '../../middleware/auth';
import { CompanyModel } from './company.model';
import { ContactModel } from './contact.model';

const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 40;

/** Trimmed, de-duplicated without regard to case, and within the limits. */
function checkedTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const raw of tags) {
    const tag = raw.trim();
    const key = tag.toLowerCase();
    if (tag && !seen.has(key)) {
      seen.add(key);
      kept.push(tag);
    }
  }
  if (kept.length > MAX_TAGS || kept.some((tag) => tag.length > MAX_TAG_LENGTH)) {
    badRequest(`Use up to ${MAX_TAGS} tags of at most ${MAX_TAG_LENGTH} characters each.`);
  }
  return kept;
}

type TagObject = 'COMPANY' | 'CONTACT';
const crmRoles = [ROLES.CRM];

/** Replaces a record's tags; the one field changes, so an edit in the form is never overwritten. */
async function setCrmTags(
  _p: unknown,
  { object, id, tags }: { object: TagObject; id: string; tags: string[] },
  ctx: GraphQLContext,
) {
  const kept = checkedTags(tags);
  if (object === 'COMPANY') {
    await assertPermission(ctx, 'Company', crmRoles, 'EDIT');
    const doc = await CompanyModel.findByIdAndUpdate(id, { tags: kept }, { new: true }).lean();
    if (!doc) notFound('Company');
    return doc.tags;
  }
  await assertPermission(ctx, 'Contact', crmRoles, 'EDIT');
  const doc = await ContactModel.findByIdAndUpdate(id, { tags: kept }, { new: true }).lean();
  if (!doc) notFound('Contact');
  return doc.tags;
}

/** Every tag in use on one kind of record, for the picker's suggestions and the list filter. */
async function crmTags(_p: unknown, { object }: { object: TagObject }, ctx: GraphQLContext) {
  const model = object === 'COMPANY' ? CompanyModel : ContactModel;
  await assertPermission(ctx, object === 'COMPANY' ? 'Company' : 'Contact', crmRoles, 'VIEW');
  const tags: string[] = await (model as typeof CompanyModel).distinct('tags');
  return [...tags.filter(Boolean)].sort((a, b) => a.localeCompare(b));
}

const recordResolvers = {
  tags: (row: { tags?: string[] | null }) => row.tags ?? [],
};

export const crmTagResolvers = {
  Company: recordResolvers,
  Contact: recordResolvers,
  Query: { crmTags },
  Mutation: { setCrmTags },
};
