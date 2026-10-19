import { act, render, screen } from '@testing-library/react';
import type { CodeEditorProps } from '../../src/types';

/** Lets a test decide when the lazily loaded Monaco pane arrives. */
const pane = vi.hoisted(() => {
  let release: () => void = () => undefined;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { ready, release: () => release() };
});

vi.mock('../../src/MonacoPane', async () => {
  await pane.ready;
  return {
    default: ({ label, value }: Readonly<CodeEditorProps>) => (
      <p>
        {label}: {value}
      </p>
    ),
  };
});

const { CodeEditor } = await import('../../src/CodeEditor');

describe('CodeEditor', () => {
  it('holds a labelled, busy placeholder sized to the editor until Monaco loads', async () => {
    render(
      <>
        <CodeEditor label="Body" value="<p>hi</p>" onChange={vi.fn()} language="html" />
        <CodeEditor label="Styles" value="a{}" onChange={vi.fn()} language="css" height={100} />
      </>,
    );
    const body = screen.getByLabelText('Body');
    expect(body).toHaveAttribute('aria-busy', 'true');
    // The editor height plus the toolbar above it, 240 when no height is given.
    expect(body.firstElementChild).toHaveStyle({ height: '272px' });
    expect(screen.getByLabelText('Styles').firstElementChild).toHaveStyle({ height: '132px' });

    await act(async () => {
      pane.release();
      await pane.ready;
    });
    expect(await screen.findByText('Body: <p>hi</p>')).toBeInTheDocument();
    expect(screen.getByText('Styles: a{}')).toBeInTheDocument();
    expect(screen.queryByLabelText('Body')).not.toBeInTheDocument();
  });
});
