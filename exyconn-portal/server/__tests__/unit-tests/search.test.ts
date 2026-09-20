import { searchEverything } from '../../src/modules/search';
import { escapeForRegex } from '../../src/modules/search/search.text';
import {
  clearSearchProviders,
  registerSearchProvider,
  searchProviders,
} from '../../src/modules/search/search.registry';
import { UserModel } from '../../src/modules/admin/user.model';
import { InvoiceModel } from '../../src/modules/finance/finance.model';
import { LeadModel } from '../../src/modules/crm/crm.model';
import { ROLES } from '../../src/constants/roles';
import { useTestOrganization } from '../helpers';

// Importing the declarations registers every module's provider.
import '../../src/modules/search/providers';

const registered = [...searchProviders()];

function restoreRealProviders() {
  clearSearchProviders();
  for (const provider of registered) {
    registerSearchProvider(provider);
  }
}

async function seedPeople() {
  await UserModel.create({
    name: 'Asha Rao',
    email: 'asha@exyconn.com',
    passwordHash: 'x',
    roles: [ROLES.EMPLOYEE],
    designation: 'Account manager',
    department: 'Sales',
    isActive: true,
  });
}

describe('the search box', () => {
  useTestOrganization();
  afterEach(restoreRealProviders);

  it('ignores a query too short to mean anything', async () => {
    await seedPeople();

    expect(await searchEverything('a', [ROLES.ADMIN])).toEqual([]);
  });

  it('finds a colleague by any part of their name or title', async () => {
    await seedPeople();

    const groups = await searchEverything('rao', [ROLES.EMPLOYEE]);
    const people = groups.find((group) => group.key === 'people');

    expect(people?.hits[0]).toMatchObject({
      title: 'Asha Rao',
      subtitle: 'Account manager · Sales · asha@exyconn.com',
    });
    expect(people?.hits[0].link).toContain('/hr/employees/');
  });

  it('only searches what the caller may open', async () => {
    await InvoiceModel.create({
      number: 'INV-0042',
      clientId: 'c1',
      clientName: 'Acme Ltd',
      amount: 1000,
      currency: 'INR',
      status: 'SENT',
      issuedDate: new Date(),
      dueDate: new Date(),
    });
    await LeadModel.create({
      name: 'Acme enquiry',
      email: 'hello@acme.com',
      source: 'WEBSITE',
      stage: 'NEW',
      value: 0,
      owner: 'Asha Rao',
    });

    const asFinance = await searchEverything('acme', [ROLES.FINANCE]);
    const asCrm = await searchEverything('acme', [ROLES.CRM]);
    const asAdmin = await searchEverything('acme', [ROLES.ADMIN]);

    expect(asFinance.map((group) => group.key)).toEqual(['invoices']);
    expect(asCrm.map((group) => group.key)).toEqual(['leads']);
    const adminKeys = asAdmin.map((group) => group.key);
    expect([...adminKeys].sort((a, b) => a.localeCompare(b))).toEqual(['invoices', 'leads']);
  });

  it('leaves out modules that matched nothing', async () => {
    await seedPeople();

    const groups = await searchEverything('zzzzz', [ROLES.ADMIN]);

    expect(groups).toEqual([]);
  });

  it('keeps going when one module throws', async () => {
    clearSearchProviders();
    registerSearchProvider({
      key: 'broken',
      label: 'Broken',
      roles: [ROLES.ADMIN],
      find: () => Promise.reject(new Error('no')),
    });
    registerSearchProvider({
      key: 'working',
      label: 'Working',
      roles: [ROLES.ADMIN],
      find: async () => [{ id: '1', title: 'Still here', subtitle: '', link: '/me' }],
    });

    const groups = await searchEverything('anything', [ROLES.ADMIN]);

    expect(groups.map((group) => group.key)).toEqual(['working']);
  });

  it('treats a query as text, never as a pattern', async () => {
    await seedPeople();

    expect(escapeForRegex('a.*(b)')).toBe(String.raw`a\.\*\(b\)`);
    expect(await searchEverything('.*', [ROLES.ADMIN])).toEqual([]);
  });

  it('refuses two providers under one key', () => {
    const provider = { key: 'twice', label: 'Twice', roles: [ROLES.ADMIN], find: async () => [] };
    clearSearchProviders();
    registerSearchProvider(provider);

    expect(() => registerSearchProvider(provider)).toThrow('twice');
  });
});
