import type { ChangeEvent } from "react";
import { ERROR_CLASSES, LABEL_CLASSES } from "../shared/fieldClasses";
import { resumeError } from "./career.schema";

interface ResumeFieldProps {
  file: File | null;
  error: string;
  /** Called with the accepted file (or null) and the reason it was refused (or ""). */
  onChange: (file: File | null, error: string) => void;
}

/** The resume picker: checks size and type as soon as a file is chosen. */
export function ResumeField({ file, error, onChange }: Readonly<ResumeFieldProps>) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    if (!picked) return;
    const problem = resumeError(picked);
    onChange(problem ? null : picked, problem);
  };

  return (
    <div>
      <label className={LABEL_CLASSES} htmlFor="resume">
        Resume <span className="text-gray-500 font-normal">(PDF, DOCX, Max 5MB)</span>
        <span className="text-red-500"> *</span>
      </label>
      <input
        type="file"
        id="resume"
        name="resume"
        accept=".pdf,.doc,.docx"
        onChange={handleChange}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all"
      />
      {error && <div className={ERROR_CLASSES}>{error}</div>}
      {file && (
        <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
          <i className="fa-solid fa-check"></i>
          {file.name}
        </p>
      )}
    </div>
  );
}
