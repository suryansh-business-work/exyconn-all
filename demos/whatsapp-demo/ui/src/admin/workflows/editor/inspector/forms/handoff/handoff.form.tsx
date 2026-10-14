import { LIMITS, NODE_SCHEMAS } from '@exyconn/wa-flow';
import { CountedField } from '../../fields/CountedField';
import { TemplateHint } from '../../fields/TemplateHint';
import { NodeFormFrame } from '../../fields/NodeFormFrame';
import type { HandoffNodeFormProps } from './handoff.types';

const SCHEMA = NODE_SCHEMAS.handoff.shape.data;

/** Schema limit (schema.ts `handoff.agentName`). */
const AGENT_MAX = 60;

/** Inspector form for a Handoff node: a named person joins and writes. */
export function HandoffNodeForm({ node, onApply }: Readonly<HandoffNodeFormProps>) {
  return (
    <NodeFormFrame schema={SCHEMA} data={node.data} onApply={onApply}>
      <CountedField
        name="agentName"
        label="Agent name"
        max={AGENT_MAX}
        hint="Shown as “<name> joined”"
      />
      <CountedField name="text" label="Their first message" max={LIMITS.text} multiline />
      <TemplateHint />
    </NodeFormFrame>
  );
}
