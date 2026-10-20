import { ActivityModel } from '../crm/activity.model';
import { CompanyModel } from '../crm/company.model';
import { ContactModel } from '../crm/contact.model';
import { escapeRegex } from '../../utils/tableQuery';
import { filterField, type FilterField } from './audience.fields';
import type { RuleCombinator, RuleOperator } from './audience.model';

export interface RuleCondition {
  field: string;
  operator: RuleOperator;
  value: string;
}

export interface AudienceRules {
  ruleCombinator: RuleCombinator;
  conditions: readonly RuleCondition[];
}

/** The register a query is being built for. */
export type RecordEntity = 'CONTACT' | 'COMPANY';

type Filter = Record<string, unknown>;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Activities that mean somebody actually reached the record, not a note or a to-do. */
const TOUCH_TYPES = ['CALL', 'EMAIL', 'MEETING'];

const exactly = (value: string): RegExp => new RegExp(`^${escapeRegex(value)}$`, 'i');

function emptyFilter(entry: FilterField, empty: boolean): Filter {
  if (entry.kind === 'TAGS') {
    return { [`${entry.path}.0`]: { $exists: !empty } };
  }
  return { [entry.path]: empty ? { $in: ['', null] } : { $nin: ['', null] } };
}

/** A condition on a field stored on the record. Enums match exactly; text ignores case. */
function storedFilter(entry: FilterField, condition: RuleCondition): Filter {
  const { path } = entry;
  const isEnum = entry.kind === 'ENUM';
  switch (condition.operator) {
    case 'EQUALS':
      return { [path]: isEnum ? condition.value : exactly(condition.value) };
    case 'NOT_EQUALS':
      return { [path]: isEnum ? { $ne: condition.value } : { $not: exactly(condition.value) } };
    case 'CONTAINS':
      return { [path]: new RegExp(escapeRegex(condition.value), 'i') };
    case 'IS_EMPTY':
      return emptyFilter(entry, true);
    default:
      return emptyFilter(entry, false);
  }
}

/**
 * The records of one register last reached by a call, email or meeting, narrowed by when.
 * A logged activity is one that is done, or one that never had a due date.
 */
async function touchedIds(entity: RecordEntity, condition: RuleCondition): Promise<string[]> {
  const pipeline: Record<string, unknown>[] = [
    {
      $match: {
        relatedType: entity,
        type: { $in: TOUCH_TYPES },
        $or: [{ done: true }, { dueDate: null }],
      },
    },
    { $group: { _id: '$relatedId', last: { $max: '$createdAt' } } },
  ];
  const cutoff = new Date(Date.now() - Number.parseInt(condition.value, 10) * DAY_MS);
  if (condition.operator === 'WITHIN_DAYS') {
    pipeline.push({ $match: { last: { $gte: cutoff } } });
  }
  if (condition.operator === 'OLDER_THAN_DAYS') {
    pipeline.push({ $match: { last: { $lt: cutoff } } });
  }
  const rows = await ActivityModel.aggregate<{ _id: string }>(pipeline as never[]);
  return rows.map((row) => row._id).filter(Boolean);
}

/** The condition as a query on the register its field belongs to. */
async function ownFilter(entry: FilterField, condition: RuleCondition): Promise<Filter> {
  if (entry.kind !== 'LAST_CONTACTED') {
    return storedFilter(entry, condition);
  }
  const ids = await touchedIds(entry.entity as RecordEntity, condition);
  return { _id: condition.operator === 'NEVER' ? { $nin: ids } : { $in: ids } };
}

/**
 * The condition as a query on `target`. A company field tested on contacts means "works at
 * a matching company"; a contact field tested on companies means "has a matching person".
 */
async function conditionFilter(target: RecordEntity, condition: RuleCondition): Promise<Filter> {
  const entry = filterField(condition.field) as FilterField;
  const own = await ownFilter(entry, condition);
  if (entry.entity === target) {
    return own;
  }
  if (target === 'CONTACT') {
    const companyIds = await CompanyModel.distinct('_id', own);
    return { companyId: { $in: companyIds.map(String) } };
  }
  const companyIds = await ContactModel.distinct('companyId', own);
  return { _id: { $in: companyIds.filter(Boolean) } };
}

const isEmailCondition = (condition: RuleCondition): boolean =>
  filterField(condition.field)?.entity === 'EMAIL';

/** The rules as one query on a register. No record conditions matches every record. */
export async function rulesFilter(target: RecordEntity, rules: AudienceRules): Promise<Filter> {
  const conditions = rules.conditions.filter((condition) => !isEmailCondition(condition));
  if (conditions.length === 0) {
    return {};
  }
  const parts = await Promise.all(conditions.map((c) => conditionFilter(target, c)));
  return rules.ruleCombinator === 'OR' ? { $or: parts } : { $and: parts };
}

/**
 * Whether an address's verification status passes the email conditions. They are judged per
 * address, not per record — one person's verified inbox stays in while their dead one drops
 * out — so they combine among themselves and always narrow what the record rules matched.
 */
export function emailStatusPasses(status: string, rules: AudienceRules): boolean {
  const conditions = rules.conditions.filter(isEmailCondition);
  if (conditions.length === 0) {
    return true;
  }
  const passes = (condition: RuleCondition) =>
    condition.operator === 'EQUALS' ? status === condition.value : status !== condition.value;
  return rules.ruleCombinator === 'OR' ? conditions.some(passes) : conditions.every(passes);
}
