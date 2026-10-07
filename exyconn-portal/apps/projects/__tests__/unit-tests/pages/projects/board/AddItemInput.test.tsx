import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddItemInput } from '../../../../../src/pages/projects/board';
import { renderWithProviders } from '../../../test-utils';

const renderInput = () => {
  const onAdd = vi.fn();
  renderWithProviders(
    <AddItemInput label="Add ticket" placeholder="Ticket summary" onAdd={onAdd} />,
  );
  return { onAdd };
};

const open = () => userEvent.click(screen.getByRole('button', { name: 'Add ticket' }));
const field = () => screen.getByRole('textbox', { name: 'Ticket summary' });

describe('AddItemInput', () => {
  it('starts as a button and expands into a focused field', async () => {
    renderInput();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    await open();

    expect(field()).toHaveFocus();
    expect(field()).toHaveAttribute('placeholder', 'Ticket summary');
  });

  it('adds the trimmed text on Enter and folds back into the button', async () => {
    const { onAdd } = renderInput();
    await open();

    await userEvent.type(field(), '  Fix login  {Enter}');

    expect(onAdd).toHaveBeenCalledWith('Fix login');
    expect(screen.getByRole('button', { name: 'Add ticket' })).toBeInTheDocument();
    await open();
    expect(field()).toHaveValue('');
  });

  it('adds from the Add button too', async () => {
    const { onAdd } = renderInput();
    await open();

    await userEvent.type(field(), 'Write docs');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(onAdd).toHaveBeenCalledWith('Write docs');
  });

  it('adds nothing for blank text and stays open', async () => {
    const { onAdd } = renderInput();
    await open();

    await userEvent.type(field(), '   {Enter}');

    expect(onAdd).not.toHaveBeenCalled();
    expect(field()).toBeInTheDocument();
  });

  it('closes without adding on Escape or Cancel', async () => {
    const { onAdd } = renderInput();
    await open();
    await userEvent.type(field(), 'Draft{Escape}');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    await open();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });
});
