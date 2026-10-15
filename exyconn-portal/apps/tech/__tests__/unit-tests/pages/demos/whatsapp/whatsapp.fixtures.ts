import type { WhatsappChannelRow } from '../../../../../src/pages/demos/whatsapp/forms/whatsapp-number';

/** A connected WhatsApp number as the settings query returns it. */
export function channelRow(overrides: Partial<WhatsappChannelRow> = {}): WhatsappChannelRow {
  return {
    id: 'ch-1',
    phoneNumberId: '1234567890',
    displayPhone: '+1 555 010 0000',
    verifyToken: 'verify-token-123',
    enabled: true,
    hasAccessToken: true,
    accessTokenHint: '…abcd',
    hasAppSecret: true,
    webhookUrl: 'https://api.example.com/whatsapp/webhook',
    lastInboundAt: null,
    lastProblem: '',
    lastProblemAt: null,
    updatedAt: null,
    updatedByName: null,
    ...overrides,
  };
}
