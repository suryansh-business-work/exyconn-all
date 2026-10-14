import { useFormContext, useWatch } from 'react-hook-form';
import { CONDITION_OPS } from '@exyconn/wa-flow';
import type { ArrayItemProps } from '../../fields/ArrayEditor';
import { CountedField } from '../../fields/CountedField';
import { KeySelect } from '../../fields/KeySelect';
import { OPTION_ID_MAX } from '../../fields/next-id';

/** Schema limit (schema.ts `condition.cases.value`). */
const VALUE_MAX = 200;

/** Operators that compare against nothing. */
const UNARY = new Set(['empty', 'notEmpty']);

/** One case: when a variable matches, follow this case's output. */
export function ConditionCaseItem({ name }: Readonly<ArrayItemProps>) {
  const { control } = useFormContext();
  const op = useWatch({ control, name: `${name}.op` }) as string;
  return (
    <>
      <CountedField
        name={`${name}.var`}
        label="Variable"
        max={OPTION_ID_MAX}
        hint="Its name, without braces"
      />
      <KeySelect name={`${name}.op`} label="Test" keys={CONDITION_OPS} translate />
      {!UNARY.has(op) && <CountedField name={`${name}.value`} label="Value" max={VALUE_MAX} />}
      <CountedField name={`${name}.id`} label="Id" max={OPTION_ID_MAX} hint="Names the output" />
    </>
  );
}
