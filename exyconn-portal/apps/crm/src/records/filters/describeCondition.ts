import { CrmOp, CrmPropertyType } from '@exyconn/shell/graphql/generated';
import { propertyLabel, type Translate } from '../propertyText';
import type { FilterCondition } from '../list/recordQuery';
import { displayValue, type CrmPropertyInfo, type ValueFormatters } from '../schema';
import { OP_LABELS, opArity } from './operators';

export interface DescribeTools {
  t: Translate;
  formatters: ValueFormatters;
  formatList: (items: string[]) => string;
}

/** One stored value as a person reads it: an option's label, a formatted date, Yes/No. */
function readable(property: CrmPropertyInfo, value: string, { formatters }: DescribeTools) {
  if (property.type === CrmPropertyType.Boolean) {
    return value === 'true' ? formatters.yes : formatters.no;
  }
  if (property.type === CrmPropertyType.Number) {
    return displayValue(property, Number(value), formatters);
  }
  return displayValue(property, value, formatters);
}

function valueText(property: CrmPropertyInfo, condition: FilterCondition, tools: DescribeTools) {
  const { t } = tools;
  if (condition.op === CrmOp.LastDays) {
    return t('{count} days', { count: condition.values[0] ?? '' });
  }
  const shown = condition.values.map((value) => readable(property, value, tools));
  if (opArity(condition.op) === 'two') {
    return t('{from} and {to}', { from: shown[0] ?? '', to: shown[1] ?? '' });
  }
  return tools.formatList(shown);
}

/** A Yes/No check (Has email) reads as itself when Yes, and as "Has email: No" otherwise. */
function presenceText(condition: FilterCondition, name: string, t: Translate) {
  if (condition.values[0] === 'true') {
    return name;
  }
  return t('{property}: No', { property: name });
}

/**
 * A condition as a sentence for its chip — "Stage is any of New, Contacted". A condition on a
 * property that no longer exists still names its key, so it can be seen and removed.
 */
export function describeCondition(
  condition: FilterCondition,
  property: CrmPropertyInfo | undefined,
  tools: DescribeTools,
): string {
  const { t } = tools;
  const name = property ? propertyLabel(t, property) : condition.property;
  const operator = t(OP_LABELS[condition.op]);
  if (property?.filterOnly && condition.op === CrmOp.Eq) {
    return presenceText(condition, name, t);
  }
  if (!property || opArity(condition.op) === 'none') {
    return t('{property} {operator}', { property: name, operator });
  }
  return t('{property} {operator} {value}', {
    property: name,
    operator,
    value: valueText(property, condition, tools),
  });
}
