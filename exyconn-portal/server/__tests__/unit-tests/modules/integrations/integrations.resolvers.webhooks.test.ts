import { lookup } from 'node:dns/promises';
import { Types } from 'mongoose';
import { integrationsResolvers, WEBHOOK_EVENTS } from '../../../../src/modules/integrations';
import {
  WebhookDeliveryModel,
  WebhookModel,
} from '../../../../src/modules/integrations/webhook.model';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';
import ips from '../../../fixtures/ips.json';

// The endpoint's host is resolved before it is accepted; the hosts here are fictional, so they
// resolve to a public address unless a test says otherwise.
jest.mock('node:dns/promises', () =>
  jest
    .requireActual<typeof import('../../../fixtures/publicDns')>('../../../fixtures/publicDns')
    .publicDnsMock(),
);

const as = (roles: Role[]): GraphQLContext => ({
  user: { id: 'u1', email: 'admin@acme.test', roles },
});
const admin = as([ROLES.ADMIN]);
const URL_OK = 'https://receiver.example.com/hook';

const { Query, Mutation } = integrationsResolvers;
const create = (events: string[], url = URL_OK, ctx = admin) =>
  Mutation.createWebhook(null, { name: 'Ops', url, events }, ctx);

describe('createWebhook', () => {
  it('creates an endpoint and returns its signing secret once', async () => {
    const created = await create(['invoice.paid', 'deal.won']);

    expect(created.secret).toMatch(/^whsec_[\w-]{32}$/);
    const row = await WebhookModel.findById(created.webhook.id).lean();
    expect(row).toMatchObject({
      url: URL_OK,
      events: ['invoice.paid', 'deal.won'],
      secret: created.secret,
      active: true,
      createdBy: 'admin@acme.test',
    });
  });

  it('refuses a plain http address', async () => {
    await expect(create(['invoice.paid'], 'http://receiver.example.com/hook')).rejects.toThrow(
      'A webhook URL must be https.',
    );
  });

  it('refuses an address that resolves into a private network', async () => {
    jest.mocked(lookup).mockResolvedValueOnce([{ address: ips.ip10_0_0_7, family: 4 }] as never);

    await expect(codeOf(create(['invoice.paid']))).resolves.toBe('BAD_USER_INPUT');
    expect(await WebhookModel.countDocuments()).toBe(0);
  });

  it('refuses an endpoint subscribed to nothing', async () => {
    await expect(create([])).rejects.toThrow(
      'Choose at least one event, or the endpoint will never fire.',
    );
  });

  it('refuses an event this portal never emits', async () => {
    await expect(create(['invoice.paid', 'invoice.voided'])).rejects.toThrow(
      'Not an event this portal emits: invoice.voided',
    );
    expect(await WebhookModel.countDocuments()).toBe(0);
  });

  it('refuses a non-administrator', async () => {
    await expect(codeOf(create(['invoice.paid'], URL_OK, as([ROLES.TECH])))).resolves.toBe(
      'FORBIDDEN',
    );
  });
});

describe('webhook queries', () => {
  it('lists the events an endpoint may subscribe to, as a copy', () => {
    const events = Query.webhookEvents(null, {}, admin);

    expect(events).toEqual([...WEBHOOK_EVENTS]);
    expect(events).not.toBe(WEBHOOK_EVENTS);
  });

  it('lists endpoints newest first without their secrets', async () => {
    await WebhookModel.create({
      name: 'Older',
      url: URL_OK,
      events: ['lead.created'],
      secret: `whsec_${'a'.repeat(8)}`,
      createdAt: new Date('2026-01-01'),
    });
    await WebhookModel.create({
      name: 'Newer',
      url: URL_OK,
      events: ['deal.won'],
      secret: `whsec_${'b'.repeat(8)}`,
      createdAt: new Date('2026-06-01'),
    });

    const rows = await Query.listWebhooks(null, {}, admin);

    expect(rows.map((row) => row.name)).toEqual(['Newer', 'Older']);
    expect(rows.every((row) => !('secret' in row))).toBe(true);
  });

  it('lists one endpoint’s latest hundred deliveries, newest first', async () => {
    const webhookId = new Types.ObjectId().toHexString();
    const base = Date.parse('2026-10-01T00:00:00.000Z');
    await WebhookDeliveryModel.insertMany([
      ...Array.from({ length: 101 }, (_unused, minute) => ({
        webhookId,
        event: 'invoice.paid',
        payload: `{"n":${minute}}`,
        createdAt: new Date(base + minute * 60_000),
      })),
      { webhookId: 'someone-else', event: 'deal.won', payload: '{}' },
    ]);

    const rows = await Query.listWebhookDeliveries(null, { webhookId }, admin);

    expect(rows).toHaveLength(100);
    expect(rows[0].payload).toBe('{"n":100}');
    expect(rows.at(-1)?.payload).toBe('{"n":1}');
    expect(rows.every((row) => row.webhookId === webhookId)).toBe(true);
  });

  it('refuses every listing to a non-administrator', async () => {
    const hr = as([ROLES.HR]);

    expect(() => Query.webhookEvents(null, {}, hr)).toThrow('You do not have access');
    await expect(codeOf(Query.listWebhooks(null, {}, hr))).resolves.toBe('FORBIDDEN');
    await expect(codeOf(Query.listWebhookDeliveries(null, { webhookId: 'x' }, hr))).resolves.toBe(
      'FORBIDDEN',
    );
  });
});

describe('managing an endpoint', () => {
  it('switches an endpoint off and on again', async () => {
    const { webhook } = await create(['invoice.paid']);

    const off = await Mutation.setWebhookActive(null, { id: webhook.id, active: false }, admin);
    expect(off.active).toBe(false);
    const on = await Mutation.setWebhookActive(null, { id: webhook.id, active: true }, admin);
    expect(on.active).toBe(true);
  });

  it('reports an endpoint that does not exist', async () => {
    const id = new Types.ObjectId().toHexString();

    await expect(
      codeOf(Mutation.setWebhookActive(null, { id, active: false }, admin)),
    ).resolves.toBe('NOT_FOUND');
  });

  it('deletes an endpoint, and answers true even when it was already gone', async () => {
    const { webhook } = await create(['invoice.paid']);

    await expect(Mutation.deleteWebhook(null, { id: webhook.id }, admin)).resolves.toBe(true);
    expect(await WebhookModel.countDocuments()).toBe(0);
    await expect(Mutation.deleteWebhook(null, { id: webhook.id }, admin)).resolves.toBe(true);
  });

  it('refuses a non-administrator', async () => {
    const { webhook } = await create(['invoice.paid']);
    const crm = as([ROLES.CRM]);

    await expect(
      codeOf(Mutation.setWebhookActive(null, { id: webhook.id, active: false }, crm)),
    ).resolves.toBe('FORBIDDEN');
    await expect(codeOf(Mutation.deleteWebhook(null, { id: webhook.id }, crm))).resolves.toBe(
      'FORBIDDEN',
    );
    expect(await WebhookModel.countDocuments()).toBe(1);
  });
});
