import { useT } from '@exyconn/i18n';
import { RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { Flex } from '@exyconn/shell/components/ui';
import { CrmOp, CrmPropertyType } from '@exyconn/shell/graphql/generated';
import { CHOICE_TYPES, type CrmPropertyInfo } from '../../../schema';
import { opArity } from '../../operators';
import type { ConditionPath } from '../filter-builder.types';
import { DateValueField } from './DateValueField';
import { EnumValuesField } from './EnumValuesField';

interface ConditionValueEditorProps {
  path: ConditionPath;
  property: CrmPropertyInfo;
  op: CrmOp;
}

/** A "from" and "to" pair for "is between": two dates, or two numbers. */
function RangeEditor({ path, property }: Readonly<Omit<ConditionValueEditorProps, 'op'>>) {
  if (property.type === CrmPropertyType.Date) {
    return (
      <Flex direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <DateValueField path={path} index={0} label="From" edge="start" />
        <DateValueField path={path} index={1} label="To" edge="end" />
      </Flex>
    );
  }
  return (
    <Flex direction={{ xs: 'column', sm: 'row' }} spacing={1}>
      <RhfTextField
        name={`${path}.values.0`}
        label="From"
        type="number"
        size="small"
        helperText="The lowest value that matches."
      />
      <RhfTextField
        name={`${path}.values.1`}
        label="To"
        type="number"
        size="small"
        helperText="The highest value that matches."
      />
    </Flex>
  );
}

/** The value a condition compares against, in the input that suits its property and operator. */
export function ConditionValueEditor({ path, property, op }: Readonly<ConditionValueEditorProps>) {
  const t = useT();
  const arity = opArity(op);
  const single = `${path}.values.0`;
  if (arity === 'none') {
    return null;
  }
  if (arity === 'two') {
    return <RangeEditor path={path} property={property} />;
  }
  if (arity === 'many') {
    return <EnumValuesField path={path} property={property} />;
  }
  if (op === CrmOp.LastDays) {
    return (
      <RhfTextField
        name={single}
        label="Days"
        type="number"
        size="small"
        helperText="Counts back from today, 1 to 3650 days."
      />
    );
  }
  if (property.type === CrmPropertyType.Date) {
    const edge = op === CrmOp.After ? 'end' : 'start';
    return <DateValueField path={path} index={0} label="Date" edge={edge} />;
  }
  if (property.type === CrmPropertyType.Boolean) {
    const options = [
      { value: 'true', label: t('Yes') },
      { value: 'false', label: t('No') },
    ];
    return (
      <RhfSelect
        name={single}
        label="Value"
        options={options}
        helperText="No also matches records where it was never set."
      />
    );
  }
  if (CHOICE_TYPES.has(property.type)) {
    return (
      <RhfSelect
        name={single}
        label="Value"
        options={property.options}
        helperText="The option to compare the property with."
      />
    );
  }
  const type = property.type === CrmPropertyType.Number ? 'number' : 'text';
  return (
    <RhfTextField
      name={single}
      label="Value"
      type={type}
      size="small"
      helperText="The value to compare the property with."
    />
  );
}
