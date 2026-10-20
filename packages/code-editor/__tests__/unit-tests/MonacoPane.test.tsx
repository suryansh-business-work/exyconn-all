import { useEffect, useRef, type ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@exyconn/ui/styles';
import type { CodeEditorProps } from '../../src/types';

/** What the fake Monaco received, and the editor instance it hands to `onMount`. */
const fake = vi.hoisted(() => ({
  props: {} as Record<string, unknown>,
  mountOnRender: true,
  text: '',
  hasModel: true,
  blur: undefined as undefined | (() => void),
  action: null as null | { run: () => Promise<void> },
  selection: null as null | { line: number },
  setModelMarkers: vi.fn(),
  executeEdits: vi.fn(),
  focus: vi.fn(),
}));

const model = {
  getValue: () => fake.text,
  getLineCount: () => fake.text.split('\n').length,
  getLineMaxColumn: (line: number) => (fake.text.split('\n')[line - 1] ?? '').length + 1,
};

const editor = {
  getModel: () => (fake.hasModel ? model : null),
  onDidBlurEditorText: (listener: () => void) => {
    fake.blur = listener;
  },
  getAction: (id: string) => (id === 'editor.action.formatDocument' ? fake.action : null),
  getSelection: () => fake.selection,
  executeEdits: fake.executeEdits,
  focus: fake.focus,
};

vi.mock('../../src/monaco-setup', () => ({
  monaco: {
    MarkerSeverity: { Hint: 1, Info: 2, Warning: 4, Error: 8 },
    editor: { setModelMarkers: fake.setModelMarkers },
  },
}));

vi.mock('@monaco-editor/react', () => ({
  default: function FakeMonaco(props: Readonly<Record<string, unknown>>) {
    fake.props = props;
    const onMount = props.onMount as (instance: typeof editor) => void;
    const mounted = useRef(false);
    // Monaco mounts once, like the real component.
    useEffect(() => {
      if (mounted.current || !fake.mountOnRender) return;
      mounted.current = true;
      onMount(editor);
    });
    return <div data-testid="monaco">{props.loading as ReactNode}</div>;
  },
}));

const { default: MonacoPane } = await import('../../src/MonacoPane');

const marker = (severity: number, line = 2) => ({
  startLineNumber: line,
  startColumn: 4,
  message: `Severity ${severity}`,
  severity,
});

function renderPane(props: Partial<CodeEditorProps> = {}, mode: 'light' | 'dark' = 'light') {
  const onChange = vi.fn();
  const view = render(
    <ThemeProvider theme={createTheme({ palette: { mode } })}>
      <MonacoPane
        label="Template"
        value={fake.text}
        onChange={onChange}
        language="html"
        {...props}
      />
    </ThemeProvider>,
  );
  return { onChange, view };
}

/** The markers last written by one owner: the tag check, or the host's problems. */
const lastMarkers = (owner = 'exyconn-html') =>
  fake.setModelMarkers.mock.calls.findLast((call) => call[1] === owner)?.[2] as unknown[];
const ownerCalls = (owner: string) =>
  fake.setModelMarkers.mock.calls.filter((call) => call[1] === owner);
const option = (key: string) => (fake.props.options as Record<string, unknown>)[key];

describe('MonacoPane', () => {
  beforeEach(() => {
    fake.mountOnRender = true;
    fake.text = '<div><p></div>';
    fake.hasModel = true;
    fake.blur = undefined;
    fake.action = null;
    fake.selection = null;
    fake.setModelMarkers.mockReset();
    fake.executeEdits.mockReset();
    fake.focus.mockReset();
  });

  it('configures Monaco for the field and labels it by language', () => {
    renderPane({ height: 320 });
    expect(screen.getByText('Template')).toBeInTheDocument();
    expect(screen.getByText('HTML')).toBeInTheDocument();
    expect(fake.props).toMatchObject({ height: 320, language: 'html', theme: 'light' });
    expect(option('ariaLabel')).toBe('Template');
    expect(option('readOnly')).toBe(false);
    expect(screen.getByRole('button', { name: 'Format' })).toBeEnabled();
  });

  it('uses the dark Monaco theme in dark mode, and a default height', () => {
    renderPane({ language: 'json' }, 'dark');
    expect(fake.props).toMatchObject({ height: 240, theme: 'vs-dark' });
    expect(screen.getByText('JSON')).toBeInTheDocument();
  });

  it('marks unpaired HTML tags on mount and again when the value changes', () => {
    const { onChange, view } = renderPane();
    expect(fake.setModelMarkers).toHaveBeenCalledWith(expect.anything(), 'exyconn-html', [
      {
        startLineNumber: 1,
        startColumn: 6,
        endLineNumber: 1,
        endColumn: 7,
        message: '<p> is not closed before </div>',
        severity: 8,
      },
    ]);
    fake.text = '<div></div>';
    view.rerender(
      <ThemeProvider theme={createTheme()}>
        <MonacoPane label="Template" value={fake.text} onChange={onChange} language="html" />
      </ThemeProvider>,
    );
    expect(lastMarkers()).toEqual([]);
  });

  it('leaves CSS and JSON to Monaco and writes no tag markers', () => {
    renderPane({ language: 'css' });
    expect(screen.getByText('CSS')).toBeInTheDocument();
    expect(ownerCalls('exyconn-html')).toEqual([]);
    // The host's problems are still cleared on mount, so none linger from an earlier value.
    expect(lastMarkers('exyconn-external')).toEqual([]);
  });

  it('writes no markers while the editor has no model, or before it mounts', () => {
    fake.hasModel = false;
    renderPane();
    expect(fake.setModelMarkers).not.toHaveBeenCalled();
    fake.mountOnRender = false;
    fake.hasModel = true;
    renderPane();
    expect(fake.setModelMarkers).not.toHaveBeenCalled();
  });

  it("writes the host's problems at their lines, clamped into the document", () => {
    fake.text = 'one\ntwo\nthree';
    const { onChange, view } = renderPane({
      language: 'css',
      problems: [
        { line: 2, column: 3, message: 'Unknown tag', severity: 'error' },
        { line: 0, column: 0, message: 'Before the start', severity: 'warning' },
        { line: 99, column: 2, message: 'Past the end', severity: 'warning' },
      ],
    });
    expect(lastMarkers('exyconn-external')).toEqual([
      {
        startLineNumber: 2,
        startColumn: 3,
        endLineNumber: 2,
        endColumn: 4,
        message: 'Unknown tag',
        severity: 8,
      },
      {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 4,
        message: 'Before the start',
        severity: 4,
      },
      {
        startLineNumber: 3,
        startColumn: 2,
        endLineNumber: 3,
        endColumn: 6,
        message: 'Past the end',
        severity: 4,
      },
    ]);
    view.rerender(
      <ThemeProvider theme={createTheme()}>
        <MonacoPane label="Template" value={fake.text} onChange={onChange} language="css" />
      </ThemeProvider>,
    );
    expect(lastMarkers('exyconn-external')).toEqual([]);
  });

  it('hands the host an API that inserts at the cursor and focuses the editor', () => {
    const onReady = vi.fn();
    renderPane({ onReady });
    expect(onReady).toHaveBeenCalledTimes(1);
    const api = onReady.mock.calls[0][0] as {
      insertAtCursor: (t: string) => void;
      focus: () => void;
    };
    api.insertAtCursor('{{name}}');
    expect(fake.executeEdits).not.toHaveBeenCalled();
    fake.selection = { line: 1 };
    api.insertAtCursor('{{name}}');
    expect(fake.executeEdits).toHaveBeenCalledWith('insert', [
      { range: { line: 1 }, text: '{{name}}', forceMoveMarkers: true },
    ]);
    expect(fake.focus).toHaveBeenCalledTimes(1);
    api.focus();
    expect(fake.focus).toHaveBeenCalledTimes(2);
  });

  it('passes edits on, an emptied editor as an empty string', () => {
    const { onChange } = renderPane();
    const change = fake.props.onChange as (next: string | undefined) => void;
    change('<b>');
    change(undefined);
    expect(onChange.mock.calls).toEqual([['<b>'], ['']]);
  });

  it('reports leaving the editor to the latest onBlur, and tolerates none', () => {
    const first = vi.fn();
    const latest = vi.fn();
    const { view } = renderPane({ onBlur: first });
    view.rerender(
      <ThemeProvider theme={createTheme()}>
        <MonacoPane label="Template" value="" onChange={vi.fn()} language="css" onBlur={latest} />
      </ThemeProvider>,
    );
    fake.blur?.();
    expect(latest).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
    view.rerender(
      <ThemeProvider theme={createTheme()}>
        <MonacoPane label="Template" value="" onChange={vi.fn()} language="css" />
      </ThemeProvider>,
    );
    expect(() => fake.blur?.()).not.toThrow();
  });

  it("lists Monaco's findings, errors and warnings", () => {
    renderPane({ language: 'json' });
    expect(screen.getByRole('status')).toHaveTextContent('No problems found');
    const validate = fake.props.onValidate as (markers: unknown[]) => void;
    act(() => validate([marker(8, 1), marker(4, 3)]));
    expect(screen.getByRole('status')).toHaveTextContent('2 problem(s) found');
    expect(screen.getByText('Line 1, column 4: Severity 8')).toBeInTheDocument();
    expect(screen.getByText('Line 3, column 4: Severity 4')).toBeInTheDocument();
  });

  it('formats the document with Monaco', async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    fake.action = { run };
    renderPane();
    fireEvent.click(screen.getByRole('button', { name: 'Format' }));
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('logs a formatting failure instead of throwing', async () => {
    const failure = new Error('formatter crashed');
    fake.action = { run: () => Promise.reject(failure) };
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderPane();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Format' }));
    });
    expect(log).toHaveBeenCalledWith('Formatting failed', failure);
    log.mockRestore();
  });

  it('does nothing on Format when there is no editor or no format action', () => {
    fake.mountOnRender = false;
    renderPane();
    expect(() => fireEvent.click(screen.getByRole('button', { name: 'Format' }))).not.toThrow();
  });

  it('does nothing on Format when Monaco has no format action', () => {
    renderPane();
    expect(() => fireEvent.click(screen.getByRole('button', { name: 'Format' }))).not.toThrow();
    expect(fake.action).toBeNull();
  });

  it('disables Format and editing when read-only', () => {
    renderPane({ readOnly: true });
    expect(screen.getByRole('button', { name: 'Format' })).toBeDisabled();
    expect(option('readOnly')).toBe(true);
  });

  it('shows the helper text, replaced by the error when there is one', () => {
    const { view } = renderPane({ helperText: 'Use MJML tags' });
    expect(screen.getByText('Use MJML tags')).toBeInTheDocument();
    view.unmount();
    renderPane({ helperText: 'Use MJML tags', error: 'Required' });
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.queryByText('Use MJML tags')).not.toBeInTheDocument();
  });

  it('shows no caption when there is neither help nor an error', () => {
    renderPane();
    expect(screen.getByRole('status').nextElementSibling).toBeNull();
  });

  it('shows a placeholder the size of the editor while Monaco loads', () => {
    renderPane({ height: 180 });
    expect(screen.getByTestId('monaco').firstElementChild).toHaveStyle({ height: '180px' });
  });
});
