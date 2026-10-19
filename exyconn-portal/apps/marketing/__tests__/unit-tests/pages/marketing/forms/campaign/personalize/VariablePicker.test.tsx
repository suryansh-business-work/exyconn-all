import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VariablePicker } from '../../../../../../../src/pages/marketing/forms/campaign/personalize/VariablePicker';
import { renderWithProviders } from '../../../../../test-utils';
import { VARIABLES } from '../studio.fixtures';

function renderPicker(props: Partial<Parameters<typeof VariablePicker>[0]> = {}) {
  const onInsert = vi.fn();
  renderWithProviders(<VariablePicker variables={VARIABLES} onInsert={onInsert} {...props} />);
  return onInsert;
}

const open = () => userEvent.click(screen.getByRole('combobox', { name: 'Insert variable' }));

describe('VariablePicker', () => {
  it('groups the variables and shows each one’s key and example', async () => {
    renderPicker();
    await open();
    const listbox = screen.getByRole('listbox');
    for (const group of ['Contact', 'Company', 'Links', 'CUSTOM']) {
      expect(within(listbox).getByText(group)).toBeInTheDocument();
    }
    expect(within(listbox).getByText('{{contact.firstName}}')).toBeInTheDocument();
    expect(within(listbox).getByText(/e\.g\. Asha/)).toBeInTheDocument();
  });

  it('inserts a name variable with a fallback', async () => {
    const onInsert = renderPicker();
    await open();
    await userEvent.click(screen.getByRole('option', { name: /First name/ }));
    expect(onInsert).toHaveBeenCalledWith('{{contact.firstName|there}}');
  });

  it('inserts other variables as they are, including company names', async () => {
    const onInsert = renderPicker();
    await open();
    await userEvent.click(screen.getByRole('option', { name: /Company name/ }));
    expect(onInsert).toHaveBeenCalledWith('{{company.name}}');
  });

  it('finds a variable by its key, label or description, ignoring case', async () => {
    renderPicker();
    const input = screen.getByRole('combobox', { name: 'Insert variable' });
    await userEvent.type(input, 'UNSUBSCRIBE');
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      expect.stringContaining('Unsubscribe link'),
    ]);
    await userEvent.clear(input);
    await userEvent.type(input, 'address the email');
    expect(screen.getByRole('option', { name: /Email/ })).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(1);
    await userEvent.clear(input);
    await userEvent.type(input, 'contact.f');
    expect(screen.getAllByRole('option')).toHaveLength(1);
  });

  it('takes its own label and can be disabled', () => {
    renderPicker({ label: 'Add to subject', disabled: true });
    expect(screen.getByRole('combobox', { name: 'Add to subject' })).toBeDisabled();
  });
});
