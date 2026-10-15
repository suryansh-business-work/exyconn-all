import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { channelLookup } from '../../../../../../../demos/whatsapp-demo/server/src/channel/channel.lookup';
import { WhatsappChannelModel } from '../../../../../../../demos/whatsapp-demo/server/src/channel/channel.model';
import { runAsPlatform, runForOrganization } from '../../../../../src/lib/tenant';
import { seal } from '../../../../../src/utils/secretBox';

const accessToken = randomUUID();
const appSecret = randomUUID();
const companyA = new Types.ObjectId().toHexString();
const companyB = new Types.ObjectId().toHexString();

function connect(organizationId: string, fields: Record<string, unknown> = {}) {
  return runForOrganization(organizationId, () =>
    WhatsappChannelModel.create({
      phoneNumberId: '1098765',
      accessToken: seal(accessToken),
      appSecret: seal(appSecret),
      verifyToken: 'verify-me-please',
      enabled: true,
      ...fields,
    }),
  );
}

describe('channelLookup.forNumber', () => {
  it('finds the company a switched-on number belongs to, with its credentials opened', async () => {
    await connect(companyA);

    await expect(channelLookup.forNumber('1098765')).resolves.toEqual({
      organizationId: companyA,
      appSecret,
      sender: { phoneNumberId: '1098765', accessToken },
      enabled: true,
    });
  });

  it('finds a switched-off number flagged off, so the webhook can say why it is silent', async () => {
    await connect(companyA, { enabled: false });

    await expect(channelLookup.forNumber('1098765')).resolves.toEqual(
      expect.objectContaining({ organizationId: companyA, enabled: false }),
    );
  });

  it('finds nothing for an unknown number', async () => {
    await expect(channelLookup.forNumber('5555555')).resolves.toBeNull();
  });

  it('finds nothing for a number filed under no company', async () => {
    await runAsPlatform(() =>
      WhatsappChannelModel.create({
        phoneNumberId: '1098765',
        accessToken: seal(accessToken),
        appSecret: seal(appSecret),
        verifyToken: 'verify-me-please',
        enabled: true,
      }),
    );

    await expect(channelLookup.forNumber('1098765')).resolves.toBeNull();
  });

  it('looks across every company, whatever scope the caller is in', async () => {
    await connect(companyB);

    const found = await runForOrganization(companyA, () => channelLookup.forNumber('1098765'));

    expect(found?.organizationId).toBe(companyB);
  });
});

describe('channelLookup.knowsVerifyToken', () => {
  it('knows a token any company registered, and nothing else', async () => {
    await connect(companyB, { enabled: false });

    await expect(channelLookup.knowsVerifyToken('verify-me-please')).resolves.toBe(true);
    await expect(channelLookup.knowsVerifyToken('someone-elses-token')).resolves.toBe(false);
  });
});

describe('channelLookup.numberTakenElsewhere', () => {
  it('says a number another company connected is taken', async () => {
    await connect(companyB);

    await expect(channelLookup.numberTakenElsewhere('1098765', null)).resolves.toBe(true);
  });

  it('does not count the company own record against it', async () => {
    const own = await connect(companyA);

    await expect(
      channelLookup.numberTakenElsewhere('1098765', own._id.toHexString()),
    ).resolves.toBe(false);
  });

  it('says a number nobody connected is free', async () => {
    await connect(companyA, { phoneNumberId: '2222222' });

    await expect(channelLookup.numberTakenElsewhere('1098765', null)).resolves.toBe(false);
  });
});
