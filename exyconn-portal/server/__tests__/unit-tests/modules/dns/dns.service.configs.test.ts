import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { dnsService } from '../../../../src/modules/dns/dns.service';
import { godaddyClient } from '../../../../src/modules/dns/godaddy.client';
import { cloudflareClient } from '../../../../src/modules/dns/cloudflare.client';
import { GodaddyConfigModel } from '../../../../src/modules/dns/godaddy-config.model';
import { CloudflareConfigModel } from '../../../../src/modules/dns/cloudflare-config.model';

/** Never a literal credential: each value is made at runtime. */
const secret = (prefix: string) => `${prefix}-${randomUUID()}`;
const missingId = () => new Types.ObjectId().toHexString();
/** Rows land in the same millisecond, so the list is compared without its order. */
const activeByLabel = (rows: ReadonlyArray<{ label: string; isActive: boolean }>) =>
  Object.fromEntries(rows.map((row) => [row.label, row.isActive]));

afterEach(() => jest.restoreAllMocks());

describe('GoDaddy configurations', () => {
  const create = (label: string, isActive = false) =>
    dnsService.createGodaddyConfig({
      label,
      apiKey: secret('key'),
      apiSecret: secret('secret'),
      isActive,
    });

  it('requires both halves of the credential', async () => {
    await expect(
      dnsService.createGodaddyConfig({ label: 'x', apiSecret: secret('s') }),
    ).rejects.toThrow('An API key is required.');
    await expect(
      dnsService.createGodaddyConfig({ label: 'x', apiKey: secret('k'), apiSecret: '  ' }),
    ).rejects.toThrow('An API secret is required.');
  });

  it('keeps exactly one active', async () => {
    const first = await create('First', true);
    await create('Second', true);
    await create('Third');

    const rows = await dnsService.listGodaddyConfigs();
    expect(activeByLabel(rows)).toEqual({ First: false, Second: true, Third: false });
    expect(first.isActive).toBe(true);
  });

  it('updates without wiping a secret left blank, and moves the active flag', async () => {
    const first = await create('First', true);
    const second = await create('Second');

    const updated = await dnsService.updateGodaddyConfig(second._id.toHexString(), {
      label: 'Renamed',
      apiKey: '',
      apiSecret: '   ',
      isActive: true,
    });

    expect(updated).toMatchObject({ label: 'Renamed', apiKey: second.apiKey, isActive: true });
    expect(updated.apiSecret).toBe(second.apiSecret);
    const before = await GodaddyConfigModel.findById(first._id).lean();
    expect(before?.isActive).toBe(false);
  });

  it('leaves the others alone when an update does not activate', async () => {
    const first = await create('First', true);
    const second = await create('Second');
    await dnsService.updateGodaddyConfig(second._id.toHexString(), { label: 'Quiet' });
    expect((await GodaddyConfigModel.findById(first._id).lean())?.isActive).toBe(true);
  });

  it('reports a missing configuration on update, delete and test', async () => {
    await expect(dnsService.updateGodaddyConfig(missingId(), { label: 'x' })).rejects.toThrow(
      'GoDaddy config not found',
    );
    await expect(dnsService.deleteGodaddyConfig(missingId())).rejects.toThrow(
      'GoDaddy config not found',
    );
    await expect(dnsService.testGodaddyConnection(missingId())).rejects.toThrow(
      'GoDaddy config not found',
    );
  });

  it('deletes one and tests one against GoDaddy', async () => {
    const config = await create('Main');
    const verify = jest.spyOn(godaddyClient, 'verify').mockResolvedValue(undefined);

    await expect(dnsService.testGodaddyConnection(config._id.toHexString())).resolves.toBe(true);
    expect(verify.mock.calls[0][0]).toMatchObject({ apiKey: config.apiKey });

    await expect(dnsService.deleteGodaddyConfig(config._id.toHexString())).resolves.toBe(true);
    expect(await GodaddyConfigModel.countDocuments()).toBe(0);
  });

  it('lists the account’s domains through the client', async () => {
    const domains = [{ domain: 'exyconn.com', status: 'ACTIVE', nameServers: [] }];
    jest.spyOn(godaddyClient, 'listDomains').mockResolvedValue(domains);
    await expect(dnsService.listDomains()).resolves.toEqual(domains);
  });
});

describe('Cloudflare configurations', () => {
  const create = (label: string, isActive = false) =>
    dnsService.createCloudflareConfig({
      label,
      apiToken: secret('token'),
      accountId: 'acc',
      isActive,
    });

  it('requires a token', async () => {
    await expect(
      dnsService.createCloudflareConfig({ label: 'x', accountId: 'acc' }),
    ).rejects.toThrow('An API token is required.');
  });

  it('keeps exactly one active', async () => {
    const first = await create('First', true);
    await create('Second', true);

    const rows = await dnsService.listCloudflareConfigs();
    expect(activeByLabel(rows)).toEqual({ First: false, Second: true });
    expect(first.isActive).toBe(true);
  });

  it('updates without wiping a blank token, and moves the active flag', async () => {
    const first = await create('First', true);
    const second = await create('Second');

    const updated = await dnsService.updateCloudflareConfig(second._id.toHexString(), {
      label: 'Renamed',
      apiToken: '',
      accountId: 'acc-2',
      isActive: true,
    });

    expect(updated).toMatchObject({ apiToken: second.apiToken, accountId: 'acc-2' });
    expect((await CloudflareConfigModel.findById(first._id).lean())?.isActive).toBe(false);

    await dnsService.updateCloudflareConfig(first._id.toHexString(), {
      label: 'F',
      accountId: 'acc',
    });
    expect((await CloudflareConfigModel.findById(second._id).lean())?.isActive).toBe(true);
  });

  it('reports a missing configuration on update, delete and test', async () => {
    const input = { label: 'x', accountId: 'acc' };
    await expect(dnsService.updateCloudflareConfig(missingId(), input)).rejects.toThrow(
      'Cloudflare config not found',
    );
    await expect(dnsService.deleteCloudflareConfig(missingId())).rejects.toThrow(
      'Cloudflare config not found',
    );
    await expect(dnsService.testCloudflareConnection(missingId())).rejects.toThrow(
      'Cloudflare config not found',
    );
  });

  it('deletes one and tests one against Cloudflare', async () => {
    const config = await create('Main');
    const verify = jest.spyOn(cloudflareClient, 'verify').mockResolvedValue(undefined);

    await expect(dnsService.testCloudflareConnection(config._id.toHexString())).resolves.toBe(true);
    expect(verify.mock.calls[0][0]).toMatchObject({ apiToken: config.apiToken });

    await expect(dnsService.deleteCloudflareConfig(config._id.toHexString())).resolves.toBe(true);
    expect(await CloudflareConfigModel.countDocuments()).toBe(0);
  });
});
