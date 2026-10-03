import type { NodeOf } from '@exyconn/wa-flow';
import type { NodeFormProps } from '../../fields/form-types';

/** The stored data of a Order node — inferred from its `NODE_SCHEMAS` entry. */
export type OrderNodeData = NodeOf<'order'>['data'];

export type OrderNodeFormProps = NodeFormProps<'order'>;
