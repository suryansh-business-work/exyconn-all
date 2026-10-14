import { LIMITS, NODE_SCHEMAS } from '@exyconn/wa-flow';
import { CountedField } from '../../fields/CountedField';
import { NumberField } from '../../fields/NumberField';
import { TemplateHint } from '../../fields/TemplateHint';
import { NodeFormFrame } from '../../fields/NodeFormFrame';
import type { LocationNodeFormProps } from './location.types';

const SCHEMA = NODE_SCHEMAS.location.shape.data;

/** Schema limits (schema.ts `locationSchema`). */
const MAX = { name: 80, address: 200 } as const;

/** Inspector form for a Location node: a pin with a name and address. */
export function LocationNodeForm({ node, onApply }: Readonly<LocationNodeFormProps>) {
  return (
    <NodeFormFrame schema={SCHEMA} data={node.data} onApply={onApply}>
      <CountedField name="location.name" label="Place name" max={MAX.name} />
      <CountedField name="location.address" label="Address" max={MAX.address} multiline />
      <NumberField name="location.lat" label="Latitude" step={0.0001} hint="-90 to 90" />
      <NumberField name="location.lng" label="Longitude" step={0.0001} hint="-180 to 180" />
      <CountedField name="caption" label="Caption" max={LIMITS.text} multiline />
      <TemplateHint />
    </NodeFormFrame>
  );
}
