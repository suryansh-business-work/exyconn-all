import { ProductFields } from '../../fields/ProductFields';
import type { ArrayItemProps } from '../../fields/ArrayEditor';

/** One carousel card: a product whose button is its own output. */
export function CarouselCardItem({ name }: Readonly<ArrayItemProps>) {
  return <ProductFields name={name} buttonHint="Cards without a button cannot be picked" />;
}
