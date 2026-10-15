import { CrmOp, CrmPropertyType } from '@exyconn/shell/graphql/generated';
import type { CrmPropertyInfo } from '../schema';
import { opArity } from './operators';

/** A condition as the filter builder holds it before it is applied. */
export interface ConditionDraft {
  property: string;
  /** Empty until a property, and so its operators, has been chosen. */
  op: CrmOp | '';
  values: string[];
}

/** Where on a condition a problem is shown. */
export interface ConditionIssue {
  field: 'property' | 'op' | 'values';
  message: string;
}

const isNumber = (value: string) => value.trim() !== '' && Number.isFinite(Number(value));

function rangeIssue(type: CrmPropertyType, from: string, to: string): string | null {
  if (type === CrmPropertyType.Number) {
    if (!isNumber(from) || !isNumber(to)) {
      return 'Enter a number in both boxes';
    }
    return Number(from) > Number(to) ? 'The first number must not be larger than the second' : null;
  }
  return Date.parse(from) > Date.parse(to) ? 'The start date must be on or before the end' : null;
}

function singleValueIssue(op: CrmOp, type: CrmPropertyType, value: string): string | null {
  if (value.trim() === '') {
    return 'Enter a value';
  }
  if (op === CrmOp.LastDays) {
    const days = Number(value);
    return Number.isInteger(days) && days > 0 ? null : 'Enter a whole number of days, 1 or more';
  }
  if (type === CrmPropertyType.Number && !isNumber(value)) {
    return 'Enter a number';
  }
  return null;
}

function valuesIssue(op: CrmOp, type: CrmPropertyType, values: string[]): string | null {
  switch (opArity(op)) {
    case 'none':
      return null;
    case 'many':
      return values.length === 0 ? 'Choose at least one option' : null;
    case 'two': {
      const [from = '', to = ''] = values;
      if (from.trim() === '' || to.trim() === '') {
        return 'Enter both values';
      }
      return rangeIssue(type, from, to);
    }
    default:
      return singleValueIssue(op, type, values[0] ?? '');
  }
}

/** What is wrong with a condition, if anything — the inline message under that field. */
export function conditionIssue(
  condition: ConditionDraft,
  property: CrmPropertyInfo | undefined,
): ConditionIssue | null {
  if (!property) {
    return { field: 'property', message: 'Choose a property' };
  }
  if (condition.op === '' || !property.ops.includes(condition.op)) {
    return { field: 'op', message: 'Choose how to compare' };
  }
  const message = valuesIssue(condition.op, property.type, condition.values);
  return message ? { field: 'values', message } : null;
}
