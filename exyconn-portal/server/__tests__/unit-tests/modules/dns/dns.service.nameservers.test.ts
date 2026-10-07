import { dnsService } from '../../../../src/modules/dns/dns.service';
import { NameserverChangeModel } from '../../../../src/modules/dns/nameserver-change.model';
import {
  CLOUDFLARE_NS,
  DOMAIN,
  GODADDY_NS,
  cloudflareA,
  godaddyA,
  stubProviders,
  zone,
} from './dns.fixtures';

const ACTOR = 'actor-1';

afterEach(() => jest.restoreAllMocks());

const changes = () => NameserverChangeModel.find({ domain: DOMAIN }).lean();

describe('dnsService.setNameServers to Cloudflare', () => {
  it('refuses a domain with no Cloudflare zone', async () => {
    const stubs = stubProviders({});
    await expect(dnsService.setNameServers(DOMAIN, 'CLOUDFLARE', null, ACTOR)).rejects.toThrow(
      'This domain has no Cloudflare zone yet.',
    );
    expect(stubs.setNameServers).not.toHaveBeenCalled();
  });

  it('refuses while a GoDaddy record is still missing on Cloudflare', async () => {
    const stubs = stubProviders({ godaddyRecords: [godaddyA()], zone: zone() });
    await expect(dnsService.setNameServers(DOMAIN, 'CLOUDFLARE', null, ACTOR)).rejects.toThrow(
      '1 GoDaddy record(s) are not on Cloudflare yet.',
    );
    expect(stubs.setNameServers).not.toHaveBeenCalled();
  });

  it('points the domain at the zone’s nameservers and records who did it', async () => {
    const stubs = stubProviders({
      godaddyRecords: [godaddyA()],
      zone: zone(),
      cloudflareRecords: [cloudflareA()],
    });

    await expect(
      dnsService.setNameServers(DOMAIN, 'CLOUDFLARE', undefined, ACTOR),
    ).resolves.toEqual(CLOUDFLARE_NS);

    expect(stubs.setNameServers).toHaveBeenCalledWith(DOMAIN, CLOUDFLARE_NS);
    const [change] = await changes();
    expect(change).toMatchObject({
      target: 'CLOUDFLARE',
      previous: GODADDY_NS,
      next: CLOUDFLARE_NS,
      actorId: ACTOR,
    });
  });

  it('changes nothing when the domain already points there', async () => {
    const stubs = stubProviders({ nameServers: CLOUDFLARE_NS, zone: zone() });

    await expect(dnsService.setNameServers(DOMAIN, 'CLOUDFLARE', null, ACTOR)).resolves.toEqual(
      CLOUDFLARE_NS,
    );

    expect(stubs.setNameServers).not.toHaveBeenCalled();
    expect(await changes()).toHaveLength(0);
  });
});

describe('dnsService.setNameServers back to GoDaddy', () => {
  it('refuses when no GoDaddy nameservers are on record', async () => {
    stubProviders({ nameServers: CLOUDFLARE_NS });
    await expect(dnsService.setNameServers(DOMAIN, 'GODADDY', null, ACTOR)).rejects.toThrow(
      'No GoDaddy nameservers are on record for this domain.',
    );
  });

  it('restores the nameservers the domain had before it was first moved', async () => {
    const stubs = stubProviders({ nameServers: CLOUDFLARE_NS });
    await NameserverChangeModel.create({
      domain: DOMAIN,
      target: 'CLOUDFLARE',
      previous: GODADDY_NS,
      next: CLOUDFLARE_NS,
    });

    await expect(dnsService.setNameServers(DOMAIN, 'GODADDY', null, ACTOR)).resolves.toEqual(
      GODADDY_NS,
    );
    expect(stubs.setNameServers).toHaveBeenCalledWith(DOMAIN, GODADDY_NS);
    expect(await changes()).toHaveLength(2);
  });
});

describe('dnsService.setNameServers to a custom set', () => {
  it('cleans and de-duplicates the hosts before pointing the domain at them', async () => {
    const stubs = stubProviders({});

    const next = await dnsService.setNameServers(
      DOMAIN,
      'CUSTOM',
      [' NS1.Example.net. ', 'ns1.example.net', 'ns2.example.net'],
      ACTOR,
    );

    expect(next).toEqual(['ns1.example.net', 'ns2.example.net']);
    expect(stubs.setNameServers).toHaveBeenCalledWith(DOMAIN, next);
  });

  it('asks for between two and thirteen nameservers', async () => {
    stubProviders({});
    const message = 'Enter between 2 and 13 nameservers.';
    await expect(dnsService.setNameServers(DOMAIN, 'CUSTOM', null, ACTOR)).rejects.toThrow(message);
    await expect(
      dnsService.setNameServers(DOMAIN, 'CUSTOM', ['ns1.example.net', 'NS1.example.net'], ACTOR),
    ).rejects.toThrow(message);
    const fourteen = Array.from({ length: 14 }, (_v, i) => `ns${i}.example.net`);
    await expect(dnsService.setNameServers(DOMAIN, 'CUSTOM', fourteen, ACTOR)).rejects.toThrow(
      message,
    );
  });

  it('names each host that is not a host name', async () => {
    const stubs = stubProviders({});
    await expect(
      dnsService.setNameServers(DOMAIN, 'CUSTOM', ['ns1.example.net', 'bad_host', 'x y'], ACTOR),
    ).rejects.toThrow('Not a nameserver host name: bad_host, x y');
    expect(stubs.setNameServers).not.toHaveBeenCalled();
  });

  it('refuses a domain that is not a domain name before touching anything', async () => {
    const stubs = stubProviders({});
    await expect(
      dnsService.setNameServers('nope', 'CUSTOM', ['a.example.net', 'b.example.net'], ACTOR),
    ).rejects.toThrow('"nope" is not a domain name.');
    expect(stubs.getNameServers).not.toHaveBeenCalled();
  });
});
