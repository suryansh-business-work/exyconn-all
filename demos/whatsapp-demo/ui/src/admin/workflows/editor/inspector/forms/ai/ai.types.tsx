import type { NodeOf } from '@exyconn/wa-flow';
import type { NodeFormProps } from '../../fields/form-types';

/** The stored data of a Ai node — inferred from its `NODE_SCHEMAS` entry. */
export type AiNodeData = NodeOf<'ai'>['data'];

export type AiNodeFormProps = NodeFormProps<'ai'>;
