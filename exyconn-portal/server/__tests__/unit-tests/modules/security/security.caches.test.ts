import { SonarConfigModel } from '../../../../src/modules/security';
import {
  SONAR_CACHE_TTL_MS,
  clearSonarCache,
  sonarService,
} from '../../../../src/modules/security/sonar.service';
import {
  SSL_CACHE_TTL_MS,
  clearSslCache,
  sslCertificates,
} from '../../../../src/modules/security/ssl.service';
import { readCertificate } from '../../../../src/modules/security/ssl.probe';
import { StatusMonitorModel } from '../../../../src/modules/status/status-monitor.model';
import { freezeClock } from '../../../helpers';

// safeFetch resolves the host before connecting; the hosts here are fictional.
jest.mock('node:dns/promises', () =>
  jest
    .requireActual<typeof import('../../../fixtures/publicDns')>('../../../fixtures/publicDns')
    .publicDnsMock(),
);
jest.mock('../../../../src/modules/security/ssl.probe', () => ({ readCertificate: jest.fn() }));
const probe = readCertificate as jest.Mock;

/** Never a literal credential: the value only has to look like a long token. */
const TOKEN = process.env.TEST_SONAR_TOKEN ?? `squ_${'y'.repeat(28)}`;
const START = '2026-10-07T09:00:00.000Z';

const sonarInput = (overrides: Record<string, unknown> = {}) => ({
  label: 'SonarCloud',
  hostUrl: 'https://sonar.example.test',
  token: TOKEN,
  projectKey: 'exyconn_all',
  isActive: true,
  ...overrides,
});

/** Every Web API call answers an empty, valid payload; the mock counts the calls. */
function mockSonar() {
  const fetchMock = jest.fn(
    async () =>
      new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
  );
  globalThis.fetch = fetchMock;
  return fetchMock;
}

const handshake = {
  certificate: { subject: { CN: 'portal.exyconn.test' }, valid_to: 'Jan  1 00:00:00 2030 GMT' },
  protocol: 'TLSv1.3',
  authorized: true,
  authorizationError: '',
};

beforeEach(() => {
  clearSonarCache();
  clearSslCache();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('the SonarQube overview cache', () => {
  it('asks SonarQube again once the cached overview has gone stale', async () => {
    freezeClock(START);
    const fetchMock = mockSonar();
    await sonarService.createConfig(sonarInput());

    const first = await sonarService.overview(false);
    jest.setSystemTime(new Date(Date.parse(START) + SONAR_CACHE_TTL_MS - 1));
    await expect(sonarService.overview(false)).resolves.toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(4);

    jest.setSystemTime(new Date(Date.parse(START) + SONAR_CACHE_TTL_MS));
    const fresh = await sonarService.overview(false);

    expect(fresh).not.toBe(first);
    expect(fresh).toMatchObject({ state: 'OK', issuesTotal: 0, metrics: { bugs: null } });
    expect(fetchMock).toHaveBeenCalledTimes(8);
  });

  it('asks again when the active config was changed behind its back', async () => {
    const fetchMock = mockSonar();
    const created = await sonarService.createConfig(sonarInput());
    const first = await sonarService.overview(false);

    // Another instance edited it: a later updatedAt is what tells the cache it is out of date.
    await SonarConfigModel.updateOne(
      { _id: created._id },
      { label: 'Renamed', updatedAt: new Date(Date.now() + 60_000) },
      { timestamps: false },
    );
    const fresh = await sonarService.overview(false);

    expect(fresh).not.toBe(first);
    expect(fresh.configLabel).toBe('Renamed');
    expect(fetchMock).toHaveBeenCalledTimes(8);
  });
});

describe('adding an inactive SonarQube config', () => {
  it('leaves the active one in charge', async () => {
    const active = await sonarService.createConfig(sonarInput());
    const spare = await sonarService.createConfig(sonarInput({ label: 'Spare', isActive: false }));

    expect(await SonarConfigModel.findById(active._id).lean()).toMatchObject({ isActive: true });
    expect(spare).toMatchObject({ label: 'Spare', isActive: false, organization: '' });
  });
});

describe('the SSL report cache', () => {
  it('checks the hosts again once the cached report has gone stale', async () => {
    freezeClock(START);
    await StatusMonitorModel.create({
      key: 'portal',
      name: 'Portal',
      url: 'https://portal.exyconn.test',
      isActive: true,
      category: 'PORTAL',
    });
    probe.mockResolvedValue(handshake);

    const first = await sslCertificates();
    jest.setSystemTime(new Date(Date.parse(START) + SSL_CACHE_TTL_MS - 1));
    await expect(sslCertificates()).resolves.toBe(first);
    expect(probe).toHaveBeenCalledTimes(1);

    jest.setSystemTime(new Date(Date.parse(START) + SSL_CACHE_TTL_MS));
    const fresh = await sslCertificates();

    expect(fresh).not.toBe(first);
    expect(fresh.certificates).toEqual([
      expect.objectContaining({ host: 'portal.exyconn.test', status: 'OK', monitors: ['Portal'] }),
    ]);
    expect(probe).toHaveBeenCalledTimes(2);
  });
});
