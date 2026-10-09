import { lookup } from 'node:dns/promises';
import {
  UnsafeUrlError,
  assertPublicHttpsUrl,
  isPublicAddress,
} from '../../../src/utils/safeFetch';
import ips from '../../fixtures/ips.json';

jest.mock('node:dns/promises', () => ({ lookup: jest.fn() }));

const lookupMock = lookup as unknown as jest.Mock;
const resolveTo = (...addresses: string[]) =>
  lookupMock.mockResolvedValue(
    addresses.map((address) => ({ address, family: address.includes(':') ? 6 : 4 })),
  );

describe('isPublicAddress', () => {
  it.each([ips.ip8_8_8_8, ips.ip1_1_1_1, ips.ip2606_4700_4700__1111])(
    'allows the public address %s',
    (ip) => {
      expect(isPublicAddress(ip)).toBe(true);
    },
  );

  it.each([
    '0.0.0.0',
    ips.ip10_1_2_3,
    ips.ip100_64_0_1,
    '127.0.0.1',
    ips.ip169_254_169_254,
    ips.ip172_17_0_2,
    ips.ip192_168_1_1,
    ips.ip198_18_0_1,
    ips.ip224_0_0_1,
    '255.255.255.255',
    '::',
    '::1',
    ips.ip__ffff_127_0_0_1,
    ips.ip64_ff9b__a00_1,
    ips.ip2001_db8__1,
    ips.ip2002_a00_1__,
    ips.ipfd00__1,
    ips.ipfe80__1,
    ips.ipff02__1,
  ])('blocks the private or reserved address %s', (ip) => {
    expect(isPublicAddress(ip)).toBe(false);
  });

  it('refuses something that is not an IP literal', () => {
    expect(isPublicAddress('example.com')).toBe(false);
  });
});

describe('assertPublicHttpsUrl', () => {
  it('returns the parsed URL when every address is public', async () => {
    resolveTo(ips.ip93_184_216_34, ips.ip2606_2800_220_1_248_1893_25c8_1946);
    const url = await assertPublicHttpsUrl('https://example.com/hook');
    expect(url.href).toBe('https://example.com/hook');
    expect(lookupMock).toHaveBeenCalledWith('example.com', { all: true, verbatim: true });
  });

  it('strips the brackets from an IPv6 literal before resolving it', async () => {
    resolveTo(ips.ip2606_4700_4700__1111);
    await assertPublicHttpsUrl('https://[2606:4700:4700::1111]/');
    expect(lookupMock).toHaveBeenCalledWith(ips.ip2606_4700_4700__1111, {
      all: true,
      verbatim: true,
    });
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
    resolveTo(ips.ip93_184_216_34, ips.ip10_0_0_5);
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
