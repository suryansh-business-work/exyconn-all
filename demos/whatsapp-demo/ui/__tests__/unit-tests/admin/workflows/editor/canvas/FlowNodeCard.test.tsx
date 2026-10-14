import { screen } from '@testing-library/react';
import type { NodeProps } from '@xyflow/react';
import type { WaNode } from '@exyconn/wa-flow';
import { FlowNodeCard } from '../../../../../../src/admin/workflows/editor/canvas/FlowNodeCard';
import type {
  WaFlowNode,
  WaFlowNodeData,
} from '../../../../../../src/admin/workflows/editor/canvas/flow-nodes';
import { renderWithProviders } from '../../../../test-utils';
import { makeNode } from '../inspector/node-form-helpers';

vi.mock('@xyflow/react', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  Handle: ({ id, type, ...rest }: Readonly<Record<string, unknown>>) => (
    <span
      data-testid={`handle-${String(type)}`}
      data-id={String(id)}
      aria-label={String(rest['aria-label'])}
    />
  ),
}));

function renderCard(
  node: WaNode,
  data: Partial<WaFlowNodeData> = {},
  selected = false,
  messages: Record<string, string> = {},
) {
  const props: NodeProps<WaFlowNode> = {
    id: node.id,
    type: node.type,
    selected,
    dragging: false,
    draggable: true,
    selectable: true,
    deletable: true,
    isConnectable: true,
    zIndex: 0,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
    data: { node, isStart: false, errors: 0, warnings: 0, aiMissing: false, ...data },
  };
  return renderWithProviders(<FlowNodeCard {...props} />, { messages });
}

describe('FlowNodeCard', () => {
  it("shows the type, id, the author's text and one output", () => {
    renderCard(makeNode('text', { text: 'Welcome aboard' }));
    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getByText('text-1')).toBeInTheDocument();
    expect(screen.getByText('Welcome aboard')).toBeInTheDocument();
    expect(screen.getByLabelText('Input of text-1')).toBeInTheDocument();
    expect(screen.getAllByTestId('handle-source')).toHaveLength(1);
    expect(screen.queryByText('Start')).toBeNull();
  });

  it('flags the start node and counts its errors and warnings', () => {
    renderCard(makeNode('notice'), { isStart: true, errors: 2, warnings: 1 }, true);
    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.getByLabelText('2 errors')).toHaveTextContent('2');
    expect(screen.getByLabelText('1 warnings')).toHaveTextContent('1');
  });

  it('shows no issue badges when there are none', () => {
    renderCard(makeNode('notice'));
    expect(screen.queryByLabelText(/errors$/)).toBeNull();
    expect(screen.queryByLabelText(/warnings$/)).toBeNull();
  });

  it('translates a phrase summary with its values', () => {
    renderCard(makeNode('delay', { ms: 2500 }), {}, false, {
      'Waits {seconds} s': 'Wartet {seconds} s',
    });
    expect(screen.getByText('Wartet 2.5 s')).toBeInTheDocument();
  });

  it('warns on an AI node while OpenAI is not configured', () => {
    renderCard(makeNode('ai'), { aiMissing: true });
    expect(
      screen.getByText('OpenAI not configured — set it in Tech > Environment Variables'),
    ).toBeInTheDocument();
  });

  it('draws no outputs and no summary for an end without a closing message', () => {
    renderCard(makeNode('end', { text: '', showMenu: false }));
    expect(screen.queryByTestId('handle-source')).toBeNull();
    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.getByTestId('handle-target')).toBeInTheDocument();
  });
});
