import { Types } from 'mongoose';
import { searchProviders } from '../../../../src/modules/search';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { ClientModel } from '../../../../src/modules/clients/clients.model';
import { InvoiceModel } from '../../../../src/modules/finance/finance.model';
import { LeadModel } from '../../../../src/modules/crm/crm.model';
import { DealModel } from '../../../../src/modules/crm/deal.model';
import { CompanyModel } from '../../../../src/modules/crm/company.model';
import { ContactModel } from '../../../../src/modules/crm/contact.model';
import { SupportTicketModel } from '../../../../src/modules/employee/support.model';
import { ProjectModel } from '../../../../src/modules/projects/projects.model';
import { TaskModel } from '../../../../src/modules/projects/board.model';
import { BugModel } from '../../../../src/modules/bugs/bugs.model';
import { ProductModel } from '../../../../src/modules/products/products.model';
import { AssetModel } from '../../../../src/modules/assets/asset.model';
import { KbArticleModel } from '../../../../src/modules/support/kb-article.model';
import { PolicyModel } from '../../../../src/modules/legal/policy.model';
import { ContractModel } from '../../../../src/modules/legal/legal.model';
import { RiskModel } from '../../../../src/modules/compliance/risk.model';
import { FindingModel } from '../../../../src/modules/compliance/finding.model';

// Importing the declarations registers every module's provider.
import '../../../../src/modules/search/providers';

type Row = Record<string, unknown>;
interface Findable {
  find: (filter: unknown) => unknown;
}

/** Answers the model's next search with `rows`, recording the filter and limit it was given. */
function stubFind(model: Findable, rows: Row[]) {
  const limit = jest.fn(() => ({ lean: async () => rows }));
  const find = jest.spyOn(model, 'find').mockReturnValue({ limit });
  return { find, limit };
}

const providerFor = (key: string) => {
  const provider = searchProviders().find((candidate) => candidate.key === key);
  if (!provider) throw new Error(`No provider "${key}"`);
  return provider;
};

const projectId = new Types.ObjectId();
const taskLink = `/projects/${String(projectId)}/tickets`;

