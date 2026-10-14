import { LIMITS, NODE_SCHEMAS } from '@exyconn/wa-flow';
import { ArrayEditor } from '../../fields/ArrayEditor';
import { CountedField } from '../../fields/CountedField';
import { NodeFormFrame } from '../../fields/NodeFormFrame';
import { TemplateHint } from '../../fields/TemplateHint';
import { nextId } from '../../fields/next-id';
import { AiNotConfigured } from '../../../panels/AiNotConfigured';
import { AiEntityItem, AiIntentItem } from './AiListItems';
import type { AiNodeFormProps } from './ai.types';

const SCHEMA = NODE_SCHEMAS.ai.shape.data;

/** Schema limits (schema.ts `ai`). */
const MAX = { items: 10, retry: 300 } as const;

const newIntent = (items: readonly Record<string, unknown>[]) => ({
  id: nextId('intent', items),
  description: '',
});

const newEntity = (items: readonly Record<string, unknown>[]) => ({
  name: nextId('value', items, 'name'),
  kind: 'text',
  description: '',
});

/**
 * Inspector form for an AI reader node: OpenAI reads the customer's free text, picks an
 * intent (each an output) and fills the entities; anything else goes to "Not understood".
 */
export function AiNodeForm({ node, onApply, env }: Readonly<AiNodeFormProps>) {
  return (
    <NodeFormFrame schema={SCHEMA} data={node.data} onApply={onApply}>
      {!env.aiConfigured && <AiNotConfigured />}
      <CountedField name="prompt" label="Question" max={LIMITS.text} multiline />
      <ArrayEditor
        name="intents"
        title="Intents"
        itemLabel="Intent"
        Item={AiIntentItem}
        newItem={newIntent}
        max={MAX.items}
      />
      <ArrayEditor
        name="entities"
        title="Values to extract"
        itemLabel="Value"
        Item={AiEntityItem}
        newItem={newEntity}
        max={MAX.items}
      />
      <CountedField
        name="retry"
        label="When not understood"
        max={MAX.retry}
        multiline
        hint="Said before asking again"
      />
      <TemplateHint />
    </NodeFormFrame>
  );
}
