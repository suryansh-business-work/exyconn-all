import type { NodeOf } from '@exyconn/wa-flow';
import type { NodeFormProps } from '../../fields/form-types';

/** The stored data of a Image node — inferred from its `NODE_SCHEMAS` entry. */
export type ImageNodeData = NodeOf<'image'>['data'];

export type ImageNodeFormProps = NodeFormProps<'image'>;
