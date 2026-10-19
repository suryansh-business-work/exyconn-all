import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColumnsButton } from '../../../../src/records/columns/ColumnsButton';
import type { ColumnChoice } from '../../../../src/records/columns/buildColumns';
import { renderWithProviders } from '../../test-utils';

const CHOICES: ColumnChoice[] = [
  { id: 'name', label: 'Name', custom: false, translate: true },
  { id: 'email', label: 'Email', custom: false, translate: true },
  { id: 'tier', label: 'Tier', custom: true, translate: false },
];

function renderButton(visible: string[], onApply = vi.fn(), defaults = ['name', 'client']) {
  renderWithProviders(
    <ColumnsButton choices={CHOICES} visible={visible} defaults={defaults} onApply={onApply} />,
    { messages: { Name: 'Nom', Email: 'Courriel', Tier: 'Niveau' } },
  );
  return onApply;
}

async function openDialog() {
  await userEvent.click(screen.getByRole('button', { name: 'Columns' }));
  return screen.findByRole('dialog', { name: 'Choose columns' });
}

/** The shown columns in order, read from the right-hand list. */
function shown(dialog: HTMLElement): string[] {
  const list = within(dialog).getByText('Shown, in order').closest('ul') as HTMLElement;
  return within(list)
    .getAllByRole('listitem')
    .flatMap((item) => item.querySelector('.MuiListItemText-primary')?.textContent ?? []);
}

describe('ColumnsDialog', () => {
  it('groups the choices, translating built-in names only, and ticks the shown ones', async () => {
    renderButton(['name', 'tier']);
    const dialog = await openDialog();
    expect(within(dialog).getByText('Built-in')).toBeInTheDocument();
    expect(within(dialog).getByText('Custom')).toBeInTheDocument();
    expect(within(dialog).getByRole('checkbox', { name: 'Nom' })).toBeChecked();
    expect(within(dialog).getByRole('checkbox', { name: 'Courriel' })).not.toBeChecked();
    expect(within(dialog).getByRole('checkbox', { name: 'Tier' })).toBeChecked();
    expect(shown(dialog)).toEqual(['Nom', 'Tier']);
  });

  it('adds, reorders and hides columns, then applies the order', async () => {
    const onApply = renderButton(['name', 'tier']);
    const dialog = await openDialog();
    await userEvent.click(within(dialog).getByText('Courriel'));
    expect(shown(dialog)).toEqual(['Nom', 'Tier', 'Courriel']);
    expect(within(dialog).getByRole('button', { name: 'Move Nom up' })).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: 'Move Courriel down' })).toBeDisabled();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Move Courriel up' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Move Nom down' }));
    expect(shown(dialog)).toEqual(['Courriel', 'Nom', 'Tier']);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Hide Tier' }));
    expect(shown(dialog)).toEqual(['Courriel', 'Nom']);

    await userEvent.click(within(dialog).getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledWith(['email', 'name']);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('keeps at least one column', async () => {
    renderButton(['name']);
    const dialog = await openDialog();
    expect(within(dialog).getByRole('button', { name: 'Hide Nom' })).toBeDisabled();
    await userEvent.click(within(dialog).getByText('Nom', { selector: '.MuiListItemButton-root *' }));
    expect(within(dialog).getByRole('checkbox', { name: 'Nom' })).toBeChecked();
    expect(shown(dialog)).toEqual(['Nom']);
  });

  it('unticks a column from the checklist', async () => {
    renderButton(['name', 'email']);
    const dialog = await openDialog();
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Courriel' }));
    expect(shown(dialog)).toEqual(['Nom']);
  });

  it('filters the choices by their shown name and hides an empty group', async () => {
    renderButton(['name']);
    const dialog = await openDialog();
    const search = within(dialog).getByLabelText('Search columns');
    await userEvent.type(search, '  COUR ');
    expect(within(dialog).queryByText('Custom')).not.toBeInTheDocument();
    expect(within(dialog).getByRole('checkbox', { name: 'Courriel' })).toBeInTheDocument();
    expect(within(dialog).queryByRole('checkbox', { name: 'Nom' })).not.toBeInTheDocument();
    await userEvent.clear(search);
    await userEvent.type(search, 'tie');
    expect(within(dialog).queryByText('Built-in')).not.toBeInTheDocument();
    expect(within(dialog).getByRole('checkbox', { name: 'Tier' })).toBeInTheDocument();
  });

  it('applies the page defaults as an empty list after Reset', async () => {
    const onApply = renderButton(['email', 'tier']);
    const dialog = await openDialog();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reset to defaults' }));
    expect(shown(dialog)).toEqual(['Nom']);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledWith([]);
  });

  it('applies only property keys when the draft differs from the defaults', async () => {
    const onApply = renderButton(['name', 'ghost', 'email']);
    const dialog = await openDialog();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledWith(['name', 'email']);
  });

  it('applies the defaults as empty when they are a different length', async () => {
    const onApply = renderButton(['name'], vi.fn(), ['name']);
    const dialog = await openDialog();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledWith([]);
  });

  it('closes on Cancel without applying', async () => {
    const onApply = renderButton(['name']);
    const dialog = await openDialog();
    await userEvent.click(within(dialog).getByText('Courriel'));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(onApply).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
