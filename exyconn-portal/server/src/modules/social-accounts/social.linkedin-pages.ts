import type { Types } from 'mongoose';
import { recordSystemAudit } from '../audit';
import { logger } from '../../utils/logger';
import { LINKEDIN_HEADERS, LINKEDIN_PAGE_SCOPES, LINKEDIN_REST } from './social.constants';
import { SocialProviderError, getJson } from './social.http';
import { SocialAccountModel } from './social.models';
import { list, str } from './networks/network.types';

/** The scope that lets a connection list the pages its member administers. */
export const PAGES_SCOPE = 'r_organization_admin';
const FORBIDDEN = 403;
const ORGANIZATION_URN = 'urn:li:organization:';

/** A company page as it is saved: one social account of its own. */
interface Page {
  externalId: string;
  name: string;
  handle: string;
  avatarUrl: string;
}

/** The member's LinkedIn account a set of pages is reached through. */
export interface PageOwner {
  _id: Types.ObjectId;
  scopes?: string[] | null;
  connectedBy: string;
}

const linkedinGet = (path: string, token: string) =>
  getJson('LinkedIn', `${LINKEDIN_REST}/${path}`, token, LINKEDIN_HEADERS);

/** The ids of the organizations the member is an approved administrator of. */
async function administeredIds(token: string): Promise<string[]> {
  const body = await linkedinGet(
    'organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&count=100',
    token,
  );
  return list(body.elements)
    .map((acl) => str(acl.organization).replace(ORGANIZATION_URN, ''))
    .filter(Boolean);
}

/**
 * A page's logo. LinkedIn names it as a media asset; the Images API turns that into a URL.
 * A logo LinkedIn will not hand over leaves the avatar empty — the page still connects.
 */
async function logoOf(asset: string, token: string): Promise<string> {
  if (asset === '') return '';
  const image = asset.replace('urn:li:digitalmediaAsset:', 'urn:li:image:');
  try {
    return str((await linkedinGet(`images/${encodeURIComponent(image)}`, token)).downloadUrl);
  } catch (error) {
    logger.warn({ err: error }, 'A LinkedIn page logo could not be read');
    return '';
  }
}

async function pageOf(id: string, token: string): Promise<Page> {
  const org = await linkedinGet(`organizations/${encodeURIComponent(id)}`, token);
  const logo = (org.logoV2 ?? {}) as Record<string, unknown>;
  return {
    externalId: id,
    name: str(org.localizedName),
    handle: str(org.vanityName),
    avatarUrl: await logoOf(str(logo.original), token),
  };
}

/** Pages this owner reached before that it no longer does: marked disconnected, and logged. */
async function markLost(ownerId: string, kept: string[]): Promise<void> {
  const lost = await SocialAccountModel.find({
    tokenAccountId: ownerId,
    externalId: { $nin: kept },
    disconnectedAt: null,
  })
    .select('name')
    .lean();
  if (lost.length === 0) return;
  await SocialAccountModel.updateMany(
    { _id: { $in: lost.map((page) => page._id) } },
    { $set: { disconnectedAt: new Date() } },
  );
  await Promise.all(
    lost.map((page) =>
      recordSystemAudit({
        action: 'UPDATE',
        module: 'SocialAccount',
        entityId: page._id,
        entityLabel: page.name,
        summary: `LinkedIn page ${page.name} disconnected: its member no longer administers it`,
      }),
    ),
  );
}

/**
 * Saves one account per LinkedIn page the member administers, beside the member's own. Each
 * acts through the member's token (stored once, on the member's account). Pages the member
 * no longer administers are marked disconnected; one administered again is reconnected.
 * A connection without the page scopes has no pages to read; a 403 means LinkedIn no longer
 * grants them, so the scopes are dropped and the member's row asks for a reconnect.
 * Returns how many pages are connected.
 */
export async function syncLinkedInPages(owner: PageOwner, token: string): Promise<number> {
  if (!owner.scopes?.includes(PAGES_SCOPE)) return 0;
  const ownerId = owner._id.toHexString();
  let ids: string[];
  try {
    ids = await administeredIds(token);
  } catch (error) {
    if (!(error instanceof SocialProviderError) || error.status !== FORBIDDEN) throw error;
    await SocialAccountModel.updateOne(
      { _id: owner._id },
      { $pull: { scopes: { $in: [...LINKEDIN_PAGE_SCOPES] } } },
    );
    return 0;
  }
  const pages = await Promise.all(ids.map((id) => pageOf(id, token)));
  await Promise.all(
    pages.map((page) =>
      SocialAccountModel.updateOne(
        { network: 'LINKEDIN', externalId: page.externalId },
        {
          $set: {
            app: 'LINKEDIN',
            kind: 'ORGANIZATION',
            tokenAccountId: ownerId,
            name: page.name,
            handle: page.handle,
            avatarUrl: page.avatarUrl,
            accessToken: '',
            refreshToken: '',
            expiresAt: null,
            connectedBy: owner.connectedBy,
            disconnectedAt: null,
          },
        },
        { upsert: true },
      ).exec(),
    ),
  );
  await markLost(ownerId, ids);
  return pages.length;
}
