import { CampaignModel } from '../marketing/marketing.model';

/** The attribution fields a lead carries, whichever shape it arrives in. */
export interface LeadAttribution {
  campaignId?: string | null;
  campaignName?: string | null;
}

/**
 * Fills in the campaign's name from the id the caller sent.
 *
 * The name is denormalised so a lead list reads without a join, but it must never be
 * caller-supplied: a form that sent both could label a lead with one campaign's id and
 * another's name, and no report built on either would be right afterwards.
 */
export async function withCampaignName<T extends LeadAttribution>(
  input: T,
): Promise<T & { campaignName: string }> {
  if (!input.campaignId) {
    return { ...input, campaignId: '', campaignName: '' };
  }
  const campaign = await CampaignModel.findById(input.campaignId).select('name').lean();
  return { ...input, campaignName: campaign?.name ?? '' };
}
