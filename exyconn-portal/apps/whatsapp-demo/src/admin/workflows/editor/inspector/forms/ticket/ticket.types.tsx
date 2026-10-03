import type { NodeOf } from '@exyconn/wa-flow';
import type { NodeFormProps } from '../../fields/form-types';

/** The stored data of a Ticket node — inferred from its `NODE_SCHEMAS` entry. */
export type TicketNodeData = NodeOf<'ticket'>['data'];

export type TicketNodeFormProps = NodeFormProps<'ticket'>;
