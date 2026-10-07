export interface FormStubProps {
  /** The row a CRUD form edits, or null for a new one. */
  initial?: unknown;
  /** The applicant the stage form moves. */
  applicant?: unknown;
  onCancel: () => void;
  onDone: () => void;
}

/**
 * Stands in for a module form inside a page test: shows the record it was opened with and
 * exposes the page's cancel and done callbacks as buttons. The forms have their own tests.
 */
export function FormStub({ initial, applicant, onCancel, onDone }: Readonly<FormStubProps>) {
  const record = initial ?? applicant;
  return (
    <div>
      <p>{record ? `Form for ${JSON.stringify(record)}` : 'Blank form'}</p>
      <button type="button" onClick={onCancel}>
        Cancel form
      </button>
      <button type="button" onClick={onDone}>
        Finish form
      </button>
    </div>
  );
}
