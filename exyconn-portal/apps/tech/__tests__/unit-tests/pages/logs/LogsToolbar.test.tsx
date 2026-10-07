import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogsToolbar } from '../../../../src/pages/logs/LogsToolbar';
import { DEFAULT_LOG_FILTERS } from '../../../../src/pages/logs/logs.constants';
import { renderWithProviders } from '../../test-utils';

const onChange = vi.fn();
const onCopyOpenErrors = vi.fn();

const renderToolbar = (copying = false) =>
  renderWithProviders(
    <LogsToolbar
      filters={DEFAULT_LOG_FILTERS}
      onChange={onChange}
      onCopyOpenErrors={onCopyOpenErrors}
      copying={copying}
    />,
  );

async function pick(name: RegExp, option: string) {
  await userEvent.click(screen.getByRole('combobox', { name }));
  await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: option }));
}

describe('LogsToolbar', () => {
  beforeEach(() => {
    onChange.mockReset();
    onCopyOpenErrors.mockReset();
  });

  it('shows the current scope of each filter', () => {
    renderToolbar();

    expect(screen.getByRole('combobox', { name: /^Source/ })).toHaveTextContent('All');
    expect(screen.getByRole('combobox', { name: /^Level/ })).toHaveTextContent('All');
    expect(screen.getByRole('combobox', { name: /^Status/ })).toHaveTextContent('Open');
  });

  it('offers every value the API accepts, plus All', async () => {
    renderToolbar();
    await userEvent.click(screen.getByRole('combobox', { name: /^Source/ }));

    const options = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      'All',
      'Desktop',
      'Mobile',
      'Portal',
      'Server',
    ]);
  });

  it('changes one filter and keeps the others', async () => {
    renderToolbar();
    await pick(/^Source/, 'Mobile');

    expect(onChange).toHaveBeenCalledWith({ source: 'MOBILE', level: '', status: 'OPEN' });
  });

  it('can widen the status filter back to everything', async () => {
    renderToolbar();
    await pick(/^Status/, 'All');

    expect(onChange).toHaveBeenCalledWith({ source: '', level: '', status: '' });
  });

  it('hands every open error to Claude, but not while a copy is running', async () => {
    const { rerender } = renderToolbar();
    await userEvent.click(screen.getByRole('button', { name: 'Copy open errors for Claude' }));
    expect(onCopyOpenErrors).toHaveBeenCalledTimes(1);

    rerender(
      <LogsToolbar
        filters={DEFAULT_LOG_FILTERS}
        onChange={onChange}
        onCopyOpenErrors={onCopyOpenErrors}
        copying
      />,
    );
    expect(screen.getByRole('button', { name: 'Copy open errors for Claude' })).toBeDisabled();
  });
});
