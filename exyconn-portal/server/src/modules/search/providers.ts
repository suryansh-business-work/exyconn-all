import { registerSearchProvider, type SearchHit } from './search.registry';
import { containsAny } from './search.text';
import { ROLES } from '../../constants/roles';
import { UserModel } from '../admin/user.model';
import { ClientModel } from '../clients/clients.model';
import { InvoiceModel } from '../finance/finance.model';
import { LeadModel } from '../crm/crm.model';
import { DealModel } from '../crm/deal.model';
import { CompanyModel } from '../crm/company.model';
import { ContactModel } from '../crm/contact.model';
import { SupportTicketModel } from '../employee/support.model';
import { ProjectModel } from '../projects/projects.model';
import { TaskModel } from '../projects/board.model';
import { BugModel } from '../bugs/bugs.model';
import { ProductModel } from '../products/products.model';
import { AssetModel } from '../assets/asset.model';
import { KbArticleModel } from '../support/kb-article.model';
import { PolicyModel } from '../legal/policy.model';
import { ContractModel } from '../legal/legal.model';
import { RiskModel } from '../compliance/risk.model';
import { FindingModel } from '../compliance/finding.model';

/**
 * Where the search box can take somebody.
 *
 * One file rather than a provider inside each module: these are twenty near-identical
 * "match these fields, name the row, link to the screen" declarations, and keeping them
 * together is what makes it obvious when a new module has been forgotten.
 *
 * Every link carries the portal's own path prefix, because the palette is shown in every
 * app and a result may well live in another one.
 */

/** A lean row as these queries return it. */
type Row = Record<string, unknown> & { _id: unknown };

const id = (row: Row) => String(row._id);
const text = (value: unknown): string => (typeof value === 'string' ? value : '');

/** Joins the parts of a subtitle that are actually there, so none reads "— —". */
const subtitle = (...parts: unknown[]): string => parts.map(text).filter(Boolean).join(' · ');

interface Declaration {
  key: string;
  label: string;
  roles: (typeof ROLES)[keyof typeof ROLES][];
  /** The collection to search. Structural, so every model fits without a cast. */
  model: {
    find(filter: unknown): { limit(n: number): { lean(): Promise<Row[]> } };
  };
  /** Fields a query is matched against. */
  fields: string[];
  hit: (row: Row) => Omit<SearchHit, 'id'>;
}

