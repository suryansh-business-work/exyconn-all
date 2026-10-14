import { LIMITS, NODE_SCHEMAS } from '@exyconn/wa-flow';
import { CountedField } from '../../fields/CountedField';
import { TemplateHint } from '../../fields/TemplateHint';
import { NodeFormFrame } from '../../fields/NodeFormFrame';
import type { TextNodeFormProps } from './text.types';

const SCHEMA = NODE_SCHEMAS.text.shape.data;

/** Inspector form for a Text node: one message bubble. */
export function TextNodeForm({ node, onApply }: Readonly<TextNodeFormProps>) {
  return (
    <NodeFormFrame schema={SCHEMA} data={node.data} onApply={onApply}>
      <CountedField
        name="text"
        label="Message"
        max={LIMITS.text}
        multiline
        hint="*bold*, _italic_ and {{var}} work"
      />
      <TemplateHint />
    </NodeFormFrame>
  );
}
