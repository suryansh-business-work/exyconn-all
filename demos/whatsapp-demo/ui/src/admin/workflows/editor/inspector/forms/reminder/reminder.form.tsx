import { NODE_SCHEMAS } from '@exyconn/wa-flow';
import { CountedField } from '../../fields/CountedField';
import { NumberField } from '../../fields/NumberField';
import { NodeFormFrame } from '../../fields/NodeFormFrame';
import type { ReminderNodeFormProps } from './reminder.types';

const SCHEMA = NODE_SCHEMAS.reminder.shape.data;

/** Schema limit (schema.ts `reminder.label`). */
const LABEL_MAX = 80;

/** Inspector form for a Reminder node: schedules a message for later. */
export function ReminderNodeForm({ node, onApply }: Readonly<ReminderNodeFormProps>) {
  return (
    <NodeFormFrame schema={SCHEMA} data={node.data} onApply={onApply}>
      <NumberField
        name="afterMs"
        label="Send after (ms)"
        step={1000}
        hint="At least 1,000 ms; up to one day. Wire “When due” to what is sent then"
      />
      <CountedField
        name="label"
        label="Reminder label"
        max={LABEL_MAX}
        hint="Shown in the notification"
      />
    </NodeFormFrame>
  );
}
