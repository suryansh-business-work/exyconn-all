import type { NodeOf } from '@exyconn/wa-flow';
import type { NodeFormProps } from '../../fields/form-types';

/** The stored data of a Contact node — inferred from its `NODE_SCHEMAS` entry. */
export type ContactNodeData = NodeOf<'contact'>['data'];

export type ContactNodeFormProps = NodeFormProps<'contact'>;
