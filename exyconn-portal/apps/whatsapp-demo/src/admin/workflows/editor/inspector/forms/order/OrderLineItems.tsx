import type { ArrayItemProps } from '../../fields/ArrayEditor';
import { CountedField } from '../../fields/CountedField';
import { NumberField } from '../../fields/NumberField';
import { OPTION_ID_MAX } from '../../fields/next-id';

/** Schema limits (schema.ts `orderSchema`). */
const MAX = { name: 80, label: 60 } as const;

/** One line of the order. */
export function OrderItem({ name }: Readonly<ArrayItemProps>) {
  return (
    <>
      <CountedField name={`${name}.name`} label="Item" max={MAX.name} />
      <NumberField name={`${name}.qty`} label="Quantity" />
      <NumberField
        name={`${name}.price`}
        label="Unit price (₹)"
        allowTemplate
        hint="A number or {{var}}"
      />
      <CountedField name={`${name}.id`} label="Id" max={OPTION_ID_MAX} />
    </>
  );
}

/** A discount, fee or tax line added to the total; negative to take off. */
export function OrderAdjustment({ name }: Readonly<ArrayItemProps>) {
  return (
    <>
      <CountedField
        name={`${name}.label`}
        label="Label"
        max={MAX.label}
        hint="e.g. Discount, GST"
      />
      <NumberField
        name={`${name}.amount`}
        label="Amount (₹)"
        allowTemplate
        hint="Negative to take off"
      />
      <CountedField name={`${name}.id`} label="Id" max={OPTION_ID_MAX} />
    </>
  );
}
