import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app';
import { ROLES } from '../../src/constants/roles';
import { UserModel } from '../../src/modules/admin/user.model';
import { seedUser } from '../helpers';

let app: Express;

const gql = (query: string, variables?: Record<string, unknown>, token?: string) => {
  const req = request(app).post('/graphql').send({ query, variables });
  if (token) req.set('Authorization', `Bearer ${token}`);
  return req;
};

beforeAll(async () => {
  app = await createApp();
});

async function loginAsAdmin(): Promise<string> {
  await seedUser('admin@exyconn.com', 'Admin@1234', [ROLES.ADMIN]);
  const res = await gql(
    `mutation($e:String!,$p:String!){ login(email:$e,password:$p){ token user{ roles } } }`,
    { e: 'admin@exyconn.com', p: 'Admin@1234' },
  );
  return res.body.data.login.token;
}

describe('GraphQL e2e', () => {
  it('rejects unauthenticated access to a guarded query', async () => {
    const res = await gql(`{ listInvoices { id } }`);
    expect(res.body.errors?.[0].extensions.code).toBe('UNAUTHENTICATED');
  });

  it('logs in and performs invoice CRUD as ADMIN', async () => {
    const token = await loginAsAdmin();
    expect(token).toEqual(expect.any(String));

    const create = await gql(
      `mutation($i:InvoiceInput!){ createInvoice(input:$i){ id number status amount } }`,
      {
        i: {
          number: 'INV-001',
          clientId: 'c1',
          amount: 1500,
          currency: 'INR',
          status: 'DRAFT',
          issuedDate: '2026-01-01T00:00:00.000Z',
          dueDate: '2026-02-01T00:00:00.000Z',
        },
      },
      token,
    );
    expect(create.body.errors).toBeUndefined();
    const id = create.body.data.createInvoice.id;
    expect(create.body.data.createInvoice.number).toBe('INV-001');

    const list = await gql(`{ listInvoices { id number } }`, undefined, token);
    expect(list.body.data.listInvoices).toHaveLength(1);

    const update = await gql(
      `mutation($id:ID!,$i:InvoiceInput!){ updateInvoice(id:$id,input:$i){ status } }`,
      {
        id,
        i: {
          number: 'INV-001',
          clientId: 'c1',
          amount: 1500,
          currency: 'INR',
          status: 'PAID',
          issuedDate: '2026-01-01T00:00:00.000Z',
          dueDate: '2026-02-01T00:00:00.000Z',
        },
      },
      token,
    );
    expect(update.body.data.updateInvoice.status).toBe('PAID');

    const del = await gql(`mutation($id:ID!){ deleteInvoice(id:$id) }`, { id }, token);
    expect(del.body.data.deleteInvoice).toBe(true);
  });

  it('forbids a non-matching role from another module', async () => {
    await seedUser('hr@exyconn.com', 'Hr@12345', [ROLES.HR]);
    const login = await gql(
      `mutation($e:String!,$p:String!){ login(email:$e,password:$p){ token } }`,
      { e: 'hr@exyconn.com', p: 'Hr@12345' },
    );
    const token = login.body.data.login.token;
    const res = await gql(`{ listInvoices { id } }`, undefined, token);
    expect(res.body.errors?.[0].extensions.code).toBe('FORBIDDEN');
  });

  it('serves a server-side page of users with a total count', async () => {
    const token = await loginAsAdmin();
    await seedUser('paged-a@exyconn.com', 'Pass@123', [ROLES.EMPLOYEE]);
    await seedUser('paged-b@exyconn.com', 'Pass@123', [ROLES.EMPLOYEE]);

    const query = `query($i:TableQueryInput!){ listUsersPaged(input:$i){ totalCount rows { id email } } }`;

    const firstPage = await gql(query, { i: { page: 0, pageSize: 2 } }, token);
    expect(firstPage.body.errors).toBeUndefined();
    expect(firstPage.body.data.listUsersPaged.totalCount).toBe(3); // admin + 2 seeded
    expect(firstPage.body.data.listUsersPaged.rows).toHaveLength(2);
    expect(firstPage.body.data.listUsersPaged.rows[0].id).toEqual(expect.any(String));

    const searched = await gql(
      query,
      { i: { page: 0, pageSize: 10, search: 'paged-a' } },
      token,
    );
    expect(searched.body.data.listUsersPaged.totalCount).toBe(1);
    expect(searched.body.data.listUsersPaged.rows[0].email).toBe('paged-a@exyconn.com');
  });

  it('cuts a user off the instant their account is deactivated or blocked', async () => {
    const user = await seedUser('revoke@exyconn.com', 'Pass@123', [ROLES.FINANCE]);
    const login = await gql(
      `mutation($e:String!,$p:String!){ login(email:$e,password:$p){ token } }`,
      { e: 'revoke@exyconn.com', p: 'Pass@123' },
    );
    const token = login.body.data.login.token;

    // The token works while the account is active.
    const before = await gql(`{ listInvoices { id } }`, undefined, token);
    expect(before.body.errors).toBeUndefined();

    // Deactivating in the DB rejects the SAME token on its next request.
    await UserModel.findByIdAndUpdate(user.id, { isActive: false });
    const deactivated = await gql(`{ listInvoices { id } }`, undefined, token);
    expect(deactivated.body.errors?.[0].extensions.code).toBe('UNAUTHENTICATED');

    // Re-activating but blocking also rejects it.
    await UserModel.findByIdAndUpdate(user.id, { isActive: true, isBlocked: true });
    const blocked = await gql(`{ listInvoices { id } }`, undefined, token);
    expect(blocked.body.errors?.[0].extensions.code).toBe('UNAUTHENTICATED');
  });

  it('summarises a module in one server-side stats aggregation', async () => {
    const token = await loginAsAdmin();
    const make = (number: string, status: string, amount: number) =>
      gql(
        `mutation($i:InvoiceInput!){ createInvoice(input:$i){ id } }`,
        {
          i: {
            number,
            clientId: 'c1',
            amount,
            currency: 'INR',
            status,
            issuedDate: '2026-01-01T00:00:00.000Z',
            dueDate: '2026-02-01T00:00:00.000Z',
          },
        },
        token,
      );
    await make('S1', 'PAID', 1000);
    await make('S2', 'PAID', 500);
    await make('S3', 'OVERDUE', 200);

    const res = await gql(
      `{ listInvoicesStats { total counts { field buckets { value count } } sums { field total } } }`,
      undefined,
      token,
    );
    const stats = res.body.data.listInvoicesStats;
    expect(stats.total).toBe(3);
    expect(stats.sums.find((s: { field: string }) => s.field === 'amount').total).toBe(1700);
    const status = stats.counts.find((c: { field: string }) => c.field === 'status');
    expect(status.buckets.find((b: { value: string }) => b.value === 'PAID').count).toBe(2);
  });

  it('applies a newly assigned role immediately, without a re-login', async () => {
    const user = await seedUser('grantee@exyconn.com', 'Grant@123', [ROLES.EMPLOYEE]);
    const login = await gql(
      `mutation($e:String!,$p:String!){ login(email:$e,password:$p){ token } }`,
      { e: 'grantee@exyconn.com', p: 'Grant@123' },
    );
    const token = login.body.data.login.token;

    // The freshly-minted token carries only EMPLOYEE, so a FINANCE query is refused.
    const before = await gql(`{ listInvoices { id } }`, undefined, token);
    expect(before.body.errors?.[0].extensions.code).toBe('FORBIDDEN');

    // An admin grants FINANCE in the database; the 7-day token is never reissued.
    await UserModel.findByIdAndUpdate(user.id, { roles: [ROLES.EMPLOYEE, ROLES.FINANCE] });

    // The same token now passes, because the context re-reads roles from the database.
    const after = await gql(`{ listInvoices { id } }`, undefined, token);
    expect(after.body.errors).toBeUndefined();
    expect(after.body.data.listInvoices).toEqual([]);
  });
});
