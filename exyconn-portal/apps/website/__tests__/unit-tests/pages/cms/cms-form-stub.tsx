/** What a CMS page hands its record form. */
export interface CmsFormStubProps {
  siteId?: string;
  initial?: { id: string } | null;
  onCancel: () => void;
  onDone: () => void;
  onCreated?: (id: string) => void;
}

/** The id the stand-in form reports for a record it created. */
export const CREATED_ID = 'created-1';

/**
 * Stands in for a CMS record form inside a page test: shows which record it was opened with
 * (and for which site), and exposes the page's cancel, done and created callbacks as buttons.
 * The forms have their own tests.
 */
export function CmsFormStub({
  siteId,
  initial,
  onCancel,
  onDone,
  onCreated,
}: Readonly<CmsFormStubProps>) {
  const record = initial ? `Form for ${initial.id}` : 'Blank form';
  return (
    <div>
      <p>{siteId ? `${record} on ${siteId}` : record}</p>
      <button type="button" onClick={onCancel}>
        Cancel form
      </button>
      <button type="button" onClick={onDone}>
        Finish form
      </button>
      {onCreated && (
        <button type="button" onClick={() => onCreated(CREATED_ID)}>
          Create in form
        </button>
      )}
    </div>
  );
}
