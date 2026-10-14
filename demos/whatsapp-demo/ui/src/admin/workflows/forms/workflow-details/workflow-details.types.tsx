import type { WhatsappWorkflowCreateInput } from '@exyconn/shell/graphql/generated';

/** A workflow's details as the form edits them — the create input minus its demo. */
export type WorkflowDetailsValues = Required<
  Omit<WhatsappWorkflowCreateInput, 'demoId' | 'order'>
> & {
  order: number;
};

export interface WorkflowDetailsFormProps {
  initial: WorkflowDetailsValues;
  /** Editing an existing workflow: its key is fixed (Jump nodes and analytics use it). */
  isEdit: boolean;
  onSubmit: (values: WorkflowDetailsValues) => Promise<void> | void;
  onCancel: () => void;
}
