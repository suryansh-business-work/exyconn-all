import type { DeliveryRow } from '../../../../src/pages/deliveries/deliveries-grid';

/** One delivery attempt as the paged log returns it. */
export const delivery = (overrides: Partial<DeliveryRow> = {}): DeliveryRow => ({
  __typename: 'WebhookDeliveryRow',
  id: 'del-1',
  webhookId: 'hook-1',
  webhookName: 'CRM bridge',
  event: 'invoice.paid',
  status: 'FAILED',
  attempts: 2,
  responseStatus: 502,
  error: 'Bad gateway',
  payload: '{"event":"invoice.paid","data":{"invoiceId":"inv-1"}}',
  nextAttemptAt: '2026-10-31T10:05:00.000Z',
  deliveredAt: null,
  createdAt: '2026-10-31T10:00:00.000Z',
  ...overrides,
});
