import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrackerEmployeePicker } from '../../../../src/pages/tracker/TrackerEmployeePicker';
import { renderWithProviders } from '../../test-utils';

const options = [
  { id: 'u1', label: 'Asha Rao (u1@example.test)' },
  { id: 'u2', label: 'Dev Mehta (u2@example.test)' },
];

describe('TrackerEmployeePicker', () => {
  it('shows the employee whose tracker is on screen', () => {
    renderWithProviders(<TrackerEmployeePicker options={options} value="u2" onChange={vi.fn()} />);
    expect(screen.getByRole('combobox', { name: 'Employee' })).toHaveValue(
      'Dev Mehta (u2@example.test)',
    );
  });

  it('stays empty for an id that is not among the options', () => {
    renderWithProviders(
      <TrackerEmployeePicker options={options} value="gone" onChange={vi.fn()} />,
    );
    expect(screen.getByRole('combobox', { name: 'Employee' })).toHaveValue('');
  });

  it('hands back the id of the employee picked from the search', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <TrackerEmployeePicker options={options} value={null} onChange={onChange} />,
    );
    await userEvent.type(screen.getByRole('combobox', { name: 'Employee' }), 'Dev');
    await userEvent.click(
      await screen.findByRole('option', { name: 'Dev Mehta (u2@example.test)' }),
    );
    expect(onChange).toHaveBeenCalledWith('u2');
  });

  it('hands back null when the search is emptied', async () => {
    const onChange = vi.fn();
    renderWithProviders(<TrackerEmployeePicker options={options} value="u1" onChange={onChange} />);
    await userEvent.clear(screen.getByRole('combobox', { name: 'Employee' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
