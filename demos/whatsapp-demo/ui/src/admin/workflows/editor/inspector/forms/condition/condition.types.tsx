import type { NodeOf } from '@exyconn/wa-flow';
import type { NodeFormProps } from '../../fields/form-types';

/** The stored data of a Condition node — inferred from its `NODE_SCHEMAS` entry. */
export type ConditionNodeData = NodeOf<'condition'>['data'];

export type ConditionNodeFormProps = NodeFormProps<'condition'>;
