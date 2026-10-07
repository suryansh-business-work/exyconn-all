export interface PositionFormStubProps {
  initial: unknown;
  /** The department a new position is created in. */
  department: string;
  onCancel: () => void;
  onDone: () => void;
}

/**
 * Stands in for the position form inside the departments page test: shows the row it edits
 * and the department it was handed, and exposes the page's cancel and done callbacks.
 */
export function PositionFormStub({
  initial,
  department,
  onCancel,
  onDone,
}: Readonly<PositionFormStubProps>) {
  const record = initial ? JSON.stringify(initial) : 'nothing';
  return (
    <div>
      <p>{`Position form for ${record} in "${department}"`}</p>
      <button type="button" onClick={onCancel}>
        Cancel position form
      </button>
      <button type="button" onClick={onDone}>
        Finish position form
      </button>
    </div>
  );
}
