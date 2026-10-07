export interface FormStubProps {
  /** The row a CRUD form edits, or null for a new one. */
  initial?: unknown;
  /** The record a single-purpose form (send, approve) acts on. */
  invoice?: unknown;
  claim?: unknown;
  /** The cost centre options the budget form is handed. */
  costCentres?: unknown;
  onCancel: () => void;
  onDone: () => void;
}

/**
 * Stands in for a module form inside a page test: shows the record it was opened with and
 * exposes the page's cancel and done callbacks as buttons. The forms have their own tests.
 */
export function FormStub({
  initial,
  invoice,
  claim,
  costCentres,
  onCancel,
  onDone,
}: Readonly<FormStubProps>) {
  const record = initial ?? invoice ?? claim;
  return (
    <div>
      <p>{record ? `Form for ${JSON.stringify(record)}` : 'Blank form'}</p>
      {costCentres ? <p>{`Centres ${JSON.stringify(costCentres)}`}</p> : null}
      <button type="button" onClick={onCancel}>
        Cancel form
      </button>
      <button type="button" onClick={onDone}>
        Finish form
      </button>
    </div>
  );
}
