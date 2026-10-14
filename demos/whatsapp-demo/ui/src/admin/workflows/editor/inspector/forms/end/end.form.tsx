import { LIMITS, NODE_SCHEMAS } from '@exyconn/wa-flow';
import { CountedField } from '../../fields/CountedField';
import { RhfSwitch } from '@exyconn/shell/components/form/rhf';
import { TemplateHint } from '../../fields/TemplateHint';
import { NodeFormFrame } from '../../fields/NodeFormFrame';
import type { EndNodeFormProps } from './end.types';

const SCHEMA = NODE_SCHEMAS.end.shape.data;

/** Inspector form for an End node: completes the workflow. */
export function EndNodeForm({ node, onApply }: Readonly<EndNodeFormProps>) {
  return (
    <NodeFormFrame schema={SCHEMA} data={node.data} onApply={onApply}>
      <CountedField name="text" label="Closing message" max={LIMITS.text} multiline />
      <RhfSwitch name="showMenu" label="Show the menu again" />
      <TemplateHint />
    </NodeFormFrame>
  );
}
