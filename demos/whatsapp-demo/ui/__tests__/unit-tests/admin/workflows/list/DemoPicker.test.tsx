import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DemoPicker } from '../../../../../src/admin/workflows/list/DemoPicker';
import { demoRow } from '../../admin.fixtures';
import { renderWithProviders } from '../../../test-utils';

const demos = [
  demoRow(),
  demoRow({ id: 'demo-2', key: 'salon', industry: 'Beauty', business: {} }),
];

function renderPicker(value = 'demo-1') {
  const props = { onChange: vi.fn(), onEditProfile: vi.fn(), onNewDemo: vi.fn() };
  renderWithProviders(<DemoPicker demos={demos} value={value} {...props} />);
  return props;
}

describe('DemoPicker', () => {
  it('names each demo by industry and business, falling back to its key', async () => {
    const user = userEvent.setup();
    const { onChange } = renderPicker();
    await user.click(screen.getByRole('combobox', { name: /Demo/ }));
    const options = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(options.map((o) => o.textContent)).toEqual([
      'Healthcare — City Clinic',
      'Beauty — salon',
    ]);
    await user.click(options[1]);
    expect(onChange).toHaveBeenCalledWith('demo-2');
  });

  it('opens the business profile and a new demo', async () => {
    const user = userEvent.setup();
    const { onEditProfile, onNewDemo } = renderPicker();
    await user.click(screen.getByRole('button', { name: 'Business profile' }));
    await user.click(screen.getByRole('button', { name: 'New demo' }));
    expect(onEditProfile).toHaveBeenCalledTimes(1);
    expect(onNewDemo).toHaveBeenCalledTimes(1);
  });

  it('cannot open a profile while no demo is chosen', () => {
    renderPicker('');
    expect(screen.getByRole('button', { name: 'Business profile' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'New demo' })).toBeEnabled();
  });
});
