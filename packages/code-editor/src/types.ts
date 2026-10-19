/** The languages a code field edits. MJML is markup, so it is edited as `html`. */
export type CodeLanguage = 'html' | 'css' | 'json';

export type ProblemSeverity = 'error' | 'warning';

/** One finding about the code, at a 1-based line and column. */
export interface CodeProblem {
  line: number;
  column: number;
  message: string;
  severity: ProblemSeverity;
}

/** What a host can do with a mounted editor. */
export interface CodeEditorApi {
  /** Replaces the selection (or inserts at the cursor) with text, as one undoable edit. */
  insertAtCursor: (text: string) => void;
  focus: () => void;
}

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  language: CodeLanguage;
  /** Already translated. */
  label: string;
  /** Already translated; shown under the editor unless there is an error. */
  helperText?: string;
  /** Already translated; the field's validation error. */
  error?: string;
  /** Editor height in pixels. */
  height?: number;
  readOnly?: boolean;
  /** Told once the editor is mounted, with the actions a host may run on it. */
  onReady?: (api: CodeEditorApi) => void;
  /**
   * Problems found outside the editor — a server-side compiler's, say. Shown in the gutter
   * and the problems list beside the editor's own.
   */
  problems?: readonly CodeProblem[];
}
