import type { NodeOf } from '@exyconn/wa-flow';
import type { NodeFormProps } from '../../fields/form-types';

/** The stored data of a Jump node — inferred from its `NODE_SCHEMAS` entry. */
export type JumpNodeData = NodeOf<'jump'>['data'];

export type JumpNodeFormProps = NodeFormProps<'jump'>;
