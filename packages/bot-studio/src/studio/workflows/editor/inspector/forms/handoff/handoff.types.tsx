import type { NodeOf } from '@exyconn/wa-flow';
import type { NodeFormProps } from '../../fields/form-types';

/** The stored data of a Handoff node — inferred from its `NODE_SCHEMAS` entry. */
export type HandoffNodeData = NodeOf<'handoff'>['data'];

export type HandoffNodeFormProps = NodeFormProps<'handoff'>;
