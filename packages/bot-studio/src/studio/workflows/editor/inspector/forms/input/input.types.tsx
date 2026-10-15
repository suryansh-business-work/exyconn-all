import type { NodeOf } from '@exyconn/wa-flow';
import type { NodeFormProps } from '../../fields/form-types';

/** The stored data of a Input node — inferred from its `NODE_SCHEMAS` entry. */
export type InputNodeData = NodeOf<'input'>['data'];

export type InputNodeFormProps = NodeFormProps<'input'>;
