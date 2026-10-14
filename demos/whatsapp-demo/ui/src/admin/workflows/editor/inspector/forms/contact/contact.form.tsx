import { NODE_SCHEMAS } from '@exyconn/wa-flow';
import { CountedField } from '../../fields/CountedField';
import { TemplateHint } from '../../fields/TemplateHint';
import { NodeFormFrame } from '../../fields/NodeFormFrame';
import type { ContactNodeFormProps } from './contact.types';

const SCHEMA = NODE_SCHEMAS.contact.shape.data;

/** Schema limits (schema.ts `contactSchema`). */
const MAX = { text: 80, phone: 40 } as const;

/** Inspector form for a Contact node: a shareable contact card. */
export function ContactNodeForm({ node, onApply }: Readonly<ContactNodeFormProps>) {
  return (
    <NodeFormFrame schema={SCHEMA} data={node.data} onApply={onApply}>
      <CountedField name="contact.name" label="Name" max={MAX.text} />
      <CountedField
        name="contact.phone"
        label="Phone"
        max={MAX.phone}
        hint="As it should be dialled, e.g. +91 90000 00000"
      />
      <CountedField name="contact.role" label="Role" max={MAX.text} />
      <CountedField name="contact.organisation" label="Organisation" max={MAX.text} />
      <TemplateHint />
    </NodeFormFrame>
  );
}
