import { useId, type ChangeEvent } from "react";
import { resumeError } from "../../forms/career/career.schema";
import { RESUME_ACCEPT } from "../../../lib/career/application";

interface ResumeInputProps {
  label: string;
  hint: string;
  /** Shown in the box until a file is picked. */
  empty: string;
  choose: string;
  change: string;
  file: File | null;
  error: string;
  /** Called with the accepted file (or null) and the reason it was refused (or ""). */
  onChange: (file: File | null, error: string) => void;
}

/** The résumé picker: a real file input under a large target, checked as soon as a file is picked. */
export function ResumeInput({
  label,
  hint,
  empty,
  choose,
  change,
  file,
  error,
  onChange,
}: Readonly<ResumeInputProps>) {
  const hintId = useId();
  const errorId = useId();
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    if (!picked) return;
    const problem = resumeError(picked);
    onChange(problem ? null : picked, problem);
  };
  const describedBy = error ? `${hintId} ${errorId}` : hintId;

  return (
    <div className="job-apply__resume">
      <label htmlFor="resume">
        {label} <span className="text-red-fg">*</span>
      </label>
      <div className="job-apply__drop" data-filled={file ? "" : undefined}>
        <input
          id="resume"
          type="file"
          accept={RESUME_ACCEPT}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          onChange={handleChange}
        />
        <span className="job-apply__drop-action" aria-hidden="true">
          {file ? change : choose}
        </span>
        <span className="job-apply__drop-name">{file?.name ?? empty}</span>
      </div>
      <p id={hintId} className="legal-form__fine-print mt-2">
        {hint}
      </p>
      {error && (
        <p id={errorId} role="alert" className="text-red-fg text-xs mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
