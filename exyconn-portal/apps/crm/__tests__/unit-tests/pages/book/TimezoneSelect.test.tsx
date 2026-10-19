import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { timezoneOptions } from '@exyconn/i18n';
import { TimezoneSelect } from '../../../../src/pages/book/TimezoneSelect';
import { renderWithProviders } from '../../test-utils';

function renderSelect(value: string) {
  const onChange = vi.fn();
  renderWithProviders(<TimezoneSelect value={value} onChange={onChange} />);
  return { onChange, input: screen.getByRole('combobox', { name: 'Time zone' }) };
}

describe('TimezoneSelect', () => {
  it('shows the zone the times are in, with its offset', () => {
    const { input } = renderSelect('Asia/Kolkata');

    expect(input).toHaveValue('Asia/Kolkata (GMT+05:30)');
  });

  it('reports the zone the visitor picks', async () => {
    const { input, onChange } = renderSelect('Asia/Kolkata');

    await userEvent.clear(input);
    await userEvent.type(input, 'Asia/Tokyo');
    await userEvent.click(screen.getByRole('option', { name: /^Asia\/Tokyo/ }));

    expect(onChange).toHaveBeenCalledWith('Asia/Tokyo');
  });

  it('falls back to the first zone listed for a zone it does not know', () => {
    const { input } = renderSelect('Not/AZone');

    expect(input).toHaveValue(timezoneOptions('Not/AZone')[0].label);
  });
});
