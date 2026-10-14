import { LIMITS, NODE_SCHEMAS } from '@exyconn/wa-flow';
import { ArrayEditor } from '../../fields/ArrayEditor';
import { CountedField } from '../../fields/CountedField';
import { NodeFormFrame } from '../../fields/NodeFormFrame';
import { TemplateHint } from '../../fields/TemplateHint';
import { TicketFieldItem } from './TicketFieldItem';
import type { TicketNodeFormProps } from './ticket.types';

const SCHEMA = NODE_SCHEMAS.ticket.shape.data;

/** Schema limits (schema.ts `ticketSchema`). */
const MAX = { id: 80, title: 80, subtitle: 120, qr: 300, fields: 8 } as const;

const newField = () => ({ label: '', value: '' });

/** Inspector form for a Ticket node: a pass with fields and a real QR code. */
export function TicketNodeForm({ node, onApply }: Readonly<TicketNodeFormProps>) {
  return (
    <NodeFormFrame schema={SCHEMA} data={node.data} onApply={onApply}>
      <CountedField
        name="ticket.ticketId"
        label="Ticket number"
        max={MAX.id}
        hint="e.g. {{ref}} set with $id:TK"
      />
      <CountedField name="ticket.title" label="Title" max={MAX.title} />
      <CountedField name="ticket.subtitle" label="Subtitle" max={MAX.subtitle} />
      <ArrayEditor
        name="ticket.fields"
        title="Fields"
        itemLabel="Field"
        Item={TicketFieldItem}
        newItem={newField}
        max={MAX.fields}
      />
      <CountedField name="ticket.qrData" label="QR code content" max={MAX.qr} />
      <CountedField name="caption" label="Caption" max={LIMITS.text} multiline />
      <TemplateHint />
    </NodeFormFrame>
  );
}
