import { useState } from 'react';
import { EditorContent } from '@tiptap/react';
import {
  Alert,
  Box,
  Flex,
  FormHelperText,
  LinearProgress,
  Text,
  focusRing,
  transition,
} from '@exyconn/ui';
import { Toolbar } from '../toolbar/Toolbar';
import type { RichTextEditorProps } from '../types';
import { contentStyles } from './content.styles';
import { EditorDialogs, type EditorDialog } from './EditorDialogs';
import { SourceView } from './SourceView';
import { WordCount } from './WordCount';
import { useRichTextEditor } from './useRichTextEditor';

/**
 * The Exyconn rich-text editor, framed like an outlined MUI TextField. The value is an
 * HTML string. Images come from the host's `uploadImage` — through the image dialog, or
 * pasted / dropped straight into the document.
 */
export function RichTextEditor({
  value,
  onChange,
  onBlur,
  uploadImage,
  label,
  helperText,
  error,
  placeholder = 'Start writing…',
  minHeight = 200,
}: Readonly<RichTextEditorProps>) {
  const { editor, status } = useRichTextEditor({
    value,
    label,
    placeholder,
    onChange,
    onBlur,
    uploadImage,
  });
  const [sourceMode, setSourceMode] = useState(false);
  const [dialog, setDialog] = useState<EditorDialog>(null);
  const hasError = Boolean(error);
  const accent = hasError ? 'error' : 'primary';
  const message = error ?? helperText;

  return (
    <Flex direction="column" spacing={0.75}>
      <Text size="sm" weight="medium" color={hasError ? 'error.main' : 'text.primary'}>
        {label}
      </Text>
      <Box
        sx={[
          {
            border: 1,
            borderColor: hasError ? 'error.main' : 'divider',
            borderRadius: 1,
            transition: transition.surface,
            '&:focus-within': {
              borderColor: `${accent}.main`,
              boxShadow: (theme) => focusRing(theme.palette[accent].main),
            },
          },
          contentStyles(minHeight),
        ]}
      >
        <Toolbar
          editor={editor}
          sourceMode={sourceMode}
          onToggleSource={() => setSourceMode((current) => !current)}
          onOpenLink={() => setDialog('link')}
          onOpenImage={() => setDialog('image')}
        />
        {status.pending > 0 && <LinearProgress aria-label="Uploading images" />}
        {status.error && (
          <Alert severity="error" onClose={status.dismissError} sx={{ borderRadius: 0 }}>
            Image upload failed: {status.error}
          </Alert>
        )}
        {sourceMode ? (
          <SourceView editor={editor} label={label} minHeight={minHeight} />
        ) : (
          <EditorContent editor={editor} />
        )}
        <Flex
          justifyContent="flex-end"
          sx={{ px: 1.5, py: 0.5, borderTop: 1, borderColor: 'divider' }}
        >
          <WordCount editor={editor} />
        </Flex>
      </Box>
      {message && <FormHelperText error={hasError}>{message}</FormHelperText>}
      <EditorDialogs
        editor={editor}
        dialog={dialog}
        uploadImage={uploadImage}
        onClose={() => setDialog(null)}
      />
    </Flex>
  );
}
