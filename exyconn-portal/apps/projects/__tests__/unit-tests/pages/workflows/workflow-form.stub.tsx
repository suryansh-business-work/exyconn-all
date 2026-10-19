import type { WorkflowDetails, WorkflowFormValues } from '../../../../src/pages/workflows/forms/workflow';

interface WorkflowFormStubProps {
  initial: WorkflowFormValues | null;
  onSubmit: (details: WorkflowDetails) => Promise<void>;
  onCancel: () => void;
}

/** What the stand-in form submits. */
export const STUB_DETAILS: WorkflowDetails = { name: 'Release sign-off', description: 'Ship it' };

/**
 * Stands in for the workflow details form inside the page tests (the form has its own tests):
 * names what it was opened with and exposes submit and cancel as buttons.
 */
export function WorkflowFormStub({ initial, onSubmit, onCancel }: Readonly<WorkflowFormStubProps>) {
  return (
    <div>
      <p>{initial ? `Details of ${initial.name}: ${initial.description}` : 'New workflow form'}</p>
      <button type="button" onClick={() => onSubmit(STUB_DETAILS)}>
        Submit details
      </button>
      <button type="button" onClick={onCancel}>
        Cancel details
      </button>
    </div>
  );
}
