import { ORGANIZATION_FIELD } from '../../lib/tenant';
import { logger } from '../../utils/logger';
import { CompanyModel } from './company.model';

/**
 * Companies may now have a blank domain (a lead with no working website), which the old unique
 * index on (organization, domain) refused after the first one. Both repairs run once through the
 * runOnce ledger at boot, before the server listens.
 */

interface IndexInfo {
  name?: string;
  key: Record<string, unknown>;
  unique?: boolean;
  partialFilterExpression?: unknown;
}

/** The old index: unique on (organization, domain) ascending, blanks included. */
const isLegacyDomainIndex = (index: IndexInfo) =>
  index.unique === true &&
  index.partialFilterExpression === undefined &&
  Object.keys(index.key).join() === `${ORGANIZATION_FIELD},domain` &&
  index.key.domain === 1;

/**
 * Builds the index that ignores blank domains, then drops the old one — in that order, so the
 * collection is never without a unique guard. Collection-wide, so it runs once as the platform.
 */
export async function allowBlankCompanyDomains(): Promise<void> {
  await CompanyModel.createIndexes();
  const indexes = (await CompanyModel.collection.indexes()) as IndexInfo[];
  const legacy = indexes.find(isLegacyDomainIndex);
  if (legacy?.name) {
    await CompanyModel.collection.dropIndex(legacy.name);
    logger.info(`Company: dropped ${legacy.name}; blank domains are allowed`);
  }
}

/** The domain the lead generator used to invent for a business with no website (RFC 2606). */
const INVENTED_DOMAIN = /\.no-website\.invalid$/;

/**
 * Blanks the domains the lead generator invented for businesses with no website, in one company.
 * Only that reserved `.invalid` suffix matches, so a domain somebody typed is never touched; the
 * import never stored a logo, so there is no favicon to clear. Existing real domains are not
 * visited at boot (one slow request per company): the CRM hides a favicon Google has no icon for.
 */
export async function clearInventedCompanyDomains(): Promise<void> {
  const { modifiedCount } = await CompanyModel.updateMany(
    { domain: INVENTED_DOMAIN },
    { $set: { domain: '' } },
  );
  if (modifiedCount > 0) {
    logger.info(`Company: cleared ${modifiedCount} invented domain(s)`);
  }
}
