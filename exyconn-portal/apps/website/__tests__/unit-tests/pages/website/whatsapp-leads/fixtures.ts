import { WhatsappDemoVisitorSource } from '@exyconn/shell/graphql/generated';
import type { WhatsappLeadRow } from '../../../../../src/pages/website/whatsapp-leads/whatsapp-leads-grid';

/** One WhatsApp demo lead as the paged query returns it; override what a test is about. */
export function leadRow(overrides: Partial<WhatsappLeadRow> = {}): WhatsappLeadRow {
  return {
    id: 'lead-1',
    name: 'Asha Rao',
    email: 'asha@example.test',
    company: 'Acme',
    phone: '+91 98450 00000',
    source: WhatsappDemoVisitorSource.Website,
    verifiedAt: '2026-10-01T10:00:00.000Z',
    lastSignInAt: '2026-10-05T09:30:00.000Z',
    signInCount: 4,
    blocked: false,
    createdAt: '2026-09-30T08:00:00.000Z',
    updatedAt: '2026-10-05T09:30:00.000Z',
    ...overrides,
  };
}
