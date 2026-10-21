import { useController, useFormContext } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { CodeEditor, type CodeLanguage } from '@exyconn/code-editor';
import { useFieldMeta } from './useFieldMeta';

interface RhfCodeEditorProps {
  name: string;
  label: string;
  language: CodeLanguage;
  helperText?: string;
  height?: number;
}

/**
 * React Hook Form-bound code field — the `@exyconn/code-editor` Monaco editor, with Format
 * and a live problems list. The form value is the code as a string.
 */
export function RhfCodeEditor({
  name,
  label,
  language,
  helperText,
  height,
}: Readonly<RhfCodeEditorProps>) {
  const { control } = useFormContext();
  const t = useT();
  const { field, fieldState } = useController({ name, control });
  const hint = useFieldMeta(name, { helperText }).helperText;

  return (
    <CodeEditor
      value={field.value ?? ''}
      onChange={field.onChange}
      onBlur={field.onBlur}
      language={language}
      label={t(label)}
      helperText={hint ? t(hint) : undefined}
      error={fieldState.error?.message ? t(fieldState.error.message) : undefined}
      height={height}
    />
  );
}
