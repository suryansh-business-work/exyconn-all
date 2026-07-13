import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app';
import { ROLES } from '../../src/constants/roles';
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
});
