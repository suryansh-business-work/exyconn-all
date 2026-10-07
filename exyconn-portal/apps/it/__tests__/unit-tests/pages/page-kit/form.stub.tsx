export interface FormStubProps {
  /** The row a CRUD form edits, or null for a new one. */
  initial?: unknown;
  /** The categories a shared content form may offer. */
  categories?: readonly string[];
  onCancel: () => void;
  onDone: () => void;
}

/**
 * Stands in for a module form inside a page test: shows the record it was opened with and
 * exposes the page's cancel and done callbacks as buttons. The forms have their own tests.
 */
export function FormStub({ initial, categories, onCancel, onDone }: Readonly<FormStubProps>) {
  return (
    <div>
      <p>{initial ? `Form for ${JSON.stringify(initial)}` : 'Blank form'}</p>
      {categories && <p>{`Categories: ${categories.join(', ')}`}</p>}
      <button type="button" onClick={onCancel}>
        Cancel form
      </button>
      <button type="button" onClick={onDone}>
        Finish form
      </button>
    </div>
  );
}
