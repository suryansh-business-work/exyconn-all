import { badRequest } from '../../../utils/errors';
import { open, seal } from '../../../utils/secretBox';
import { secretHint } from '../../tech/tech.secrets';
import { DEFAULT_CLUTCH_ACTOR, LeadSourceSettingsModel } from './clutch.models';

/** An Apify actor id: `username/actor-name` (or `username~actor-name`). */
const ACTOR_ID = /^[\w.-]+[/~][\w.-]+$/;

export interface LeadSourceSettingsInput {
  /** Blank keeps the stored token. */
  apifyToken: string;
  clutchActorId: string;
}

const KEY = { key: 'default' };

/** What a page sees: whether a token is stored, its tail, and the actor. Never the token. */
async function view() {
  const row = await LeadSourceSettingsModel.findOne(KEY).lean();
  return {
    hasApifyToken: Boolean(row?.apifyTokenHint),
    apifyTokenHint: row?.apifyTokenHint ?? '',
    clutchActorId: row?.clutchActorId ?? DEFAULT_CLUTCH_ACTOR,
    updatedByName: row?.updatedByName ?? '',
  };
}

export const leadSourceSettings = {
  view,

  async save(input: LeadSourceSettingsInput, actorName: string) {
    const actor = input.clutchActorId.trim() || DEFAULT_CLUTCH_ACTOR;
    if (!ACTOR_ID.test(actor)) {
      badRequest('Enter the Apify actor as username/actor-name, e.g. scrapeai/clutch-co-scraper.');
    }
    const token = input.apifyToken.trim();
    if (token.length > 300) {
      badRequest('That is too long to be an Apify API token.');
    }
    const secret = token
      ? { apifyToken: seal(token), apifyTokenHint: secretHint(token) ?? '' }
      : {};
    await LeadSourceSettingsModel.updateOne(
      KEY,
      { $set: { clutchActorId: actor, updatedByName: actorName, ...secret } },
      { upsert: true },
    );
    return view();
  },

  /** Removes the token: Clutch searches fall back to Clutch's own server. */
  async clearToken(actorName: string) {
    await LeadSourceSettingsModel.updateOne(KEY, {
      $set: { apifyToken: '', apifyTokenHint: '', updatedByName: actorName },
    });
    return view();
  },

  /** The token and actor for a run, or null when no token is stored. */
  async apify(): Promise<{ token: string; actorId: string } | null> {
    const row = await LeadSourceSettingsModel.findOne(KEY)
      .select('+apifyToken clutchActorId')
      .lean();
    if (!row?.apifyToken) {
      return null;
    }
    return { token: open(row.apifyToken), actorId: row.clutchActorId || DEFAULT_CLUTCH_ACTOR };
  },
};
