import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkflowNodeKind } from '@exyconn/shell/graphql/generated';
import { WorkflowPalette } from '../../../../../src/pages/workflows/editor/WorkflowPalette';
import { renderWithProviders } from '../../../test-utils';

describe('WorkflowPalette', () => {
  it('offers one button per kind, in order, and adds the kind clicked', async () => {
    const onAdd = vi.fn();
    renderWithProviders(<WorkflowPalette hasStart={false} onAdd={onAdd} />);

    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Start',
      'Step',
      'Decision',
      'End',
    ]);

    await userEvent.click(screen.getByRole('button', { name: 'Start' }));
    await userEvent.click(screen.getByRole('button', { name: 'Decision' }));

    expect(onAdd.mock.calls).toEqual([[WorkflowNodeKind.Start], [WorkflowNodeKind.Decision]]);
  });

  it('turns Start off once the drawing has one, and only Start', () => {
    renderWithProviders(<WorkflowPalette hasStart onAdd={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Step' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'End' })).toBeEnabled();
  });

  it('explains each kind on hover', async () => {
    renderWithProviders(<WorkflowPalette hasStart={false} onAdd={vi.fn()} />);

    await userEvent.hover(screen.getByRole('button', { name: 'Decision' }));

    expect(
      await screen.findByText('A fork. Label each way out with its answer.'),
    ).toBeInTheDocument();
  });
});
