import { vi } from 'vitest';
import type { CodeEditorProps } from '../../../../../packages/code-editor/src/types';

/**
 * Monaco needs a real browser (workers, layout), which jsdom is not. Every code field in these
 * tests is therefore a labelled text area with the same value, change, blur, helper and error
 * contract as the real editor, so a test reads and types into it like any other field.
 *
 * Mocked by its source file: this app reaches the editor only through the shell's code field,
 * so `@exyconn/code-editor` is the shell's dependency, not one this app could name.
 */
vi.mock('../../../../../packages/code-editor/src/CodeEditor', () => ({
  CodeEditor: ({
    value,
    onChange,
    onBlur,
    label,
    helperText,
    error,
  }: Readonly<CodeEditorProps>) => (
    <div>
      <textarea
        aria-label={label}
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
      {(error ?? helperText) && <p>{error ?? helperText}</p>}
    </div>
  ),
}));
