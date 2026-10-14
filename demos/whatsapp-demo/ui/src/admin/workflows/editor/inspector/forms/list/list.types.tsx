import type { NodeOf } from '@exyconn/wa-flow';
import type { NodeFormProps } from '../../fields/form-types';

/** The stored data of a List node — inferred from its `NODE_SCHEMAS` entry. */
export type ListNodeData = NodeOf<'list'>['data'];

export type ListNodeFormProps = NodeFormProps<'list'>;