/** key, model, the row the collection returns, and the hit the palette must show. */
const CASES: Array<[string, Findable, Row, { title: string; subtitle: string; link: string }]> = [
  [
    'people',
    UserModel,
    { _id: 'u1', name: 'Asha Rao', department: 'Sales', email: 'asha@exyconn.test' },
    { title: 'Asha Rao', subtitle: 'Sales · asha@exyconn.test', link: '/hr/employees/u1' },
  ],
  [
    'tickets',
    SupportTicketModel,
    { _id: 't1', reference: 'TCK-1', subject: 'VPN down', status: 'OPEN', priority: 'HIGH' },
    { title: 'TCK-1 · VPN down', subtitle: 'OPEN · HIGH', link: '/support/tickets/t1' },
  ],
  [
    'invoices',
    InvoiceModel,
    { _id: 'i1', number: 'INV-0042', clientName: 'Acme', status: 'SENT' },
    { title: 'INV-0042', subtitle: 'Acme · SENT', link: '/finance/invoices' },
  ],
  [
    'clients',
    ClientModel,
    { _id: 'c1', name: 'Acme', company: 'Acme Ltd', email: 'a@acme.test' },
    { title: 'Acme', subtitle: 'Acme Ltd · a@acme.test', link: '/clients' },
  ],
  [
    'leads',
    LeadModel,
    { _id: 'l1', name: 'Acme enquiry', stage: 'NEW', owner: 'Asha' },
    { title: 'Acme enquiry', subtitle: 'NEW · Asha', link: '/crm/leads' },
  ],
  [
    'deals',
    DealModel,
    { _id: 'd1', title: 'Renewal', companyName: 'Acme', stage: 'WON', owner: 'Asha' },
    { title: 'Renewal', subtitle: 'Acme · WON · Asha', link: '/crm/deals' },
  ],
  [
    'companies',
    CompanyModel,
    { _id: 'co1', name: 'Acme', domain: 'acme.test', status: 'ACTIVE' },
    { title: 'Acme', subtitle: 'acme.test · ACTIVE', link: '/crm/companies' },
  ],
  [
    'contacts',
    ContactModel,
    { _id: 'ct1', name: 'Ravi', companyName: 'Acme', email: 'ravi@acme.test' },
    { title: 'Ravi', subtitle: 'Acme · ravi@acme.test', link: '/crm/contacts' },
  ],
  [
    'projects',
    ProjectModel,
    { _id: 'p1', key: 'EXY', name: 'Portal', status: 'ACTIVE', clientName: 'Acme' },
    { title: 'EXY · Portal', subtitle: 'ACTIVE · Acme', link: '/projects/p1/board' },
  ],
  [
    'tickets-board',
    TaskModel,
    { _id: 'k1', key: 'EXY-14', title: 'Fix login', type: 'BUG', assigneeName: 'Ravi', projectId },
    { title: 'EXY-14 · Fix login', subtitle: 'BUG · Ravi', link: taskLink },
  ],
  [
    'bugs',
    BugModel,
    { _id: 'b1', title: 'Crash', severity: 'HIGH', status: 'OPEN', projectName: 'Portal' },
    { title: 'Crash', subtitle: 'HIGH · OPEN · Portal', link: '/bugs' },
  ],
  [
    'products',
    ProductModel,
    { _id: 'pr1', name: 'Tracker', sku: 'TRK-1', category: 'Apps', status: 'ACTIVE' },
    { title: 'Tracker', subtitle: 'TRK-1 · Apps · ACTIVE', link: '/products/catalogue' },
  ],
  [
    'assets',
    AssetModel,
    { _id: 'a1', assetTag: 'LAP-7', name: 'MacBook', status: 'ASSIGNED', assignedToName: 'Ravi' },
    { title: 'LAP-7 · MacBook', subtitle: 'ASSIGNED · Ravi', link: '/it/assets/a1' },
  ],
  [
    'knowledge',
    KbArticleModel,
    { _id: 'kb1', title: 'Reset VPN', category: 'IT', summary: 'Three steps' },
    { title: 'Reset VPN', subtitle: 'IT · Three steps', link: '/support/knowledge-base' },
  ],
  [
    'policies',
    PolicyModel,
    { _id: 'po1', title: 'Leave policy', category: 'HR', status: 'PUBLISHED' },
    { title: 'Leave policy', subtitle: 'HR · PUBLISHED', link: '/me/policies' },
  ],
  [
    'contracts',
    ContractModel,
    { _id: 'ck1', title: 'Acme MSA', party: 'Acme', type: 'MSA', status: 'ACTIVE' },
    { title: 'Acme MSA', subtitle: 'Acme · MSA · ACTIVE', link: '/legal/contracts' },
  ],
  [
    'risks',
    RiskModel,
    { _id: 'r1', reference: 'RSK-3', title: 'Laptop theft', status: 'OPEN', ownerName: 'Meera' },
    { title: 'RSK-3 · Laptop theft', subtitle: 'OPEN · Meera', link: '/compliance' },
  ],
  [
    'findings',
    FindingModel,
    { _id: 'f1', reference: 'FND-1', title: 'No MFA', type: 'MAJOR', ownerName: 'Meera' },
    { title: 'FND-1 · No MFA', subtitle: 'MAJOR · Meera', link: '/compliance/findings' },
  ],
];

afterEach(() => {
  jest.restoreAllMocks();
});

describe('the search providers', () => {
  it('registers one provider per searchable module', () => {
    const keys = searchProviders().map((provider) => provider.key);

    expect(keys).toEqual(CASES.map(([key]) => key));
  });

  it.each(CASES)(
    'names a %s row, with its context and where it opens',
    async (key, model, row, hit) => {
      const { limit } = stubFind(model, [row]);

      const hits = await providerFor(key).find('acme', 3);

      expect(hits).toEqual([{ id: String(row._id), ...hit }]);
      expect(limit).toHaveBeenCalledWith(3);
    },
  );

  it('matches the query case-insensitively and literally against every declared field', async () => {
    const { find } = stubFind(DealModel, []);

    await providerFor('deals').find('a+b', 5);

    const pattern = { $regex: String.raw`a\+b`, $options: 'i' };
    expect(find).toHaveBeenCalledWith({
      $or: ['title', 'companyName', 'contactName', 'owner'].map((field) => ({ [field]: pattern })),
    });
  });

  it('leaves out subtitle parts a row does not carry, and titles nothing as empty', async () => {
    stubFind(UserModel, [{ _id: 'u2', name: 42, designation: null }]);

    await expect(providerFor('people').find('42', 5)).resolves.toEqual([
      { id: 'u2', title: '', subtitle: '', link: '/hr/employees/u2' },
    ]);
  });
});
