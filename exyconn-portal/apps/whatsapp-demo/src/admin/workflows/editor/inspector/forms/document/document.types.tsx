import type { NodeOf } from '@exyconn/wa-flow';
import type { NodeFormProps } from '../../fields/form-types';

/** The stored data of a Document node — inferred from its `NODE_SCHEMAS` entry. */
export type DocumentNodeData = NodeOf<'document'>['data'];

export type DocumentNodeFormProps = NodeFormProps<'document'>;
