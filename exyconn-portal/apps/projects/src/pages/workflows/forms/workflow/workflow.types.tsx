import type { ProjectWorkflowInput } from '@exyconn/shell/graphql/generated';

/** A workflow's name and purpose — the generated input, as the form sends it. */
export type WorkflowDetails = ProjectWorkflowInput;

/** What the details form edits. */
export interface WorkflowFormValues {
  name: string;
  description: string;
}
