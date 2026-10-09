import ips from './ips.json';

/** A `node:dns/promises` stand-in that resolves every host to one public address. */
export const publicDnsMock = () => ({
  lookup: jest.fn().mockResolvedValue([{ address: ips.ip93_184_215_14, family: 4 }]),
});