const DECLARATIONS: Declaration[] = [
  {
    key: 'people',
    label: 'People',
    // Everybody can look a colleague up: the directory is already on every profile page.
    roles: [ROLES.EMPLOYEE],
    model: UserModel as never,
    fields: ['name', 'email', 'designation', 'department'],
    hit: (row) => ({
      title: text(row.name),
      subtitle: subtitle(row.designation, row.department, row.email),
      link: `/hr/employees/${id(row)}`,
    }),
  },
  {
    key: 'tickets',
    label: 'Support tickets',
    roles: [ROLES.SUPPORT, ROLES.IT],
    model: SupportTicketModel as never,
    fields: ['reference', 'subject', 'requesterName', 'requesterEmail'],
    hit: (row) => ({
      title: subtitle(row.reference, row.subject),
      subtitle: subtitle(row.status, row.priority, row.requesterName),
      link: `/support/tickets/${id(row)}`,
    }),
  },
  {
    key: 'invoices',
    label: 'Invoices',
    roles: [ROLES.FINANCE],
    model: InvoiceModel as never,
    fields: ['number', 'clientName'],
    hit: (row) => ({
      title: text(row.number),
      subtitle: subtitle(row.clientName, row.status),
      link: '/finance/invoices',
    }),
  },
  {
    key: 'clients',
    label: 'Clients',
    roles: [ROLES.FINANCE, ROLES.CRM],
    model: ClientModel as never,
    fields: ['name', 'company', 'email'],
    hit: (row) => ({
      title: text(row.name),
      subtitle: subtitle(row.company, row.email),
      link: '/clients',
    }),
  },
  {
    key: 'leads',
    label: 'Leads',
    roles: [ROLES.CRM],
    model: LeadModel as never,
    fields: ['name', 'email', 'owner'],
    hit: (row) => ({
      title: text(row.name),
      subtitle: subtitle(row.stage, row.owner, row.email),
      link: '/crm/leads',
    }),
  },
  {
    key: 'deals',
    label: 'Deals',
    roles: [ROLES.CRM],
    model: DealModel as never,
    fields: ['title', 'companyName', 'contactName', 'owner'],
    hit: (row) => ({
      title: text(row.title),
      subtitle: subtitle(row.companyName, row.stage, row.owner),
      link: '/crm/deals',
    }),
  },
  {
    key: 'companies',
    label: 'Companies',
    roles: [ROLES.CRM],
    model: CompanyModel as never,
    fields: ['name', 'domain', 'owner'],
    hit: (row) => ({
      title: text(row.name),
      subtitle: subtitle(row.domain, row.status),
      link: '/crm/companies',
    }),
  },
  {
    key: 'contacts',
    label: 'Contacts',
    roles: [ROLES.CRM],
    model: ContactModel as never,
    fields: ['name', 'email', 'companyName'],
    hit: (row) => ({
      title: text(row.name),
      subtitle: subtitle(row.companyName, row.email),
      link: '/crm/contacts',
    }),
  },
  {
    key: 'projects',
    label: 'Projects',
    roles: [ROLES.PROJECTS],
    model: ProjectModel as never,
    fields: ['name', 'key', 'clientName'],
    hit: (row) => ({
      title: subtitle(row.key, row.name),
      subtitle: subtitle(row.status, row.clientName),
      link: `/projects/${id(row)}/board`,
    }),
  },
  {
    key: 'tickets-board',
    label: 'Project tickets',
    roles: [ROLES.PROJECTS],
    model: TaskModel as never,
    fields: ['key', 'title', 'assigneeName'],
    hit: (row) => ({
      title: subtitle(row.key, row.title),
      subtitle: subtitle(row.type, row.priority, row.assigneeName),
      link: `/projects/${text(row.projectId)}/tickets`,
    }),
  },
  {
    key: 'bugs',
    label: 'Bugs',
    roles: [ROLES.PROJECTS],
    model: BugModel as never,
    fields: ['title', 'projectName', 'assigneeName'],
    hit: (row) => ({
      title: text(row.title),
      subtitle: subtitle(row.severity, row.status, row.projectName),
      link: '/bugs',
    }),
  },
  {
    key: 'products',
    label: 'Products',
    roles: [ROLES.PRODUCTS],
    model: ProductModel as never,
    fields: ['name', 'sku', 'category'],
    hit: (row) => ({
      title: text(row.name),
      subtitle: subtitle(row.sku, row.category, row.status),
      link: '/products/catalogue',
    }),
  },
  {
    key: 'assets',
    label: 'IT assets',
    roles: [ROLES.IT],
    model: AssetModel as never,
    fields: ['name', 'assetTag', 'serialNumber', 'assignedToName'],
    hit: (row) => ({
      title: subtitle(row.assetTag, row.name),
      subtitle: subtitle(row.status, row.assignedToName),
      link: `/it/assets/${id(row)}`,
    }),
  },
  {
    key: 'knowledge',
    label: 'Knowledge base',
    // Deliberately open: the point of a knowledge base is that anybody can find the answer.
    roles: [ROLES.EMPLOYEE],
    model: KbArticleModel as never,
    fields: ['title', 'summary'],
    hit: (row) => ({
      title: text(row.title),
      subtitle: subtitle(row.category, row.summary),
      link: '/support/knowledge-base',
    }),
  },
  {
    key: 'policies',
    label: 'Policies',
    roles: [ROLES.EMPLOYEE],
    model: PolicyModel as never,
    fields: ['title', 'slug'],
    hit: (row) => ({
      title: text(row.title),
      subtitle: subtitle(row.category, row.status),
      link: '/me/policies',
    }),
  },
  {
    key: 'contracts',
    label: 'Contracts',
    roles: [ROLES.LEGAL],
    model: ContractModel as never,
    fields: ['title', 'party'],
    hit: (row) => ({
      title: text(row.title),
      subtitle: subtitle(row.party, row.type, row.status),
      link: '/legal/contracts',
    }),
  },
  {
    key: 'risks',
    label: 'Risks',
    roles: [ROLES.COMPLIANCE],
    model: RiskModel as never,
    fields: ['reference', 'title', 'ownerName'],
    hit: (row) => ({
      title: subtitle(row.reference, row.title),
      subtitle: subtitle(row.status, row.ownerName),
      link: '/compliance',
    }),
  },
  {
    key: 'findings',
    label: 'Findings',
    roles: [ROLES.COMPLIANCE],
    model: FindingModel as never,
    fields: ['reference', 'title', 'ownerName'],
    hit: (row) => ({
      title: subtitle(row.reference, row.title),
      subtitle: subtitle(row.type, row.status, row.ownerName),
      link: '/compliance/findings',
    }),
  },
];

for (const declaration of DECLARATIONS) {
  registerSearchProvider({
    key: declaration.key,
    label: declaration.label,
    roles: declaration.roles,
    async find(query, limit) {
      const rows = await declaration.model
        .find(containsAny(declaration.fields, query))
        .limit(limit)
        .lean();
      return rows.map((row) => ({ id: id(row), ...declaration.hit(row) }));
    },
  });
}
