import { badRequest, notFound } from '../../utils/errors';
import { cutAtFirst } from '../../utils/textTrim';
import { CmsDesignSystemModel, CmsSiteModel, type CmsSiteDocument } from './models';

/** What Website › Websites saves for a site. */
export interface CmsSiteInput {
  name: string;
  slug: string;
  domains: string[];
  status: 'ACTIVE' | 'DRAFT';
  markets: boolean;
  defaultLocale: string;
  faviconUrl?: string | null;
  seo?: { titleTemplate?: string | null; description?: string | null; ogImageUrl?: string | null };
  headerFragmentId?: string | null;
  footerFragmentId?: string | null;
  designSystemId?: string | null;
  headHtml?: string | null;
  bodyEndHtml?: string | null;
  globalCss?: string | null;
  notFoundPageId?: string | null;
}

const SLUG = /^[a-z\d][a-z\d-]{0,48}[a-z\d]$/;
const HOST =
  /^(?=.{1,253}$)(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.)*[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/;

/** A host name as stored: lower-case, no scheme, port or path. */
export function normalizeHost(value: string): string {
  return cutAtFirst(
    value
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, ''),
    '/:',
  );
}

function siteFields(input: CmsSiteInput) {
  const slug = input.slug.trim().toLowerCase();
  if (!SLUG.test(slug)) {
    badRequest('Use lower-case letters, digits and dashes for the site key.');
  }
  const domains = [...new Set(input.domains.map(normalizeHost).filter(Boolean))];
  const bad = domains.find((domain) => !HOST.test(domain));
  if (bad) {
    badRequest(`"${bad}" is not a valid domain.`);
  }
  return {
    name: input.name.trim(),
    slug,
    domains,
    status: input.status,
    markets: input.markets,
    defaultLocale: input.defaultLocale.trim() || 'en',
    faviconUrl: (input.faviconUrl ?? '').trim(),
    seo: {
      titleTemplate: (input.seo?.titleTemplate ?? '').trim() || '%s',
      description: (input.seo?.description ?? '').trim(),
      ogImageUrl: (input.seo?.ogImageUrl ?? '').trim(),
    },
    headerFragmentId: input.headerFragmentId ?? '',
    footerFragmentId: input.footerFragmentId ?? '',
    designSystemId: input.designSystemId ?? '',
    headHtml: input.headHtml ?? '',
    bodyEndHtml: input.bodyEndHtml ?? '',
    globalCss: input.globalCss ?? '',
    notFoundPageId: input.notFoundPageId ?? '',
  };
}

/** A domain answers for one site only. */
async function assertDomainsFree(domains: string[], exceptId?: string): Promise<void> {
  const clash = await CmsSiteModel.findOne({
    domains: { $in: domains },
    ...(exceptId ? { _id: { $ne: exceptId } } : {}),
  })
    .select('name domains')
    .lean();
  if (clash) {
    const taken = domains.find((domain) => clash.domains.includes(domain));
    badRequest(`${taken} already belongs to ${clash.name}.`);
  }
}

export const cmsSites = {
  list: () => CmsSiteModel.find().sort({ isDefault: -1, name: 1 }).lean(),

  async get(id: string) {
    const site = await CmsSiteModel.findById(id).lean();
    if (!site) notFound('Website');
    return site;
  },

  async bySlug(slug: string) {
    const site = await CmsSiteModel.findOne({ slug: slug.toLowerCase() }).lean();
    if (!site) notFound('Website');
    return site;
  },

  /** A new site starts with its own design system, so it can be styled straight away. */
  async create(input: CmsSiteInput) {
    const fields = siteFields(input);
    await assertDomainsFree(fields.domains);
    if (await CmsSiteModel.exists({ slug: fields.slug })) {
      badRequest('Another website already uses this key.');
    }
    const site = await CmsSiteModel.create({ ...fields, isDefault: false });
    if (!fields.designSystemId) {
      const design = await CmsDesignSystemModel.create({
        siteId: String(site._id),
        name: `${fields.name} design system`,
        tokens: {},
      });
      site.designSystemId = String(design._id);
      await site.save();
    }
    return site.toObject();
  },

  async update(id: string, input: CmsSiteInput) {
    const fields = siteFields(input);
    await assertDomainsFree(fields.domains, id);
    if (await CmsSiteModel.exists({ slug: fields.slug, _id: { $ne: id } })) {
      badRequest('Another website already uses this key.');
    }
    const site = await CmsSiteModel.findByIdAndUpdate(id, fields, { new: true }).lean();
    if (!site) notFound('Website');
    return site;
  },

  /** Makes this the site unknown hosts (localhost) are served as. */
  async setDefault(id: string) {
    const site = await CmsSiteModel.findById(id).select('_id').lean();
    if (!site) notFound('Website');
    await CmsSiteModel.updateMany({ _id: { $ne: id } }, { isDefault: false });
    return CmsSiteModel.findByIdAndUpdate(id, { isDefault: true }, { new: true }).lean();
  },

  async remove(id: string) {
    const site = await CmsSiteModel.findById(id).select('isDefault').lean();
    if (!site) notFound('Website');
    if (site.isDefault) {
      badRequest('Make another website the default before deleting this one.');
    }
    await CmsSiteModel.deleteOne({ _id: id });
    return true;
  },
};

/** The site a request for `host` is served as: the one claiming the host, else the default. */
export async function siteForHost(host: string): Promise<CmsSiteDocument & { _id: unknown }> {
  const name = normalizeHost(host);
  const claimed = name
    ? await CmsSiteModel.findOne({ domains: name, status: 'ACTIVE' }).lean()
    : null;
  const site = claimed ?? (await CmsSiteModel.findOne({ isDefault: true }).lean());
  if (!site) notFound('Website');
  return site;
}

/** The default site's id, or '' before the first site exists. */
export async function defaultSiteId(): Promise<string> {
  const site = await CmsSiteModel.findOne({ isDefault: true }).select('_id').lean();
  return site ? String(site._id) : '';
}

/**
 * The siteId values that belong to a site, for filtering website records: the default site
 * also owns records filed before (or without) a site.
 */
export async function siteIdsFor(slug: string | null | undefined): Promise<string[]> {
  const [id, fallback] = await Promise.all([siteIdFor(slug), defaultSiteId()]);
  return id !== '' && id === fallback ? [id, ''] : [id];
}

/** A site id from a slug (public queries name sites by slug), defaulting to the default site. */
export async function siteIdFor(slug: string | null | undefined): Promise<string> {
  if (!slug) {
    return defaultSiteId();
  }
  const site = await CmsSiteModel.findOne({ slug: slug.toLowerCase() }).select('_id').lean();
  return site ? String(site._id) : '';
}
