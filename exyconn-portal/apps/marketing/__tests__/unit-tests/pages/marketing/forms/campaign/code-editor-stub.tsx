import { useEffect } from 'react';
import { vi } from 'vitest';
import type { CodeEditorProps } from '@exyconn/code-editor';

/** What the stub editor hands to `onReady`, so a test can see what was inserted. */
export const editorApi = { insertAtCursor: vi.fn(), focus: vi.fn() };

/**
 * Monaco needs a real browser, which jsdom is not: the code field becomes a labelled text area
 * with the same value, change, blur, error and problems contract.
 */
export function CodeEditor({
  value,
  onChange,
  onBlur,
  label,
  error,
  readOnly,
  problems = [],
  onReady,
}: Readonly<CodeEditorProps>) {
  useEffect(() => {
    onReady?.(editorApi);
  }, [onReady]);
  return (
    <div>
      <textarea
        aria-label={label}
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
      {error && <p>{error}</p>}
      <ul aria-label={`${label} problems`}>
        {problems.map((problem) => (
          <li key={`${problem.line}-${problem.message}`}>
            {`${problem.severity} ${problem.line}:${problem.column} ${problem.message}`}
          </li>
        ))}
      </ul>
    </div>
  );
}
