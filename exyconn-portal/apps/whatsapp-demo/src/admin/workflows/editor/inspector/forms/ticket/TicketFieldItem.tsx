import type { ArrayItemProps } from '../../fields/ArrayEditor';
import { CountedField } from '../../fields/CountedField';

/** Schema limits (schema.ts `ticketSchema.fields`). */
const MAX = { label: 40, value: 120 } as const;

/** One label/value line printed on the ticket. */
export function TicketFieldItem({ name }: Readonly<ArrayItemProps>) {
  return (
    <>
      <CountedField name={`${name}.label`} label="Label" max={MAX.label} />
      <CountedField name={`${name}.value`} label="Value" max={MAX.value} hint="Text or {{var}}" />
    </>
  );
}
