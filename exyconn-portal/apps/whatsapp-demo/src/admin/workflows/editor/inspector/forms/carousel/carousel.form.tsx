import { LIMITS, NODE_SCHEMAS } from '@exyconn/wa-flow';
import { ArrayEditor } from '../../fields/ArrayEditor';
import { CountedField } from '../../fields/CountedField';
import { NodeFormFrame } from '../../fields/NodeFormFrame';
import { TemplateHint } from '../../fields/TemplateHint';
import { nextId } from '../../fields/next-id';
import { CarouselCardItem } from './CarouselCardItem';
import type { CarouselNodeFormProps } from './carousel.types';

const SCHEMA = NODE_SCHEMAS.carousel.shape.data;

const newCard = (items: readonly Record<string, unknown>[]) => ({
  id: nextId('card', items),
  title: '',
  price: 0,
  image: { icon: 'bag', accent: 'teal' },
  buttonTitle: 'Select',
});

/** Inspector form for a Carousel node: up to ten swipeable product cards. */
export function CarouselNodeForm({ node, onApply }: Readonly<CarouselNodeFormProps>) {
  return (
    <NodeFormFrame schema={SCHEMA} data={node.data} onApply={onApply}>
      <CountedField name="text" label="Message above the cards" max={LIMITS.text} multiline />
      <ArrayEditor
        name="cards"
        title="Cards"
        itemLabel="Card"
        Item={CarouselCardItem}
        newItem={newCard}
        min={1}
        max={LIMITS.carouselCards}
      />
      <TemplateHint />
    </NodeFormFrame>
  );
}
