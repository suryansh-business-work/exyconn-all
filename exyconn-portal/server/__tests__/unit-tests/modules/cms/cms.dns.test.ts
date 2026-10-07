import { Types } from 'mongoose';
import { env } from '../../../../src/config/env';
import { setSiteARecord, siteDns } from '../../../../src/modules/cms/cms.dns';
import { readARecords, setARecord } from '../../../../src/modules/dns';
import { seedSite } from './cms.fixtures';

jest.mock('../../../../src/config/env', () => {
  const actual = jest.requireActual('../../../../src/config/env');
  return { ...actual, env: { ...actual.env, websiteServerIp: '203.0.113.10' } };
});

jest.mock('../../../../src/modules/dns', () => ({
  readARecords: jest.fn(),
  setARecord: jest.fn(),
}));

const SERVER_IP = '203.0.113.10';
const ELSEWHERE_IP = '198.51.100.20';
const read = jest.mocked(readARecords);
const write = jest.mocked(setARecord);

const found = (host: string, ips: string[]) => ({
  host,
  zone: 'docs.test',
  name: host === 'docs.test' ? '@' : 'www',
  authority: 'GODADDY' as const,
  records: ips.map((ip) => ({ ip, ttl: 600 })),
});

afterEach(() => {
  Object.assign(env, { websiteServerIp: SERVER_IP });
});

describe('siteDns', () => {
  it('reads every domain and says which point at the websites server', async () => {
    const site = await seedSite('docs', { domains: ['docs.test', 'www.docs.test'] });
    read.mockImplementation(async (host) =>
      host === 'docs.test' ? found(host, [SERVER_IP]) : found(host, [SERVER_IP, ELSEWHERE_IP]),
    );

    const result = await siteDns(String(site._id));

    expect(result.serverIp).toBe(SERVER_IP);
    expect(result.domains).toEqual([
      {
        domain: 'docs.test',
        zone: 'docs.test',
        name: '@',
        authority: 'GODADDY',
        records: [{ ip: SERVER_IP, ttl: 600 }],
        pointsHere: true,
        error: '',
      },
      expect.objectContaining({ domain: 'www.docs.test', pointsHere: false, error: '' }),
    ]);
  });

  it('does not count a domain with no A records, or any domain when no server is set', async () => {
    const site = await seedSite('docs', { domains: ['docs.test'] });
    read.mockResolvedValueOnce(found('docs.test', []));

    const empty = await siteDns(String(site._id));
    Object.assign(env, { websiteServerIp: '' });
    read.mockResolvedValueOnce(found('docs.test', ['']));
    const unset = await siteDns(String(site._id));

    expect(empty.domains[0].pointsHere).toBe(false);
    expect(unset.domains[0].pointsHere).toBe(false);
    expect(unset.serverIp).toBe('');
  });

  it('reports why a domain could not be read', async () => {
    const site = await seedSite('docs', { domains: ['docs.test', 'www.docs.test'] });
    read.mockRejectedValueOnce(new Error('docs.test is not on the GoDaddy account'));
    read.mockRejectedValueOnce('timeout');

    const result = await siteDns(String(site._id));

    expect(result.domains).toEqual([
      {
        domain: 'docs.test',
        zone: '',
        name: '',
        authority: 'UNKNOWN',
        records: [],
        pointsHere: false,
        error: 'docs.test is not on the GoDaddy account',
      },
      expect.objectContaining({
        domain: 'www.docs.test',
        authority: 'UNKNOWN',
        error: 'Could not read the DNS records.',
      }),
    ]);
  });

  it('refuses a site that does not exist', async () => {
    await expect(siteDns(String(new Types.ObjectId()))).rejects.toThrow('Website not found');
  });
});

describe('setSiteARecord', () => {
  it('points one of the site domains at the address and reads it back', async () => {
    const site = await seedSite('docs', { domains: ['docs.test'] });
    write.mockResolvedValueOnce(found('docs.test', [SERVER_IP]));
    read.mockResolvedValueOnce(found('docs.test', [SERVER_IP]));

    const result = await setSiteARecord(
      String(site._id),
      ' HTTPS://Docs.Test/ ',
      ` ${SERVER_IP} `,
      600,
    );

    expect(write).toHaveBeenCalledWith('docs.test', SERVER_IP, 600);
    expect(result).toMatchObject({ domain: 'docs.test', pointsHere: true });
  });

  it('refuses a domain the site does not have', async () => {
    const site = await seedSite('docs', { domains: ['docs.test'] });

    await expect(setSiteARecord(String(site._id), 'other.test', SERVER_IP, 600)).rejects.toThrow(
      "other.test is not one of this website's domains. Add it in the settings first.",
    );
    expect(write).not.toHaveBeenCalled();
  });
});
