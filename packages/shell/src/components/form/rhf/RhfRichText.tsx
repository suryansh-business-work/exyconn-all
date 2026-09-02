import { useEffect } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Box, Flex, FormHelperText, Text } from '@/components/ui';
import { RichTextToolbar } from './RichTextToolbar';

interface RhfRichTextProps {
  name: string;
  label: string;
  helperText?: string;
}

/**
 * React Hook Form-bound rich-text field. TipTap is headless, so the toolbar is
 * built from MUI icon buttons and the content area is styled like an outlined
 * MUI TextField. The form value is an HTML string; an empty document is written
 * back as `''` so a `min(1)` schema rule still catches "no content".
 */
export function RhfRichText({ name, label, helperText }: Readonly<RhfRichTextProps>) {
  const { control } = useFormContext();
  const { field, fieldState } = useController({ name, control });
  const value: string = field.value ?? '';
  const hasError = Boolean(fieldState.error);
  const accent = hasError ? 'error' : 'primary';

  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor: instance }) => field.onChange(instance.isEmpty ? '' : instance.getHTML()),
    onBlur: () => field.onBlur(),
    editorProps: { attributes: { 'aria-label': label, 'aria-multiline': 'true' } },
  });

  // Re-sync when the value changes outside the editor (e.g. `reset()` on cancel
  // or after a save). Typing is a no-op here: the value already matches.
  useEffect(() => {
    const current = editor.isEmpty ? '' : editor.getHTML();
    if (current !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  const message = fieldState.error?.message ?? helperText;

  return (
    <Flex direction="column" spacing={0.75}>
      <Text size="sm" weight="medium" color={hasError ? 'error.main' : 'text.primary'}>
        {label}
      </Text>
      <Box
        sx={{
          border: 1,
          borderColor: hasError ? 'error.main' : 'divider',
          borderRadius: 1,
          transition: 'border-color 120ms ease',
          '&:focus-within': {
            borderColor: `${accent}.main`,
            boxShadow: (theme) => `0 0 0 1px ${theme.palette[accent].main}`,
          },
          '& .tiptap': { minHeight: 160, p: 1.5, outline: 'none' },
          '& .tiptap > :first-of-type': { mt: 0 },
          '& .tiptap > :last-child': { mb: 0 },
          '& .tiptap p': { my: 1 },
          '& .tiptap ul, & .tiptap ol': { my: 1, pl: 3 },
        }}
      >
        <RichTextToolbar editor={editor} />
        <EditorContent editor={editor} />
      </Box>
      {message && <FormHelperText error={hasError}>{message}</FormHelperText>}
    </Flex>
  );
}
