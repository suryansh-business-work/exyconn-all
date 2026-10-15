import { LIMITS, NODE_SCHEMAS } from '@exyconn/wa-flow';
import { ArrayEditor } from '../../fields/ArrayEditor';
import { MessageFrameFields } from '../../fields/MessageFrameFields';
import { NodeFormFrame } from '../../fields/NodeFormFrame';
import { TemplateHint } from '../../fields/TemplateHint';
import { CtaActionItem } from './CtaActionItem';
import { ctaStarter } from './cta-starter';
import type { CtaNodeFormProps } from './cta.types';

const SCHEMA = NODE_SCHEMAS.cta.shape.data;

const newAction = () => ctaStarter('url', '');

/** Inspector form for a Call to action node: one or two link, call or calendar buttons. */
export function CtaNodeForm({ node, onApply }: Readonly<CtaNodeFormProps>) {
  return (
    <NodeFormFrame schema={SCHEMA} data={node.data} onApply={onApply}>
      <MessageFrameFields />
      <ArrayEditor
        name="actions"
        title="Actions"
        itemLabel="Action"
        Item={CtaActionItem}
        newItem={newAction}
        min={1}
        max={LIMITS.ctaActions}
      />
      <TemplateHint />
    </NodeFormFrame>
  );
}
