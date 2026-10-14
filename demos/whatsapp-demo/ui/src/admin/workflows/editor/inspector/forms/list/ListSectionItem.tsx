import { LIMITS } from '@exyconn/wa-flow';
import { ArrayEditor, type ArrayItemProps } from '../../fields/ArrayEditor';
import { CountedField } from '../../fields/CountedField';
import { OPTION_ID_MAX, nextId } from '../../fields/next-id';
import { ListRowItem } from './ListRowItem';

const newRow = (items: readonly Record<string, unknown>[]) => ({
  id: nextId('row', items),
  title: '',
});

/** One section of a list: a heading and up to ten rows. */
export function ListSectionItem({ name }: Readonly<ArrayItemProps>) {
  return (
    <>
      <CountedField name={`${name}.title`} label="Section title" max={LIMITS.rowTitle} />
      <CountedField name={`${name}.id`} label="Section id" max={OPTION_ID_MAX} />
      <ArrayEditor
        name={`${name}.rows`}
        title="Rows"
        itemLabel="Row"
        Item={ListRowItem}
        newItem={newRow}
        min={1}
        max={LIMITS.listRows}
      />
    </>
  );
}
