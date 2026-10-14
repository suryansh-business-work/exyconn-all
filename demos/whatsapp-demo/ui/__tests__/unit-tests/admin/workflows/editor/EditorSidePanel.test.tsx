import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { GraphIssue, WaNode } from '@exyconn/wa-flow';
import { EditorSidePanel } from '../../../../../src/admin/workflows/editor/EditorSidePanel';
import { renderWithProviders } from '../../../test-utils';
import { SAMPLE_GRAPH } from '../../admin.fixtures';

interface InspectorProps {
  node: WaNode;
  isStart: boolean;
  onApply: (data: WaNode['data']) => void;
  onSetStart: () => void;
  onDelete: () => void;
  onClose: () => void;
}

vi.mock('../../../../../src/admin/workflows/editor/panels/Inspector', () => ({
  Inspector: ({
    node,
    isStart,
    onApply,
    onSetStart,
    onDelete,
    onClose,
  }: Readonly<InspectorProps>) => (
    <section aria-label="inspector">
      <p>{`Inspecting ${node.id}${isStart ? ' (start)' : ''}`}</p>
      <button type="button" onClick={() => onApply(node.data)}>
        Apply
      </button>
      <button type="button" onClick={onSetStart}>
        Set as start
      </button>
      <button type="button" onClick={onDelete}>
        Delete
      </button>
      <button type="button" onClick={onClose}>
        Close inspector
      </button>
    </section>
  ),
}));
vi.mock('../../../../../src/admin/workflows/editor/panels/ValidationPanel', () => ({
  ValidationPanel: ({
    issues,
    onPick,
  }: Readonly<{ issues: readonly GraphIssue[]; onPick: (id: string) => void }>) => (
    <button
      type="button"
      onClick={() => onPick('text-1')}
    >{`${issues.length} issues listed`}</button>
  ),
}));

const ISSUES = [
  { severity: 'error', message: 'No end', nodeId: 'text-1' },
  { severity: 'warning', message: 'Long text', nodeId: 'text-1' },
] as unknown as GraphIssue[];
const NODE = SAMPLE_GRAPH.nodes[0];

type Props = Parameters<typeof EditorSidePanel>[0];

function mount(overrides: Partial<Props> = {}) {
  const props: Props = {
    issues: ISSUES,
    errors: 1,
    selected: undefined,
    isStart: false,
    env: { workflowKeys: ['book-visit'], aiConfigured: true },
    onPick: vi.fn(),
    onApply: vi.fn(),
    onSetStart: vi.fn(),
    onDelete: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  renderWithProviders(<EditorSidePanel {...props} />);
  return props;
}

describe('EditorSidePanel', () => {
  it('opens the problem list while there are errors and picks a node from it', async () => {
    const user = userEvent.setup();
    const props = mount();
    const summary = screen.getByRole('button', { name: 'Problems (2)' });
    expect(summary).toHaveAttribute('aria-expanded', 'true');
    await user.click(screen.getByRole('button', { name: '2 issues listed' }));
    expect(props.onPick).toHaveBeenCalledWith('text-1');
  });

  it('keeps the problem list folded when there are only warnings', () => {
    mount({ errors: 0 });
    expect(screen.getByRole('button', { name: 'Problems (2)' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('leaves the problem list out where it has its own place', () => {
    mount({ showProblems: false });
    expect(screen.queryByRole('button', { name: /Problems/ })).not.toBeInTheDocument();
  });

  it('asks for a node to be picked when none is selected', () => {
    mount();
    expect(
      screen.getByText('Select a node to edit it, or add one from the palette.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'inspector' })).not.toBeInTheDocument();
  });

  it('inspects the selected node and wires its actions through', async () => {
    const user = userEvent.setup();
    const props = mount({ selected: NODE, isStart: true });
    expect(screen.getByText('Inspecting text-1 (start)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    await user.click(screen.getByRole('button', { name: 'Set as start' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Close inspector' }));
    expect(props.onApply).toHaveBeenCalledWith(NODE.data);
    expect(props.onSetStart).toHaveBeenCalledTimes(1);
    expect(props.onDelete).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
