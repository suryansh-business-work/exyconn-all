import { INPUT_KINDS, LIMITS, NODE_SCHEMAS } from '@exyconn/wa-flow';
import { CountedField } from '../../fields/CountedField';
import { KeySelect } from '../../fields/KeySelect';
import { RhfSwitch } from '@exyconn/shell/components/form/rhf';
import { TemplateHint } from '../../fields/TemplateHint';
import { NodeFormFrame } from '../../fields/NodeFormFrame';
import type { InputNodeFormProps } from './input.types';

const SCHEMA = NODE_SCHEMAS.input.shape.data;

/** Schema limits (schema.ts `input`). */
const VAR_MAX = 64;
const ERROR_MAX = 300;

/** Inspector form for an Ask node: asks a question and checks the typed answer. */
export function InputNodeForm({ node, onApply }: Readonly<InputNodeFormProps>) {
  return (
    <NodeFormFrame schema={SCHEMA} data={node.data} onApply={onApply}>
      <CountedField name="prompt" label="Question" max={LIMITS.text} multiline />
      <CountedField
        name="var"
        label="Save the answer as"
        max={VAR_MAX}
        hint="Use it later as {{name}}"
      />
      <KeySelect
        name="kind"
        label="Answer type"
        keys={INPUT_KINDS}
        translate
        hint="An answer of the wrong type is asked again"
      />
      <CountedField name="error" label="Message when the answer is not valid" max={ERROR_MAX} />
      <RhfSwitch name="past" label="Dates only: must not be in the future" />
      <TemplateHint />
    </NodeFormFrame>
  );
}
