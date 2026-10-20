import { CONTACT_STATUSES } from '../crm/contact.model';
import { COMPANY_SIZES, COMPANY_STATUSES } from '../crm/company.model';
import { LIFECYCLE_STAGES } from '../crm/crm.profile';
import { VERIFICATION_STATUSES } from '../email-verification/email-verification.model';
import type { RuleOperator } from './audience.model';

/** Which record a condition reads. EMAIL conditions are judged per address, not per record. */
export type FilterEntity = 'CONTACT' | 'COMPANY' | 'EMAIL';

/** How a field is compared, which decides the operators it offers. */
export type FilterKind = 'ENUM' | 'TEXT' | 'TAGS' | 'LAST_CONTACTED' | 'EMAIL_STATUS';

/** The verification state of an address nobody has checked yet. */
export const UNCHECKED = 'UNCHECKED';

export interface FilterField {
  key: string;
  /** English source string; the portal translates it. */
  label: string;
  entity: FilterEntity;
  /** The stored path on the record; empty for derived fields. */
  path: string;
  kind: FilterKind;
  /** The fixed values of an ENUM/EMAIL_STATUS field; TEXT and TAGS values are read from the data. */
  values: readonly string[];
}

export const OPERATORS_BY_KIND: Readonly<Record<FilterKind, readonly RuleOperator[]>> = {
  ENUM: ['EQUALS', 'NOT_EQUALS'],
  TEXT: ['EQUALS', 'NOT_EQUALS', 'CONTAINS', 'IS_EMPTY', 'IS_NOT_EMPTY'],
  TAGS: ['EQUALS', 'NOT_EQUALS', 'IS_EMPTY', 'IS_NOT_EMPTY'],
  LAST_CONTACTED: ['NEVER', 'WITHIN_DAYS', 'OLDER_THAN_DAYS'],
  EMAIL_STATUS: ['EQUALS', 'NOT_EQUALS'],
};

const ENTITY_BY_PREFIX: Readonly<Record<string, FilterEntity>> = {
  company: 'COMPANY',
  contact: 'CONTACT',
  email: 'EMAIL',
};

/** Kinds read straight off a stored path; the others are worked out from other collections. */
const STORED_KINDS: ReadonlySet<FilterKind> = new Set(['ENUM', 'TEXT', 'TAGS']);

const field = (
  key: string,
  label: string,
  kind: FilterKind,
  values: readonly string[] = [],
): FilterField => {
  const [prefix, path] = key.split('.');
  return {
    key,
    label,
    entity: ENTITY_BY_PREFIX[prefix],
    path: STORED_KINDS.has(kind) ? path : '',
    kind,
    values,
  };
};

/**
 * Everything an audience rule can test. The portal renders its builder from this list, so a
 * field added here is offered there without a client release.
 */
export const FILTER_FIELDS: readonly FilterField[] = [
  field('company.industry', 'Industry', 'TEXT'),
  field('company.city', 'Company city', 'TEXT'),
  field('company.country', 'Company country', 'TEXT'),
  field('company.location', 'Company location', 'TEXT'),
  field('company.status', 'Account status', 'ENUM', COMPANY_STATUSES),
  field('company.size', 'Company size', 'ENUM', COMPANY_SIZES),
  field('company.tags', 'Company tag', 'TAGS'),
  field('company.owner', 'Account owner', 'TEXT'),
  field('company.lastContacted', 'Company last contacted', 'LAST_CONTACTED'),
  field('contact.lifecycleStage', 'Lead status', 'ENUM', LIFECYCLE_STAGES),
  field('contact.status', 'Contact status', 'ENUM', CONTACT_STATUSES),
  field('contact.city', 'Contact city', 'TEXT'),
  field('contact.country', 'Contact country', 'TEXT'),
  field('contact.title', 'Job title', 'TEXT'),
  field('contact.leadSource', 'Lead source', 'TEXT'),
  field('contact.tags', 'Contact tag', 'TAGS'),
  field('contact.owner', 'Contact owner', 'TEXT'),
  field('contact.lastContacted', 'Contact last contacted', 'LAST_CONTACTED'),
  field('email.status', 'Email status', 'EMAIL_STATUS', [...VERIFICATION_STATUSES, UNCHECKED]),
];

const FIELDS_BY_KEY: ReadonlyMap<string, FilterField> = new Map(
  FILTER_FIELDS.map((entry) => [entry.key, entry]),
);

/** The catalogue entry for a key, or undefined for one nobody defined. */
export const filterField = (key: string): FilterField | undefined => FIELDS_BY_KEY.get(key);
