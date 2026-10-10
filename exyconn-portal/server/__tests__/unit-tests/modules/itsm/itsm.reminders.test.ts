import { reminderSources } from '../../../../src/modules/reminders';
import { AssetModel } from '../../../../src/modules/assets/asset.model';
import { LicenceModel } from '../../../../src/modules/assets/licence.model';
import { ItCloudResourceModel, ItSettingsModel } from '../../../../src/modules/itsm/models';
import { ROLES } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';

// Registering happens on import, the way the server does it.
import '../../../../src/modules/itsm/itsm.reminders';

const DAY = 86_400_000;
const NOW = new Date('2026-09-20T09:00:00.000Z');
const daysOut = (days: number) => new Date(NOW.getTime() + days * DAY);

const itExpiry = () => {
  const source = reminderSources().find((row) => row.key === 'it-expiry');
  if (!source) {
    throw new Error('The IT expiry source is not registered');
  }
  return source;
};

const licence = (name: string, fields: Record<string, unknown> = {}) =>
  LicenceModel.create({
    name,
    vendor: 'Acme',
    seatsTotal: 2,
    assigneeIds: ['u1', 'u2'],
    cost: 10,
    renewalDate: daysOut(3),
    ...fields,
  });

describe('the IT expiry reminder source', () => {
  useTestOrganization();

  it('is registered once, under its label', () => {
    const sources = reminderSources().filter((row) => row.key === 'it-expiry');

    expect(sources).toHaveLength(1);
    expect(sources[0].label).toBe('IT warranties, renewals and certificates');
  });

  it('chases unassigned kit without naming a holder, for IT only, once a day', async () => {
    const asset = await AssetModel.create({
      assetTag: 'MON-2',
      name: 'Dell monitor',
      category: 'MONITOR',
      warrantyExpiry: daysOut(-1),
    });

    const [reminder] = await itExpiry().due(NOW);

    expect(reminder).toEqual({
      dedupeKey: `asset-warranty:${asset._id.toHexString()}:2026-09-20`,
      kind: 'IT',
      title: 'MON-2 is out of warranty yesterday',
      body: 'Dell monitor. Decide whether to extend the cover, replace it or accept the risk.',
      link: `/it/assets/${asset._id.toHexString()}`,
      roles: [ROLES.IT],
    });
  });

  it('says so when every seat of a renewing licence is in use', async () => {
    await licence('Figma');

    const [reminder] = await itExpiry().due(NOW);

    expect(reminder.title).toBe('Figma renews in 3 days');
    expect(reminder.body).toBe(
      'Acme. every seat is in use — reclaim what nobody needs before it is paid for again.',
    );
    expect(reminder.link).toBe('/it/licences');
  });

  it('copes with an old licence record missing its vendor and seat counts', async () => {
    const legacy = await licence('Old tool');
    await LicenceModel.collection.updateOne(
      { _id: legacy._id },
      { $set: { vendor: '' }, $unset: { seatsTotal: '', assigneeIds: '' } },
    );

    const [reminder] = await itExpiry().due(NOW);

    expect(reminder.body).toBe(
      'every seat is in use — reclaim what nobody needs before it is paid for again.',
    );
  });

  it('chases a lapsing domain and reads its window from the IT settings', async () => {
    await ItSettingsModel.create({ key: 'global', certificateWarningDays: 5 });
    await ItCloudResourceModel.create([
      { name: 'exyconn.com', kind: 'DOMAIN', environment: 'PRODUCTION', expiresAt: daysOut(4) },
      { name: 'later.com', kind: 'DOMAIN', expiresAt: daysOut(6) },
      { name: 'old.com', kind: 'DOMAIN', status: 'RETIRED', expiresAt: daysOut(1) },
    ]);

    const reminders = await itExpiry().due(NOW);

    expect(reminders).toHaveLength(1);
    expect(reminders[0]).toMatchObject({
      title: 'exyconn.com expires in 4 days',
      body: 'DOMAIN in PRODUCTION. A lapsed certificate or domain takes the service with it.',
      link: '/it/cloud',
    });
  });

  it('has nothing to say when nothing is about to lapse', async () => {
    await licence('Far off', { renewalDate: daysOut(90) });
    await AssetModel.create({ assetTag: 'L-1', name: 'L', warrantyExpiry: daysOut(365) });

    expect(await itExpiry().due(NOW)).toEqual([]);
  });
});
