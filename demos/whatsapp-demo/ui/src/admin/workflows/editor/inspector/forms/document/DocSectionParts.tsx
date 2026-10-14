import { RhfChipsInput } from '@exyconn/shell/components/form/rhf';
import { ArrayEditor, type ArrayItemProps } from '../../fields/ArrayEditor';
import { CountedField } from '../../fields/CountedField';
import { KeySelect } from '../../fields/KeySelect';
import { OPTION_ID_MAX, nextId } from '../../fields/next-id';

/** Schema limits (schema.ts `docSectionSchema`). */
const MAX = { label: 60, value: 200, text: 2000 } as const;
const FLAGS = ['high', 'low'] as const;

const newField = () => ({ label: '', value: '' });
const newRow = (items: readonly Record<string, unknown>[]) => ({
  id: nextId('row', items),
  cells: [],
});

function DocFieldItem({ name }: Readonly<ArrayItemProps>) {
  return (
    <>
      <CountedField name={`${name}.label`} label="Label" max={MAX.label} />
      <CountedField name={`${name}.value`} label="Value" max={MAX.value} hint="Text or {{var}}" />
    </>
  );
}

function DocTableRowItem({ name }: Readonly<ArrayItemProps>) {
  return (
    <>
      <RhfChipsInput name={`${name}.cells`} label="Cells" helperText="One per column, in order" />
      <KeySelect name={`${name}.flag`} label="Flag" keys={FLAGS} translate emptyLabel="None" />
      <CountedField name={`${name}.id`} label="Id" max={OPTION_ID_MAX} />
    </>
  );
}

/** A "fields" section: label/value pairs. */
export function DocFieldsPart({ name }: Readonly<{ name: string }>) {
  return (
    <ArrayEditor
      name={`${name}.fields`}
      title="Fields"
      itemLabel="Field"
      Item={DocFieldItem}
      newItem={newField}
    />
  );
}

/** A "table" section: up to six columns and any number of rows. */
export function DocTablePart({ name }: Readonly<{ name: string }>) {
  return (
    <>
      <RhfChipsInput
        name={`${name}.columns`}
        label="Columns"
        helperText="One to six column headings"
      />
      <ArrayEditor
        name={`${name}.rows`}
        title="Rows"
        itemLabel="Row"
        Item={DocTableRowItem}
        newItem={newRow}
      />
    </>
  );
}

/** A "text" section: a paragraph. */
export function DocTextPart({ name }: Readonly<{ name: string }>) {
  return <CountedField name={`${name}.text`} label="Text" max={MAX.text} multiline />;
}
