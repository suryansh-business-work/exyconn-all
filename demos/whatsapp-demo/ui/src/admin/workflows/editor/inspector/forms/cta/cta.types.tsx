import type { NodeOf } from '@exyconn/wa-flow';
import type { NodeFormProps } from '../../fields/form-types';

/** The stored data of a Cta node — inferred from its `NODE_SCHEMAS` entry. */
export type CtaNodeData = NodeOf<'cta'>['data'];

export type CtaNodeFormProps = NodeFormProps<'cta'>;
