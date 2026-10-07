import { useCurrentUrl } from './test-utils';

export interface FormStubProps {
  /** The row a CRUD form edits, or null for a new one. */
  initial?: unknown;
  /** The campaign a send form or details drawer is about. */
  campaign?: unknown;
  onCancel?: () => void;
  onDone?: () => void;
}

/**
 * Stands in for a module form inside a page test: shows the record it was opened with and
 * exposes the page's cancel and done callbacks as buttons. The forms have their own tests.
 */
export function FormStub({ initial, campaign, onCancel, onDone }: Readonly<FormStubProps>) {
  const record = initial ?? campaign;
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

/** Prints the router's current URL, so a test can see where the page navigated. */
export function UrlProbe() {
  const url = useCurrentUrl();
  return <output aria-label="current url">{url}</output>;
}
