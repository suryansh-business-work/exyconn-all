import { useRef } from 'react';
import { useT } from '@exyconn/i18n';
import { Flex, TextField } from '@exyconn/shell/components/ui';
import { VariablePicker } from '../personalize/VariablePicker';
import type { StudioOptions } from '../studio/useStudioOptions';

interface CaretTextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
  multiline?: boolean;
  /** When given, a variable picker inserts at the caret. */
  variables?: StudioOptions['variables'];
}

/** A text field whose variable picker inserts where the caret was, not at the end. */
export function CaretTextField({
  label,
  value,
  onChange,
  helperText,
  multiline,
  variables,
}: Readonly<CaretTextFieldProps>) {
  const t = useT();
  const input = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const insert = (text: string) => {
    const element = input.current;
    const start = element?.selectionStart ?? value.length;
    const end = element?.selectionEnd ?? value.length;
    onChange(value.slice(0, start) + text + value.slice(end));
    globalThis.requestAnimationFrame(() => {
      element?.focus();
      element?.setSelectionRange(start + text.length, start + text.length);
    });
  };
  return (
    <Flex direction="column" spacing={1}>
      <TextField
        label={t(label)}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        helperText={helperText ? t(helperText) : undefined}
        multiline={multiline}
        minRows={multiline ? 3 : undefined}
        fullWidth
        inputRef={input}
      />
      {variables && <VariablePicker variables={variables} onInsert={insert} />}
    </Flex>
  );
}
