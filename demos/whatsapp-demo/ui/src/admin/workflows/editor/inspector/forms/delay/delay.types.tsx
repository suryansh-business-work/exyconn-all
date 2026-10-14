import type { NodeOf } from '@exyconn/wa-flow';
import type { NodeFormProps } from '../../fields/form-types';

/** The stored data of a Delay node — inferred from its `NODE_SCHEMAS` entry. */
export type DelayNodeData = NodeOf<'delay'>['data'];

export type DelayNodeFormProps = NodeFormProps<'delay'>;
