import type { NodeOf } from '@exyconn/wa-flow';
import type { NodeFormProps } from '../../fields/form-types';

/** The stored data of a Location node — inferred from its `NODE_SCHEMAS` entry. */
export type LocationNodeData = NodeOf<'location'>['data'];

export type LocationNodeFormProps = NodeFormProps<'location'>;
