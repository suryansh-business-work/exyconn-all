import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { NodeType } from '@exyconn/wa-flow';
import { PhoneEditorChrome } from '../../../../../src/admin/workflows/editor/PhoneEditorChrome';
import { renderWithProviders } from '../../../test-utils';

vi.mock('../../../../../src/admin/workflows/editor/canvas/NodePalette', () => ({
  NodePalette: ({ onAdd }: Readonly<{ onAdd: (type: NodeType) => void }>) => (
    <button type="button" onClick={() => onAdd('text')}>
      Add a text node
    </button>
  ),
}));

type Props = Parameters<typeof PhoneEditorChrome>[0];

function mount(overrides: Partial<Props> = {}) {
  const props: Props = {
    errors: 0,
    inspectorOpen: false,
    onCloseInspector: vi.fn(),
    onAdd: vi.fn(),
    previewOpen: false,
    onClosePreview: vi.fn(),
    inspector: <p>Inspector panel</p>,
    problems: <p>Problem list</p>,
    preview: <p>Preview pane</p>,
    ...overrides,
  };
  renderWithProviders(<PhoneEditorChrome {...props} />);
  return props;
}

describe('PhoneEditorChrome', () => {
  it('keeps every panel closed until asked for', () => {
    mount();
    expect(screen.getByRole('button', { name: 'Add node' })).toBeInTheDocument();
    for (const text of ['Inspector panel', 'Problem list', 'Preview pane', 'Add a text node']) {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    }
  });

  it('adds a node from the palette drawer, closing it', async () => {
    const user = userEvent.setup();
    const props = mount();
    await user.click(screen.getByRole('button', { name: 'Add node' }));
    await user.click(await screen.findByRole('button', { name: 'Add a text node' }));
    expect(props.onAdd).toHaveBeenCalledWith('text');
    await waitFor(() => expect(screen.queryByText('Add a text node')).not.toBeInTheDocument());
  });

  it('opens the problem list, counting the errors, and closes it on Escape', async () => {
    const user = userEvent.setup();
    mount({ errors: 4 });
    const problems = screen.getByRole('button', { name: /Problems/ });
    expect(problems).toHaveTextContent('4');
    expect(problems).toHaveClass('MuiButton-colorError');
    await user.click(problems);
    expect(await screen.findByText('Problem list')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByText('Problem list')).not.toBeInTheDocument());
  });

  it('shows the problems button in the plain colour when there are no errors', () => {
    mount({ errors: 0 });
    expect(screen.getByRole('button', { name: /Problems/ })).toHaveClass('MuiButton-colorInherit');
  });

  it('slides the inspector up while a node is selected and closes it on request', async () => {
    const user = userEvent.setup();
    const props = mount({ inspectorOpen: true });
    expect(screen.getByText('Inspector panel')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(props.onCloseInspector).toHaveBeenCalledTimes(1);
  });

  it('shows the preview full screen and closes it on request', async () => {
    const user = userEvent.setup();
    const props = mount({ previewOpen: true });
    expect(screen.getByRole('dialog')).toHaveTextContent('Preview pane');
    await user.keyboard('{Escape}');
    expect(props.onClosePreview).toHaveBeenCalledTimes(1);
  });
});
