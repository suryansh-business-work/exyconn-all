import type { NodeOf } from '@exyconn/wa-flow';
import type { NodeFormProps } from '../../fields/form-types';

/** The stored data of a Text node — inferred from its `NODE_SCHEMAS` entry. */
export type TextNodeData = NodeOf<'text'>['data'];

export type TextNodeFormProps = NodeFormProps<'text'>;
