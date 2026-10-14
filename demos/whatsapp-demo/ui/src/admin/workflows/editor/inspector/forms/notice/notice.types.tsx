import type { NodeOf } from '@exyconn/wa-flow';
import type { NodeFormProps } from '../../fields/form-types';

/** The stored data of a Notice node — inferred from its `NODE_SCHEMAS` entry. */
export type NoticeNodeData = NodeOf<'notice'>['data'];

export type NoticeNodeFormProps = NodeFormProps<'notice'>;
