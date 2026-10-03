import type { NodeOf } from '@exyconn/wa-flow';
import type { NodeFormProps } from '../../fields/form-types';

/** The stored data of a End node — inferred from its `NODE_SCHEMAS` entry. */
export type EndNodeData = NodeOf<'end'>['data'];

export type EndNodeFormProps = NodeFormProps<'end'>;
