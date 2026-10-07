import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColumnMoveButtons } from '../../../../../src/pages/projects/board/ColumnMoveButtons';
import { renderWithProviders } from '../../../test-utils';

const left = () => screen.getByRole('button', { name: 'Move column left' });
const right = () => screen.getByRole('button', { name: 'Move column right' });

describe('ColumnMoveButtons', () => {
  it('moves a middle column one place either way', async () => {
    const onMove = vi.fn();
    renderWithProviders(<ColumnMoveButtons index={1} columnCount={3} onMove={onMove} />);

    await userEvent.click(left());
    await userEvent.click(right());

    expect(onMove.mock.calls).toEqual([[0], [2]]);
  });

  it('cannot move the first column further left', () => {
    renderWithProviders(<ColumnMoveButtons index={0} columnCount={3} onMove={vi.fn()} />);

    expect(left()).toBeDisabled();
    expect(right()).toBeEnabled();
  });

  it('cannot move the last column further right', () => {
    renderWithProviders(<ColumnMoveButtons index={2} columnCount={3} onMove={vi.fn()} />);

    expect(left()).toBeEnabled();
    expect(right()).toBeDisabled();
  });
});
