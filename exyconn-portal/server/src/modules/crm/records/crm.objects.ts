import type { Model } from 'mongoose';
import { LEAD_SOURCES, LEAD_STAGES, LeadModel } from '../crm.model';
import { COMPANY_SIZES, COMPANY_STATUSES, CompanyModel } from '../company.model';
import { CONTACT_STATUSES, ContactModel } from '../contact.model';

/**
 * The CRM's records described once — every property a lead, company or contact has, with its
 * type — so filtering, sorting, import mapping, export and the grid's columns are all derived
 * from the same list. A company's own custom properties (crm-property.model) join these at
 * read time (crm.schema), which is what lets a new property appear everywhere with no code.
 */
export const CRM_OBJECTS = ['LEAD', 'COMPANY', 'CONTACT'] as const;
export type CrmObject = (typeof CRM_OBJECTS)[number];

export const PROPERTY_TYPES = [
  'TEXT',
  'EMAIL',
  'PHONE',
  'URL',
  'NUMBER',
  'DATE',
  'ENUM',
  'BOOLEAN',
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export interface PropertyOption {
  value: string;
  label: string;
}

export interface PropertyDef {
  key: string;
  label: string;
  type: PropertyType;
  options: PropertyOption[];
  /** Must have a value when a record is created (form or import). */
  required: boolean;
  /** Built into the record, as opposed to one a company added. */
  builtIn: boolean;
  /** Where the value lives on the document: `name`, or `custom.<key>` for a custom one. */
  path: string;
  /** Whether an import may write it; system fields (created at, campaign) are read-only. */
  importable: boolean;
  description: string;
}

export interface ObjectDef {
  object: CrmObject;
  /** The permission module and audit name, the same ones the CRUD screens use. */
  module: string;
  plural: string;
  model: Model<Record<string, unknown>>;
  /** The property that identifies a record on import: a second row with it is the same one. */
  dedupeKey: string;
  /** What the free-text search box scans. */
  searchPaths: string[];
  builtIns: PropertyDef[];
}

/** `REAL_ESTATE` -> `Real estate`; values that are already readable (`1-10`) stay as they are. */
const labelOf = (value: string): string =>
  value.charAt(0) + value.slice(1).toLowerCase().replaceAll('_', ' ');

const options = (values: readonly string[]): PropertyOption[] =>
  values.map((value) => ({ value, label: labelOf(value) }));

interface BuiltIn {
  key: string;
  label: string;
  type?: PropertyType;
  values?: readonly string[];
  required?: boolean;
  importable?: boolean;
  description?: string;
}

const builtIn = (spec: BuiltIn): PropertyDef => ({
  key: spec.key,
  label: spec.label,
  type: spec.type ?? 'TEXT',
  options: spec.values ? options(spec.values) : [],
  required: spec.required ?? false,
  builtIn: true,
  path: spec.key,
  importable: spec.importable ?? true,
  description: spec.description ?? '',
});

const OWNER = builtIn({
  key: 'owner',
  label: 'Owner',
  description: 'Left blank on import, the person importing becomes the owner.',
});
const NOTES = builtIn({ key: 'notes', label: 'Notes' });
const CREATED = builtIn({ key: 'createdAt', label: 'Created', type: 'DATE', importable: false });
const UPDATED = builtIn({
  key: 'updatedAt',
  label: 'Last updated',
  type: 'DATE',
  importable: false,
});

export const OBJECT_DEFS: Readonly<Record<CrmObject, ObjectDef>> = {
  LEAD: {
    object: 'LEAD',
    module: 'Lead',
    plural: 'leads',
    model: LeadModel as unknown as Model<Record<string, unknown>>,
    dedupeKey: 'email',
    searchPaths: ['name', 'email', 'owner'],
    builtIns: [
      builtIn({ key: 'name', label: 'Name', required: true }),
      builtIn({ key: 'email', label: 'Email', type: 'EMAIL', required: true }),
      builtIn({ key: 'source', label: 'Source', type: 'ENUM', values: LEAD_SOURCES }),
      builtIn({ key: 'stage', label: 'Stage', type: 'ENUM', values: LEAD_STAGES }),
      builtIn({ key: 'value', label: 'Value', type: 'NUMBER' }),
      OWNER,
      builtIn({ key: 'campaignName', label: 'Campaign', importable: false }),
      NOTES,
      CREATED,
      UPDATED,
    ],
  },
  COMPANY: {
    object: 'COMPANY',
    module: 'Company',
    plural: 'companies',
    model: CompanyModel as unknown as Model<Record<string, unknown>>,
    dedupeKey: 'domain',
    searchPaths: ['name', 'domain', 'industry', 'owner'],
    builtIns: [
      builtIn({ key: 'name', label: 'Company name', required: true }),
      builtIn({
        key: 'domain',
        label: 'Domain',
        type: 'URL',
        required: true,
        description: 'The website address; https:// and www. are dropped on import.',
      }),
      builtIn({ key: 'industry', label: 'Industry' }),
      builtIn({ key: 'size', label: 'Size', type: 'ENUM', values: COMPANY_SIZES }),
      builtIn({ key: 'status', label: 'Status', type: 'ENUM', values: COMPANY_STATUSES }),
      builtIn({ key: 'phone', label: 'Phone', type: 'PHONE' }),
      builtIn({ key: 'location', label: 'Location' }),
      OWNER,
      NOTES,
      CREATED,
      UPDATED,
    ],
  },
  CONTACT: {
    object: 'CONTACT',
    module: 'Contact',
    plural: 'contacts',
    model: ContactModel as unknown as Model<Record<string, unknown>>,
    dedupeKey: 'email',
    searchPaths: ['name', 'email', 'companyName', 'title', 'owner'],
    builtIns: [
      builtIn({ key: 'name', label: 'Name', required: true }),
      builtIn({ key: 'email', label: 'Email', type: 'EMAIL', required: true }),
      builtIn({ key: 'phone', label: 'Phone', type: 'PHONE' }),
      builtIn({ key: 'title', label: 'Job title' }),
      builtIn({
        key: 'companyName',
        label: 'Company',
        description: 'Linked to the company of that name when one exists.',
      }),
      builtIn({ key: 'status', label: 'Status', type: 'ENUM', values: CONTACT_STATUSES }),
      OWNER,
      NOTES,
      CREATED,
      UPDATED,
    ],
  },
};

const BUILT_IN_KEYS: Readonly<Record<CrmObject, ReadonlySet<string>>> = {
  LEAD: new Set(OBJECT_DEFS.LEAD.builtIns.map((p) => p.key)),
  COMPANY: new Set(OBJECT_DEFS.COMPANY.builtIns.map((p) => p.key)),
  CONTACT: new Set(OBJECT_DEFS.CONTACT.builtIns.map((p) => p.key)),
};

/** Whether a key is taken by a built-in property, so a custom one cannot shadow it. */
export const isBuiltInKey = (object: CrmObject, key: string): boolean =>
  BUILT_IN_KEYS[object].has(key);
