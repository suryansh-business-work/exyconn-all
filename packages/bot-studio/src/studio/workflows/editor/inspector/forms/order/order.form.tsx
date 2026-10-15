import { LIMITS, NODE_SCHEMAS } from '@exyconn/wa-flow';
import { ArrayEditor } from '../../fields/ArrayEditor';
import { CountedField } from '../../fields/CountedField';
import { KeySelect } from '../../fields/KeySelect';
import { NodeFormFrame } from '../../fields/NodeFormFrame';
import { TemplateHint } from '../../fields/TemplateHint';
import { nextId } from '../../fields/next-id';
import { OrderAdjustment, OrderItem } from './OrderLineItems';
import type { OrderNodeFormProps } from './order.types';

const SCHEMA = NODE_SCHEMAS.order.shape.data;

/** Schema limits (schema.ts `orderSchema`). */
const MAX = { id: 80, title: 80 } as const;
const STATUSES = ['pending', 'paid'] as const;

const newItem = (items: readonly Record<string, unknown>[]) => ({
  id: nextId('item', items),
  name: '',
  qty: 1,
  price: 0,
});

const newAdjustment = (items: readonly Record<string, unknown>[]) => ({
  id: nextId('adjustment', items),
  label: '',
  amount: 0,
});

/** Inspector form for an Order node: an itemised summary, with Pay while it is pending. */
export function OrderNodeForm({ node, onApply }: Readonly<OrderNodeFormProps>) {
  return (
    <NodeFormFrame schema={SCHEMA} data={node.data} onApply={onApply}>
      <CountedField
        name="order.orderId"
        label="Order number"
        max={MAX.id}
        hint="e.g. {{orderNo}} set with $id:OD"
      />
      <CountedField name="order.title" label="Title" max={MAX.title} />
      <KeySelect name="order.status" label="Status" keys={STATUSES} translate />
      <CountedField
        name="order.payTitle"
        label="Pay button"
        max={LIMITS.buttonTitle}
        hint="Pending orders with a Pay button get a Pay output"
      />
      <ArrayEditor
        name="order.items"
        title="Items"
        itemLabel="Item"
        Item={OrderItem}
        newItem={newItem}
        min={1}
      />
      <ArrayEditor
        name="order.adjustments"
        title="Adjustments"
        itemLabel="Adjustment"
        Item={OrderAdjustment}
        newItem={newAdjustment}
      />
      <TemplateHint />
    </NodeFormFrame>
  );
}
