import { createRef } from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import { AccessibilityInfo, type HostInstance } from 'react-native';
import { describe, expect, it, vi } from 'vitest';
import { filterOptions, OptionSheet, type Option } from '../../../../src/components/ui/OptionSheet';
import { renderWithProviders } from '../../test-utils';

const ZONES: Option[] = [
  { value: 'Asia/Kolkata', label: 'Kolkata', caption: 'GMT+5:30' },
  { value: 'Europe/London', label: 'London', caption: 'GMT+1' },
  { value: 'UTC', label: 'UTC' },
];

describe('filterOptions', () => {
  it('keeps everything for an empty or blank query', () => {
    expect(filterOptions(ZONES, '')).toEqual(ZONES);
    expect(filterOptions(ZONES, '   ')).toEqual(ZONES);
  });

  it('matches the label or the caption, ignoring case', () => {
    expect(filterOptions(ZONES, 'LON').map((option) => option.value)).toEqual(['Europe/London']);
    expect(filterOptions(ZONES, '5:30').map((option) => option.value)).toEqual(['Asia/Kolkata']);
    expect(filterOptions(ZONES, 'zzz')).toEqual([]);
  });

  it('returns a copy, never the list it was given', () => {
    expect(filterOptions(ZONES, '')).not.toBe(ZONES);
  });
});

function renderSheet(open = true, searchable = false) {
  const onSelect = vi.fn();
  const onClose = vi.fn();
  renderWithProviders(
    <OptionSheet
      open={open}
      title="Timezone"
      options={ZONES}
      selected="UTC"
      onSelect={onSelect}
      onClose={onClose}
      returnFocusTo={createRef<HostInstance>()}
      searchable={searchable}
    />,
  );
  return { onSelect, onClose };
}

describe('OptionSheet', () => {
  it('shows nothing while closed', () => {
    renderSheet(false);
    expect(screen.queryByText('Timezone')).not.toBeInTheDocument();
  });

  it('lists every choice, with the current one checked', () => {
    renderSheet();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: 'UTC' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'London' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('GMT+1')).toBeInTheDocument();
    expect(screen.getByTestId('icon-check')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Search')).not.toBeInTheDocument();
  });

  it('picks a choice and closes', () => {
    const { onSelect, onClose } = renderSheet();
    fireEvent.click(screen.getByRole('radio', { name: 'London' }));
    expect(onSelect).toHaveBeenCalledWith('Europe/London');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes from its Close button', () => {
    const { onSelect, onClose } = renderSheet();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('filters a long list, says when nothing matches, and starts afresh after a pick', () => {
    const { onSelect } = renderSheet(true, true);
    const search = screen.getByPlaceholderText('Search');
    fireEvent.change(search, { target: { value: 'zzz' } });
    expect(screen.getByText('Nothing matches.')).toBeInTheDocument();
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    fireEvent.change(search, { target: { value: 'lon' } });
    expect(screen.getAllByRole('radio')).toHaveLength(1);
    fireEvent.click(screen.getByRole('radio', { name: 'London' }));
    expect(onSelect).toHaveBeenCalledWith('Europe/London');
    expect(screen.getByPlaceholderText('Search')).toHaveValue('');
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('opens without sliding when the phone asks for reduced motion', async () => {
    vi.mocked(AccessibilityInfo.isReduceMotionEnabled).mockResolvedValue(true);
    renderSheet();
    // Let the setting's answer land, so the pop-up re-renders with it.
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByText('Timezone')).toBeInTheDocument();
  });
});
