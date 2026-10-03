import { LIMITS } from '@exyconn/wa-flow';
import { CountedField } from './CountedField';
import { IllustrationFields } from './IllustrationFields';
import { NumberField } from './NumberField';
import { SetRows } from './SetRows';

interface ProductFieldsProps {
  /** Path of the product, e.g. `product` or `cards.2`. */
  name: string;
  /** Carousel cards need a button; a lone product may go without. */
  buttonHint: string;
}

/** Schema limits for a product (schema.ts `productSchema`). */
const MAX = { title: 80, subtitle: 120, badge: 24, id: 64 } as const;

/** A product card: its id (the output's name), copy, prices, picture, button and variables. */
export function ProductFields({ name, buttonHint }: Readonly<ProductFieldsProps>) {
  return (
    <>
      <CountedField name={`${name}.id`} label="Id" max={MAX.id} hint="Names this card's output" />
      <CountedField name={`${name}.title`} label="Title" max={MAX.title} />
      <CountedField name={`${name}.subtitle`} label="Subtitle" max={MAX.subtitle} />
      <NumberField
        name={`${name}.price`}
        label="Price (₹)"
        allowTemplate
        hint="A number or {{var}}"
      />
      <NumberField name={`${name}.mrp`} label="MRP (₹)" allowTemplate hint="Shown struck through" />
      <CountedField name={`${name}.badge`} label="Badge" max={MAX.badge} />
      <IllustrationFields name={`${name}.image`} />
      <CountedField
        name={`${name}.buttonTitle`}
        label="Button title"
        max={LIMITS.buttonTitle}
        hint={buttonHint}
      />
      <SetRows name={`${name}.set`} title="Set variables when picked" />
    </>
  );
}
