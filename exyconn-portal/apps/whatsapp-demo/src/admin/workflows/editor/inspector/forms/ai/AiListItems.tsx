import { ENTITY_KINDS } from '@exyconn/wa-flow';
import type { ArrayItemProps } from '../../fields/ArrayEditor';
import { CountedField } from '../../fields/CountedField';
import { KeySelect } from '../../fields/KeySelect';
import { OPTION_ID_MAX } from '../../fields/next-id';

/** Schema limit (schema.ts `ai.intents/entities.description`). */
const DESCRIPTION_MAX = 200;

/** Something the customer may want; its id names an output. */
export function AiIntentItem({ name }: Readonly<ArrayItemProps>) {
  return (
    <>
      <CountedField
        name={`${name}.id`}
        label="Intent id"
        max={OPTION_ID_MAX}
        hint="Names the output, e.g. book"
      />
      <CountedField
        name={`${name}.description`}
        label="What it means"
        max={DESCRIPTION_MAX}
        multiline
        hint="In plain words, for the model: “wants to book an appointment”"
      />
    </>
  );
}

/** A value to pull out of the text into a variable. */
export function AiEntityItem({ name }: Readonly<ArrayItemProps>) {
  return (
    <>
      <CountedField
        name={`${name}.name`}
        label="Save as"
        max={OPTION_ID_MAX}
        hint="Use it later as {{name}}"
      />
      <KeySelect name={`${name}.kind`} label="Kind" keys={ENTITY_KINDS} translate />
      <CountedField
        name={`${name}.description`}
        label="What to look for"
        max={DESCRIPTION_MAX}
        multiline
      />
    </>
  );
}
