import { screen } from '@testing-library/react';
import { NodeOutputs } from '../../../../../../src/admin/workflows/editor/canvas/NodeOutputs';
import { renderWithProviders } from '../../../../test-utils';

vi.mock('@xyflow/react', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  Handle: ({ id, type, position, ...rest }: Readonly<Record<string, unknown>>) => (
    <span
      data-testid="handle"
      data-id={String(id)}
      data-type={String(type)}
      data-position={String(position)}
      aria-label={String(rest['aria-label'])}
    />
  ),
}));

describe('NodeOutputs', () => {
  it('translates fixed output names and shows option titles as written', () => {
    renderWithProviders(
      <NodeOutputs
        color="#123456"
        handles={[
          { id: 'next', label: 'Next', interactive: false },
          { id: 'yes', label: 'Yes please', interactive: true },
        ]}
      />,
      { messages: { Next: 'Weiter', 'Yes please': 'Ja bitte' } },
    );
    expect(screen.getByText('Weiter')).toBeInTheDocument();
    expect(screen.getByText('Yes please')).toBeInTheDocument();
    expect(screen.queryByText('Ja bitte')).toBeNull();
  });

  it('gives each output its own right-hand source handle', () => {
    renderWithProviders(
      <NodeOutputs
        color="#123456"
        handles={[
          { id: 'else', label: 'Otherwise', interactive: false },
          { id: 'vip', label: 'vip', interactive: false },
        ]}
      />,
    );
    const handles = screen.getAllByTestId('handle');
    expect(handles.map((h) => h.dataset.id)).toEqual(['else', 'vip']);
    expect(
      handles.every((h) => h.dataset.type === 'source' && h.dataset.position === 'right'),
    ).toBe(true);
    expect(screen.getByLabelText('Output Otherwise')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});
