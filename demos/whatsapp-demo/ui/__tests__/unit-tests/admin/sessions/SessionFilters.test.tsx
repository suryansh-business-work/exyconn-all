import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ANY, SessionFilters } from '../../../../src/admin/sessions/SessionFilters';
import { renderWithProviders } from '../../test-utils';

const INDUSTRIES = [
  { key: 'clinic', industry: 'Healthcare' },
  { key: 'salon', industry: 'Beauty' },
];

const ANY_FILTERS = { industry: ANY, status: ANY };

function mount(values = ANY_FILTERS) {
  const onChange = vi.fn();
  const user = userEvent.setup();
  renderWithProviders(
    <SessionFilters values={values} industries={INDUSTRIES} onChange={onChange} />,
  );
  return { onChange, user };
}

async function options(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
  await user.click(screen.getByRole('combobox', { name }));
  const listbox = await screen.findByRole('listbox');
  return within(listbox).getAllByRole('option');
}

describe('SessionFilters', () => {
  it('starts on any industry and any status', async () => {
    const { user } = mount();
    expect(ANY).toBe('');
    const industries = await options(user, /^Industry/);
    expect(industries[0]).toHaveTextContent('All industries');
    expect(industries[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('offers every industry and narrows to the one picked', async () => {
    const { onChange, user } = mount();
    const choices = await options(user, /^Industry/);
    expect(choices.map((option) => option.textContent)).toEqual([
      'All industries',
      'Healthcare',
      'Beauty',
    ]);
    await user.click(choices[2]);
    expect(onChange).toHaveBeenCalledWith({ industry: 'salon', status: ANY });
  });

  it('offers the session states and keeps the industry when one is picked', async () => {
    const { onChange, user } = mount({ industry: 'clinic', status: ANY });
    const choices = await options(user, /^Status/);
    expect(choices.map((option) => option.textContent)).toEqual(['Any status', 'Active', 'Ended']);
    await user.click(choices[1]);
    expect(onChange).toHaveBeenCalledWith({ industry: 'clinic', status: 'active' });
  });

  it('shows the filters already chosen', () => {
    mount({ industry: 'clinic', status: 'ended' });
    expect(screen.getByRole('combobox', { name: /^Industry/ })).toHaveTextContent('Healthcare');
    expect(screen.getByRole('combobox', { name: /^Status/ })).toHaveTextContent('Ended');
  });
});
