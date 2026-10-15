import type { NodeOf } from '@exyconn/wa-flow';
import type { NodeFormProps } from '../../fields/form-types';

/** The stored data of a Product node — inferred from its `NODE_SCHEMAS` entry. */
export type ProductNodeData = NodeOf<'product'>['data'];

export type ProductNodeFormProps = NodeFormProps<'product'>;
