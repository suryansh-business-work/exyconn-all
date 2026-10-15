import type { NodeOf } from '@exyconn/wa-flow';
import type { NodeFormProps } from '../../fields/form-types';

/** The stored data of a Reminder node — inferred from its `NODE_SCHEMAS` entry. */
export type ReminderNodeData = NodeOf<'reminder'>['data'];

export type ReminderNodeFormProps = NodeFormProps<'reminder'>;
