import { LIMITS, NODE_SCHEMAS } from '@exyconn/wa-flow';
import { CountedField } from '../../fields/CountedField';
import { TemplateHint } from '../../fields/TemplateHint';
import { IllustrationFields } from '../../fields/IllustrationFields';
import { NodeFormFrame } from '../../fields/NodeFormFrame';
import type { ImageNodeFormProps } from './image.types';

const SCHEMA = NODE_SCHEMAS.image.shape.data;

/** Inspector form for an Image node: an illustration and a caption. */
export function ImageNodeForm({ node, onApply }: Readonly<ImageNodeFormProps>) {
  return (
    <NodeFormFrame schema={SCHEMA} data={node.data} onApply={onApply}>
      <IllustrationFields name="image" />
      <CountedField name="caption" label="Caption" max={LIMITS.text} multiline />
      <TemplateHint />
    </NodeFormFrame>
  );
}
