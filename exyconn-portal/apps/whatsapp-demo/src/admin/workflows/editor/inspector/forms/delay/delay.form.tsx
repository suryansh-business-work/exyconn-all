import { NODE_SCHEMAS } from '@exyconn/wa-flow';
import { NumberField } from '../../fields/NumberField';
import { NodeFormFrame } from '../../fields/NodeFormFrame';
import type { DelayNodeFormProps } from './delay.types';

const SCHEMA = NODE_SCHEMAS.delay.shape.data;

/** Inspector form for a Delay node: extra typing time before the next message. */
export function DelayNodeForm({ node, onApply }: Readonly<DelayNodeFormProps>) {
  return (
    <NodeFormFrame schema={SCHEMA} data={node.data} onApply={onApply}>
      <NumberField
        name="ms"
        label="Typing time (ms)"
        step={100}
        hint="100 to 60,000 milliseconds"
      />
    </NodeFormFrame>
  );
}
