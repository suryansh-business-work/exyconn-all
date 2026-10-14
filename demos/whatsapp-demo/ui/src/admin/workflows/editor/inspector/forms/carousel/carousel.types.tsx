import type { NodeOf } from '@exyconn/wa-flow';
import type { NodeFormProps } from '../../fields/form-types';

/** The stored data of a Carousel node — inferred from its `NODE_SCHEMAS` entry. */
export type CarouselNodeData = NodeOf<'carousel'>['data'];

export type CarouselNodeFormProps = NodeFormProps<'carousel'>;
