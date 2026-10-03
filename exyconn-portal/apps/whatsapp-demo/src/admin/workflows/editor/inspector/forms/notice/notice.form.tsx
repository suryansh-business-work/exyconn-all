import { LIMITS, NODE_SCHEMAS } from '@exyconn/wa-flow';
import { CountedField } from '../../fields/CountedField';
import { TemplateHint } from '../../fields/TemplateHint';
import { NodeFormFrame } from '../../fields/NodeFormFrame';
import type { NoticeNodeFormProps } from './notice.types';

const SCHEMA = NODE_SCHEMAS.notice.shape.data;

/** Inspector form for a Notice node: a centred system line, not a bubble. */
export function NoticeNodeForm({ node, onApply }: Readonly<NoticeNodeFormProps>) {
  return (
    <NodeFormFrame schema={SCHEMA} data={node.data} onApply={onApply}>
      <CountedField name="text" label="Notice" max={LIMITS.text} multiline />
      <TemplateHint />
    </NodeFormFrame>
  );
}
