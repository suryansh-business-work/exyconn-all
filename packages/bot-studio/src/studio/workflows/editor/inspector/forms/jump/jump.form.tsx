import { NODE_SCHEMAS } from '@exyconn/wa-flow';
import { KeySelect } from '../../fields/KeySelect';
import { NodeFormFrame } from '../../fields/NodeFormFrame';
import type { JumpNodeFormProps } from './jump.types';

const SCHEMA = NODE_SCHEMAS.jump.shape.data;

/** Inspector form for a Jump node: starts another workflow of the same demo. */
export function JumpNodeForm({ node, onApply, env }: Readonly<JumpNodeFormProps>) {
  return (
    <NodeFormFrame schema={SCHEMA} data={node.data} onApply={onApply}>
      <KeySelect
        name="workflowKey"
        label="Workflow"
        keys={env.workflowKeys}
        hint="The workflow to start; its own start node runs next"
      />
    </NodeFormFrame>
  );
}
