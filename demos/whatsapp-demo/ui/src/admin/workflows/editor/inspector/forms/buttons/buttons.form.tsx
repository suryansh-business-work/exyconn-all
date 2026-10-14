import { LIMITS, NODE_SCHEMAS } from '@exyconn/wa-flow';
import { ArrayEditor } from '../../fields/ArrayEditor';
import { NodeFormFrame } from '../../fields/NodeFormFrame';
import { TemplateHint } from '../../fields/TemplateHint';
import { nextId } from '../../fields/next-id';
import { ButtonItem } from './ButtonItem';
import { MessageFrameFields } from '../../fields/MessageFrameFields';
import type { ButtonsNodeFormProps } from './buttons.types';

const SCHEMA = NODE_SCHEMAS.buttons.shape.data;

const newButton = (items: readonly Record<string, unknown>[]) => ({
  id: nextId('button', items),
  title: '',
});

/** Inspector form for a Buttons node: a message with one to three reply buttons. */
export function ButtonsNodeForm({ node, onApply }: Readonly<ButtonsNodeFormProps>) {
  return (
    <NodeFormFrame schema={SCHEMA} data={node.data} onApply={onApply}>
      <MessageFrameFields />
      <ArrayEditor
        name="buttons"
        title="Buttons"
        itemLabel="Button"
        Item={ButtonItem}
        newItem={newButton}
        min={1}
        max={LIMITS.buttons}
      />
      <TemplateHint />
    </NodeFormFrame>
  );
}
