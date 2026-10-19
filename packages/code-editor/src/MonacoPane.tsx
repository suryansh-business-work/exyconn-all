import { useEffect, useRef, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import { useT } from '@exyconn/i18n';
import { Box, Button, Chip, Flex, Skeleton, Text, useTheme } from '@exyconn/ui';
import { htmlProblems } from './html-problems';
import { monaco } from './monaco-setup';
import { ProblemsList } from './ProblemsList';
import type { CodeEditorProps, CodeProblem } from './types';

type MonacoInstance = Parameters<OnMount>[0];

/** Owner of the markers the HTML/MJML check writes, beside Monaco's own JSON and CSS ones. */
const HTML_OWNER = 'exyconn-html';

/** Owner of the markers a host hands in (a server-side compiler's). */
const EXTERNAL_OWNER = 'exyconn-external';

/** Writes the host's problems onto the model, at their lines. */
function markExternal(editor: MonacoInstance, problems: readonly CodeProblem[]): void {
  const model = editor.getModel();
  if (!model) return;
  const lines = model.getLineCount();
  const markers = problems.map((problem) => {
    const line = Math.min(Math.max(problem.line, 1), lines);
    return {
      startLineNumber: line,
      startColumn: Math.max(problem.column, 1),
      endLineNumber: line,
      endColumn: model.getLineMaxColumn(line),
      message: problem.message,
      severity:
        problem.severity === 'error' ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
    };
  });
  monaco.editor.setModelMarkers(model, EXTERNAL_OWNER, markers);
}

const LANGUAGE_LABEL = { html: 'HTML', css: 'CSS', json: 'JSON' } as const;

const toProblem = (marker: monaco.editor.IMarker): CodeProblem => ({
  line: marker.startLineNumber,
  column: marker.startColumn,
  message: marker.message,
  severity: marker.severity >= monaco.MarkerSeverity.Error ? 'error' : 'warning',
});

/** Writes the tag check's findings onto the model, so they show in the gutter like any other. */
function markHtml(editor: MonacoInstance): void {
  const model = editor.getModel();
  if (!model) return;
  const markers = htmlProblems(model.getValue()).map((problem) => ({
    startLineNumber: problem.line,
    startColumn: problem.column,
    endLineNumber: problem.line,
    endColumn: problem.column + 1,
    message: problem.message,
    severity: monaco.MarkerSeverity.Error,
  }));
  monaco.editor.setModelMarkers(model, HTML_OWNER, markers);
}

/** Monaco itself, with the field's label, a Format button and the problems it finds. */
export default function MonacoPane(props: Readonly<CodeEditorProps>) {
  const { value, onChange, onBlur, language, label, helperText, error } = props;
  const { height = 240, readOnly = false, onReady, problems: external } = props;
  const t = useT();
  const theme = useTheme();
  const editorRef = useRef<MonacoInstance | null>(null);
  const [problems, setProblems] = useState<CodeProblem[]>([]);
  const blurRef = useRef(onBlur);
  blurRef.current = onBlur;

  useEffect(() => {
    if (language === 'html' && editorRef.current) markHtml(editorRef.current);
  }, [language, value]);

  useEffect(() => {
    if (editorRef.current) markExternal(editorRef.current, external ?? []);
  }, [external]);

  const mount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.onDidBlurEditorText(() => blurRef.current?.());
    if (language === 'html') markHtml(editor);
    markExternal(editor, external ?? []);
    onReady?.({
      insertAtCursor: (text) => {
        const selection = editor.getSelection();
        if (!selection) return;
        editor.executeEdits('insert', [{ range: selection, text, forceMoveMarkers: true }]);
        editor.focus();
      },
      focus: () => editor.focus(),
    });
  };

  const format = () => {
    editorRef.current
      ?.getAction('editor.action.formatDocument')
      ?.run()
      .catch((reason: unknown) => console.error('Formatting failed', reason));
  };

  const borderColor = error ? 'error.main' : 'divider';
  return (
    <Box>
      <Flex alignItems="center" gap={1} sx={{ mb: 0.5 }}>
        <Text weight="semibold" size="sm" sx={{ flexGrow: 1 }}>
          {label}
        </Text>
        <Chip size="small" variant="outlined" label={LANGUAGE_LABEL[language]} />
        <Button
          size="small"
          variant="text"
          onClick={format}
          disabled={readOnly}
          startIcon={<FormatAlignLeftIcon fontSize="small" />}
        >
          {t('Format')}
        </Button>
      </Flex>
      <Box sx={{ border: 1, borderColor, borderRadius: 1, overflow: 'hidden' }}>
        <Editor
          height={height}
          language={language}
          value={value}
          theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'light'}
          loading={<Skeleton variant="rectangular" height={height} />}
          onChange={(next) => onChange(next ?? '')}
          onMount={mount}
          onValidate={(markers) => setProblems(markers.map(toProblem))}
          options={{
            ariaLabel: label,
            readOnly,
            minimap: { enabled: false },
            fontSize: 13,
            tabSize: 2,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            formatOnPaste: true,
            fixedOverflowWidgets: true,
          }}
        />
      </Box>
      <ProblemsList problems={problems} />
      {(error ?? helperText) && (
        <Text size="caption" color={error ? 'error' : 'text.secondary'} component="p">
          {error ?? helperText}
        </Text>
      )}
    </Box>
  );
}
