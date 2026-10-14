import { LIMITS } from '@exyconn/wa-flow';
import { CountedField } from '../../fields/CountedField';
import { SetRows } from '../../fields/SetRows';
import { OPTION_ID_MAX } from '../../fields/next-id';
import type { ArrayItemProps } from '../../fields/ArrayEditor';

/** One row of a list section: its id names its output on the canvas. */
export function ListRowItem({ name }: Readonly<ArrayItemProps>) {
  return (
    <>
      <CountedField name={`${name}.title`} label="Title" max={LIMITS.rowTitle} />
      <CountedField name={`${name}.description`} label="Description" max={LIMITS.rowDescription} />
      <CountedField
        name={`${name}.id`}
        label="Id"
        max={OPTION_ID_MAX}
        hint="Names the output; changing it unwires the row"
      />
      <SetRows name={`${name}.set`} title="Set variables when picked" />
    </>
  );
}
