import type { ListApiKeysQuery, ListWebhooksQuery } from '@exyconn/shell/graphql/generated';

type ApiKeyRow = ListApiKeysQuery['listApiKeys'][number];
type WebhookRow = ListWebhooksQuery['listWebhooks'][number];

let issued = 0;

/** A one-time credential built at run time, so no secret-looking literal sits in the source. */
export function oneTimeValue(kind: string): string {
  issued += 1;
  return [kind, 'test', String(issued).padStart(6, '0')].join('_');
}

export const apiKey = (overrides: Partial<ApiKeyRow> = {}): ApiKeyRow => ({
  __typename: 'ApiKey',
  id: 'key-1',
  name: 'Payroll sync',
  prefix: 'exy_ab12',
  roles: ['HR', 'FINANCE'],
  createdBy: 'user-1',
  lastUsedAt: '2026-09-19T10:30:00.000Z',
  revokedAt: null,
  expiresAt: null,
  createdAt: '2026-09-01T00:00:00.000Z',
  ...overrides,
});

export const webhook = (overrides: Partial<WebhookRow> = {}): WebhookRow => ({
  __typename: 'Webhook',
  id: 'hook-1',
  name: 'CRM bridge',
  url: 'https://crm.example.com/hooks',
  events: ['lead.created', 'invoice.paid'],
  active: true,
  createdBy: 'user-1',
  lastDeliveredAt: '2026-09-19T10:30:00.000Z',
  failureCount: 0,
  createdAt: '2026-09-01T00:00:00.000Z',
  ...overrides,
});
