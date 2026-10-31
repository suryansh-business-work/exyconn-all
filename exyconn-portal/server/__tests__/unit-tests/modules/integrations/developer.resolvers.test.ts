import { Types } from 'mongoose';
import { buildASTSchema, buildSchema, concatAST } from 'graphql';
import { typeDefs } from '../../../../src/graphql';
import { developerResolvers } from '../../../../src/modules/integrations/developer.resolvers';
import { ApiKeyModel } from '../../../../src/modules/integrations/api-key.model';
import { ApiKeyUsageModel } from '../../../../src/modules/integrations/api-key-usage.model';
import { generateApiKey } from '../../../../src/modules/integrations/api-key.service';
import {
  WEBHOOK_EVENTS,
  WebhookDeliveryModel,
  WebhookModel,
} from '../../../../src/modules/integrations/webhook.model';
import * as catalogue from '../../../../src/modules/mcp/core/mcp.catalogue';
import { runForOrganization } from '../../../../src/lib/tenant';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';

const organizationId = useTestOrganization();
const otherCompany = new Types.ObjectId().toHexString();
const { Query } = developerResolvers;
const PAGE = { input: { page: 0, pageSize: 50 } };
const MISSING = '64b000000000000000000099';

const as = (roles: Role[]): GraphQLContext => ({
  user: { id: 'u1', email: 'dev@exyconn.com', roles, organizationId },
});
const admin = as([ROLES.ADMIN]);
const crm = as([ROLES.CRM]);

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

async function storeKey() {
  const issued = generateApiKey();
  const row = await ApiKeyModel.create({
    name: 'ERP sync',
    prefix: issued.prefix,
    keyHash: issued.keyHash,
    roles: [ROLES.CRM],
  });
  return row._id.toHexString();
}

beforeAll(() => {
  catalogue.useSchema(buildASTSchema(concatAST(typeDefs.flat()), { assumeValidSDL: true }));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('apiKeyUsage', () => {
  it('counts each of the last days, oldest first, with quiet days as zero', async () => {
    const id = await storeKey();
    const other = await storeKey();
    await ApiKeyUsageModel.create([
      { apiKeyId: id, day: today(), count: 7 },
      { apiKeyId: id, day: daysAgo(2), count: 3 },
      { apiKeyId: id, day: daysAgo(10), count: 99 },
      { apiKeyId: other, day: today(), count: 50 },
    ]);

    const usage = await Query.apiKeyUsage(null, { id, days: 3 }, admin);

    expect(usage).toEqual([
      { day: daysAgo(2), count: 3 },
      { day: daysAgo(1), count: 0 },
      { day: today(), count: 7 },
    ]);
  });

  it.each([0, 91, 2.5])('refuses %s days', async (days) => {
    const id = await storeKey();

    await expect(Query.apiKeyUsage(null, { id, days }, admin)).rejects.toThrow(
      /between 1 and 90 days/,
    );
  });

  it('treats an unknown or another company’s key as not found', async () => {
    const elsewhere = await runForOrganization(otherCompany, storeKey);

    for (const id of [MISSING, elsewhere]) {
      await expect(Query.apiKeyUsage(null, { id, days: 7 }, admin)).rejects.toThrow(
        /API key not found/,
      );
    }
  });
});

describe('webhookEventCatalogue', () => {
  it('documents every event in the order they are declared, the vendor portal ones included', () => {
    const events = Query.webhookEventCatalogue(null, null, admin);

    expect(events.map((row) => row.event)).toEqual([...WEBHOOK_EVENTS]);
    expect(events.find((row) => row.event === 'vendor_invoice.submitted')).toMatchObject({
      module: 'Products',
      fields: expect.arrayContaining(['vendorInvoiceId', 'orderTotal']),
    });
    expect(events.every((row) => row.description !== '' && row.fields.length > 0)).toBe(true);
  });
});

describe('webhook delivery log', () => {
  it('names each delivery’s endpoint, and leaves the name blank once the endpoint is gone', async () => {
    const hook = await WebhookModel.create({
      name: 'ERP',
      url: 'https://erp.test/hook',
      events: ['invoice.paid'],
      secret: 'whsec_test',
    });
    const base = { event: 'invoice.paid', payload: '{}', nextAttemptAt: new Date() };
    await WebhookDeliveryModel.create([
      { ...base, webhookId: String(hook._id), status: 'DELIVERED' },
      { ...base, webhookId: MISSING, status: 'FAILED' },
    ]);

    const page = await Query.listWebhookDeliveriesPaged(null, PAGE, admin);

    expect(page.totalCount).toBe(2);
    const names = Object.fromEntries(
      (page.rows as unknown as Array<{ status: string; webhookName: string }>).map((row) => [
        row.status,
        row.webhookName,
      ]),
    );
    expect(names).toEqual({ DELIVERED: 'ERP', FAILED: '' });
    const stats = await Query.listWebhookDeliveriesStats(null, null, admin);
    expect(stats).toMatchObject({ total: 2 });
  });
});

describe('apiReference', () => {
  it('lists a module’s operations with the first paragraph, arguments, return type and example', () => {
    const operations = Query.apiReference(null, { endpoint: 'PRODUCTS' }, admin);

    const approve = operations.find((row) => row.name === 'approveVendorInvoice');
    expect(approve).toMatchObject({ kind: 'MUTATION', returnType: 'VendorInvoice!' });
    expect(approve?.description).not.toContain('\n\n');
    expect(approve?.arguments).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'id' })]),
    );
    expect(approve?.example).toContain('approveVendorInvoice');
    const contacts = operations.find((row) => row.name === 'vendorContacts');
    expect(contacts).toMatchObject({ kind: 'QUERY', returnType: '[VendorContact!]!' });
  });

  it('answers an empty return type for an operation the live schema no longer has', () => {
    jest.spyOn(catalogue, 'liveSchema').mockReturnValue(buildSchema('type Query { ping: Int }'));

    const operations = Query.apiReference(null, { endpoint: 'PRODUCTS' }, admin);

    expect(operations.length).toBeGreaterThan(0);
    expect(new Set(operations.map((row) => row.returnType))).toEqual(new Set(['']));
  });

  it('refuses the combined endpoint', () => {
    expect(() => Query.apiReference(null, { endpoint: 'ALL' }, admin)).toThrow(/one module/);
  });
});

describe('developer portal access', () => {
  it('is an administrator’s alone', async () => {
    const calls: Array<() => unknown> = [
      () => Query.apiKeyUsage(null, { id: MISSING, days: 7 }, crm),
      () => Query.webhookEventCatalogue(null, null, crm),
      () => Query.listWebhookDeliveriesPaged(null, PAGE, crm),
      () => Query.listWebhookDeliveriesStats(null, null, crm),
      () => Query.apiReference(null, { endpoint: 'CRM' }, crm),
    ];
    for (const call of calls) {
      expect(await codeOf(Promise.resolve().then(call))).toBe('FORBIDDEN');
    }
    expect(
      await codeOf(
        Promise.resolve().then(() => Query.webhookEventCatalogue(null, null, { user: null })),
      ),
    ).toBe('UNAUTHENTICATED');
  });
});
