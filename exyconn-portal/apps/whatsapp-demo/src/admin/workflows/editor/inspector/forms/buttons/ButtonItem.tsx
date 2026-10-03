import { LIMITS } from '@exyconn/wa-flow';
import { CountedField } from '../../fields/CountedField';
import { SetRows } from '../../fields/SetRows';
import type { ArrayItemProps } from '../../fields/ArrayEditor';
import { OPTION_ID_MAX } from '../../fields/next-id';

/** One reply button: its id names its output on the canvas. */
export function ButtonItem({ name }: Readonly<ArrayItemProps>) {
  return (
    <>
      <CountedField name={`${name}.title`} label="Title" max={LIMITS.buttonTitle} />
      <CountedField
        name={`${name}.id`}
        label="Id"
        max={OPTION_ID_MAX}
        hint="Names the output; changing it unwires the button"
      />
      <SetRows name={`${name}.set`} title="Set variables when tapped" />
    </>
  );
}
