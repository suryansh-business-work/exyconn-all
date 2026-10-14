import { NODE_SCHEMAS } from '@exyconn/wa-flow';
import { ProductFields } from '../../fields/ProductFields';
import { TemplateHint } from '../../fields/TemplateHint';
import { NodeFormFrame } from '../../fields/NodeFormFrame';
import type { ProductNodeFormProps } from './product.types';

const SCHEMA = NODE_SCHEMAS.product.shape.data;

/** Inspector form for a Product node: one product card, optionally with a button. */
export function ProductNodeForm({ node, onApply }: Readonly<ProductNodeFormProps>) {
  return (
    <NodeFormFrame schema={SCHEMA} data={node.data} onApply={onApply}>
      <ProductFields
        name="product"
        buttonHint="With a button the card gets its own output; without, it continues to Next"
      />
      <TemplateHint />
    </NodeFormFrame>
  );
}
