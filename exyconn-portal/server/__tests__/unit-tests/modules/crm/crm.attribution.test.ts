import { Types } from 'mongoose';
import { withCampaignName } from '../../../../src/modules/crm/crm.attribution';
import { CampaignModel } from '../../../../src/modules/marketing/marketing.model';

const seedCampaign = () =>
  CampaignModel.create({
    name: 'Spring webinar',
    channel: 'EMAIL',
    budget: 250,
    startDate: new Date('2027-03-01'),
    endDate: new Date('2027-03-31'),
    status: 'PLANNED',
  });

describe('withCampaignName', () => {
  it('resolves the name of the campaign the id points at, keeping the other fields', async () => {
    const campaign = await seedCampaign();

    const result = await withCampaignName({ name: 'Ada', campaignId: campaign._id.toHexString() });

    expect(result).toEqual({
      name: 'Ada',
      campaignId: campaign._id.toHexString(),
      campaignName: 'Spring webinar',
    });
  });

  it('keeps the id but leaves the name empty when the campaign no longer exists', async () => {
    const campaignId = new Types.ObjectId().toHexString();

    const result = await withCampaignName({ campaignId, campaignName: 'Made up' });

    expect(result).toEqual({ campaignId, campaignName: '' });
  });

  it('clears both fields when no campaign was picked, whatever name was sent', async () => {
    await expect(withCampaignName({ campaignId: null, campaignName: 'Made up' })).resolves.toEqual({
      campaignId: '',
      campaignName: '',
    });
    await expect(withCampaignName({})).resolves.toEqual({ campaignId: '', campaignName: '' });
  });
});
