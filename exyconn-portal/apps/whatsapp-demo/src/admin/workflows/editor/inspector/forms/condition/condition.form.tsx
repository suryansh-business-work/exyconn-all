import { NODE_SCHEMAS } from '@exyconn/wa-flow';
import { useT } from '@exyconn/i18n';
import { Text } from '@exyconn/shell/components/ui';
import { ArrayEditor } from '../../fields/ArrayEditor';
import { NodeFormFrame } from '../../fields/NodeFormFrame';
import { nextId } from '../../fields/next-id';
import { ConditionCaseItem } from './ConditionCaseItem';
import type { ConditionNodeFormProps } from './condition.types';

const SCHEMA = NODE_SCHEMAS.condition.shape.data;

/** Schema limit (schema.ts `condition.cases`). */
const MAX_CASES = 6;

const newCase = (items: readonly Record<string, unknown>[]) => ({
  id: nextId('case', items),
  var: '',
  op: 'eq',
  value: '',
});

/** Inspector form for a Condition node: the first matching case wins, else "Otherwise". */
export function ConditionNodeForm({ node, onApply }: Readonly<ConditionNodeFormProps>) {
  const t = useT();
  return (
    <NodeFormFrame schema={SCHEMA} data={node.data} onApply={onApply}>
      <Text size="caption" color="text.secondary">
        {t(
          'Cases are checked in order; the first that matches is followed. Otherwise covers the rest.',
        )}
      </Text>
      <ArrayEditor
        name="cases"
        title="Cases"
        itemLabel="Case"
        Item={ConditionCaseItem}
        newItem={newCase}
        min={1}
        max={MAX_CASES}
      />
    </NodeFormFrame>
  );
}
