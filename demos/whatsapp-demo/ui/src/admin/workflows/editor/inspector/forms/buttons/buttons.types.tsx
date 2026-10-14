import type { NodeOf } from '@exyconn/wa-flow';
import type { NodeFormProps } from '../../fields/form-types';

/** The stored data of a Buttons node — inferred from its `NODE_SCHEMAS` entry. */
export type ButtonsNodeData = NodeOf<'buttons'>['data'];

export type ButtonsNodeFormProps = NodeFormProps<'buttons'>;
