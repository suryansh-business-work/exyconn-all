import { CrmOp } from '@exyconn/shell/graphql/generated';

/** How many values an operator takes: none, one, a from/to pair, or a list of options. */
export type OpArity = 'none' | 'one' | 'two' | 'many';

/** What each operator reads as in a sentence — "Stage is any of New, Contacted". */
export const OP_LABELS: Record<CrmOp, string> = {
  [CrmOp.Eq]: 'is',
  [CrmOp.Neq]: 'is not',
  [CrmOp.Contains]: 'contains',
  [CrmOp.NotContains]: "doesn't contain",
  [CrmOp.StartsWith]: 'starts with',
  [CrmOp.EndsWith]: 'ends with',
  [CrmOp.Gt]: 'is greater than',
  [CrmOp.Gte]: 'is greater than or equal to',
  [CrmOp.Lt]: 'is less than',
  [CrmOp.Lte]: 'is less than or equal to',
  [CrmOp.Between]: 'is between',
  [CrmOp.In]: 'is any of',
  [CrmOp.NotIn]: 'is none of',
  [CrmOp.Before]: 'is before',
  [CrmOp.After]: 'is after',
  [CrmOp.LastDays]: 'is in the last',
  [CrmOp.IsEmpty]: 'is unknown',
  [CrmOp.IsNotEmpty]: 'is known',
};

const NO_VALUE = new Set<CrmOp>([CrmOp.IsEmpty, CrmOp.IsNotEmpty]);
const LIST_VALUE = new Set<CrmOp>([CrmOp.In, CrmOp.NotIn]);

export function opArity(op: CrmOp): OpArity {
  if (NO_VALUE.has(op)) {
    return 'none';
  }
  if (LIST_VALUE.has(op)) {
    return 'many';
  }
  return op === CrmOp.Between ? 'two' : 'one';
}

const VALUE_COUNT: Readonly<Record<OpArity, number>> = { none: 0, one: 1, two: 2, many: 0 };

/**
 * The empty values an operator starts with: one blank box, a blank from/to pair, or nothing.
 * A box always holds a string, so an untouched one reads as blank ("Enter a value") rather
 * than as missing, and never falls back to the value the condition was opened with.
 */
export const blankValues = (op: CrmOp): string[] =>
  Array.from({ length: VALUE_COUNT[opArity(op)] }, () => '');

/** The server allows this many OR groups, and this many conditions inside each. */
export const MAX_GROUPS = 10;
export const MAX_CONDITIONS = 20;
/** And this many sort levels. */
export const MAX_SORTS = 3;
