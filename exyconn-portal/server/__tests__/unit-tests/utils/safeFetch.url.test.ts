import { lookup } from 'node:dns/promises';
import {
  UnsafeUrlError,
  assertPublicHttpsUrl,
  isPublicAddress,
} from '../../../src/utils/safeFetch';

jest.mock('node:dns/promises', () => ({ lookup: jest.fn() }));

const lookupMock = lookup as unknown as jest.Mock;
const resolveTo = (...addresses: string[]) =>
  lookupMock.mockResolvedValue(
    addresses.map((address) => ({ address, family: address.includes(':') ? 6 : 4 })),
  );

describe('isPublicAddress', () => {
  it.each(['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111'])('allows the public address %s', (ip) => {
    expect(isPublicAddress(ip)).toBe(true);
  });

  it.each([
    '0.0.0.0',
    '10.1.2.3',
    '100.64.0.1',
    '127.0.0.1',
    '169.254.169.254',
    '172.17.0.2',
    '192.168.1.1',
    '198.18.0.1',
    '224.0.0.1',
    '255.255.255.255',
    '::',
    '::1',
    '::ffff:127.0.0.1',
    '64:ff9b::a00:1',
    '2001:db8::1',
    '2002:a00:1::',
    'fd00::1',
    'fe80::1',
    'ff02::1',
  ])('blocks the private or reserved address %s', (ip) => {
    expect(isPublicAddress(ip)).toBe(false);
  });

  it('refuses something that is not an IP literal', () => {
    expect(isPublicAddress('example.com')).toBe(false);
  });
});

describe('assertPublicHttpsUrl', () => {
  it('returns the parsed URL when every address is public', async () => {
    resolveTo('93.184.216.34', '2606:2800:220:1:248:1893:25c8:1946');
    const url = await assertPublicHttpsUrl('https://example.com/hook');
    expect(url.href).toBe('https://example.com/hook');
    expect(lookupMock).toHaveBeenCalledWith('example.com', { all: true, verbatim: true });
  });

  it('strips the brackets from an IPv6 literal before resolving it', async () => {
    resolveTo('2606:4700:4700::1111');
    await assertPublicHttpsUrl('https://[2606:4700:4700::1111]/');
    expect(lookupMock).toHaveBeenCalledWith('2606:4700:4700::1111', { all: true, verbatim: true });
  });

  it('refuses something that is not a URL', async () => {
    await expect(assertPublicHttpsUrl('not a url')).rejects.toThrow('Enter a valid URL');
  });

  it('refuses plain http', async () => {
    await expect(assertPublicHttpsUrl('http://example.com')).rejects.toThrow('Use an https URL');
  });

  it('refuses a URL that carries credentials', async () => {
    await expect(assertPublicHttpsUrl('https://user@example.com')).rejects.toThrow(
      'must not carry a username or password',
    );
    await expect(assertPublicHttpsUrl('https://:pw@example.com')).rejects.toThrow(
      'must not carry a username or password',
    );
  });

  it('refuses a host that does not resolve', async () => {
    lookupMock.mockRejectedValue(new Error('ENOTFOUND'));
    await expect(assertPublicHttpsUrl('https://nowhere.test')).rejects.toThrow(
      'The host nowhere.test could not be resolved',
    );
  });

  it('refuses a host that resolves to no address at all', async () => {
    resolveTo();
    await expect(assertPublicHttpsUrl('https://empty.test')).rejects.toThrow(
      'The host empty.test is not a public internet address',
    );
  });

  it('refuses a host where any one address is private', async () => {
    resolveTo('93.184.216.34', '10.0.0.5');
    const refusal = assertPublicHttpsUrl('https://mixed.test');
    await expect(refusal).rejects.toBeInstanceOf(UnsafeUrlError);
    await expect(refusal).rejects.toThrow('is not a public internet address');
  });
});

describe('UnsafeUrlError', () => {
  it('is an Error named for what it is', () => {
    const error = new UnsafeUrlError('nope');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('UnsafeUrlError');
    expect(error.message).toBe('nope');
  });
});
