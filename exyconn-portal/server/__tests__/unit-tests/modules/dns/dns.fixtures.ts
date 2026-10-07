import {
  cloudflareClient,
  type CloudflareZone,
} from '../../../../src/modules/dns/cloudflare.client';
import { godaddyClient } from '../../../../src/modules/dns/godaddy.client';
import type { CloudflareRecord, GodaddyRecord } from '../../../../src/modules/dns/dns.records';

export const DOMAIN = 'exyconn.com';
export const GODADDY_NS = ['ns51.domaincontrol.com', 'ns52.domaincontrol.com'];
export const CLOUDFLARE_NS = ['ada.ns.cloudflare.com', 'bob.ns.cloudflare.com'];

export const zone = (fields: Partial<CloudflareZone> = {}): CloudflareZone => ({
  id: 'zone-1',
  status: 'active',
  nameServers: CLOUDFLARE_NS,
  originalNameServers: GODADDY_NS,
  ...fields,
});

export const godaddyA = (data = '203.0.113.10'): GodaddyRecord => ({
  type: 'A',
  name: '@',
  data,
  ttl: 600,
});

export const cloudflareA = (content = '203.0.113.10', id = 'r1'): CloudflareRecord => ({
  id,
  type: 'A',
  name: DOMAIN,
  content,
  ttl: 600,
  proxied: false,
});

/** Both providers, answering only what a test sets; nothing reaches the network. */
export function stubProviders(fields: {
  nameServers?: string[];
  godaddyRecords?: GodaddyRecord[];
  zone?: CloudflareZone | null;
  cloudflareRecords?: CloudflareRecord[];
}) {
  return {
    getNameServers: jest
      .spyOn(godaddyClient, 'getNameServers')
      .mockResolvedValue(fields.nameServers ?? GODADDY_NS),
    godaddyRecords: jest
      .spyOn(godaddyClient, 'listRecords')
      .mockResolvedValue(fields.godaddyRecords ?? []),
    setNameServers: jest.spyOn(godaddyClient, 'setNameServers').mockResolvedValue(undefined),
    findZone: jest.spyOn(cloudflareClient, 'findZone').mockResolvedValue(fields.zone ?? null),
    cloudflareRecords: jest
      .spyOn(cloudflareClient, 'listRecords')
      .mockResolvedValue(fields.cloudflareRecords ?? []),
    createZone: jest.spyOn(cloudflareClient, 'createZone').mockResolvedValue(zone()),
    createRecord: jest.spyOn(cloudflareClient, 'createRecord').mockResolvedValue(undefined),
  };
}
