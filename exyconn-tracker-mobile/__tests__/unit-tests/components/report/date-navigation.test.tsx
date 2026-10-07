import { act, fireEvent, screen } from '@testing-library/react';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { formatDayLabel } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { JumpToDate } from '../../../../src/components/report/JumpToDate';
import { MonthSwitcher } from '../../../../src/components/report/MonthSwitcher';
import { renderWithProviders } from '../../test-utils';
import { AccessibilityInfo, Platform } from '../../mocks/react-native/apis';

const SELECTED = new Date(2026, 1, 3);
const TODAY = new Date(2026, 1, 17);
const OPENER = `Jump to date: ${formatDayLabel(SELECTED)}`;

describe('JumpToDate (iPhone)', () => {
  it('shows the selected day and opens the inline calendar under it', () => {
    renderWithProviders(<JumpToDate selected={SELECTED} maxDate={TODAY} onSelect={vi.fn()} />);

    const opener = screen.getByRole('button', { name: OPENER });
    expect(screen.getByText(formatDayLabel(SELECTED))).toBeInTheDocument();
    expect(opener).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('date-time-picker')).not.toBeInTheDocument();

    fireEvent.click(opener);
    expect(opener).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('date-time-picker')).toBeInTheDocument();

    fireEvent.click(opener);
    expect(screen.queryByTestId('date-time-picker')).not.toBeInTheDocument();
  });

  it('jumps to the picked day and closes the calendar', () => {
    const onSelect = vi.fn();
    renderWithProviders(<JumpToDate selected={SELECTED} maxDate={TODAY} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: OPENER }));

    const picked = new Date(2025, 10, 20);
    fireEvent.change(screen.getByTestId('date-time-picker'), {
      target: { value: picked.toISOString() },
    });

    expect(onSelect).toHaveBeenCalledWith(picked);
    expect(screen.queryByTestId('date-time-picker')).not.toBeInTheDocument();
  });

  it('keeps the calendar open and the day unchanged when the pick is dismissed', () => {
    const onSelect = vi.fn();
    renderWithProviders(<JumpToDate selected={SELECTED} maxDate={TODAY} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: OPENER }));

    fireEvent.change(screen.getByTestId('date-time-picker'), { target: { value: '' } });

    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByTestId('date-time-picker')).toBeInTheDocument();
  });

  it('ignores a value that is not a date', () => {
    const onSelect = vi.fn();
    renderWithProviders(<JumpToDate selected={SELECTED} maxDate={TODAY} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: OPENER }));

    fireEvent.change(screen.getByTestId('date-time-picker'), { target: { value: 'not a date' } });

    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe('JumpToDate (Android)', () => {
  it('opens the system date dialog, capped at today, instead of an inline calendar', () => {
    Platform.OS = 'android';
    const onSelect = vi.fn();
    renderWithProviders(<JumpToDate selected={SELECTED} maxDate={TODAY} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: OPENER }));

    expect(screen.queryByTestId('date-time-picker')).not.toBeInTheDocument();
    expect(DateTimePickerAndroid.open).toHaveBeenCalledWith(
      expect.objectContaining({ value: SELECTED, mode: 'date', maximumDate: TODAY }),
    );

    const [[options]] = vi.mocked(DateTimePickerAndroid.open).mock.calls;
    const picked = new Date(2026, 0, 9);
    act(() => {
      options.onChange?.(
        { type: 'set', nativeEvent: { timestamp: picked.getTime(), utcOffset: 0 } },
        picked,
      );
    });
    expect(onSelect).toHaveBeenCalledWith(picked);
  });

  it('keeps the day when the dialog reports no date, or is cancelled', () => {
    Platform.OS = 'android';
    const onSelect = vi.fn();
    renderWithProviders(<JumpToDate selected={SELECTED} maxDate={TODAY} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: OPENER }));

    const [[options]] = vi.mocked(DateTimePickerAndroid.open).mock.calls;
    act(() => {
      options.onChange?.({ type: 'set', nativeEvent: { timestamp: 0, utcOffset: 0 } });
      options.onChange?.({ type: 'dismissed', nativeEvent: { timestamp: 0, utcOffset: 0 } });
    });

    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe('MonthSwitcher', () => {
  const FEBRUARY = new Date(2026, 1, 1);

  it('steps a month back and forward from the one on show', () => {
    const onChange = vi.fn();
    renderWithProviders(<MonthSwitcher month={FEBRUARY} canGoForward onChange={onChange} />);

    expect(screen.getByText('February 2026')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 0, 1));
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 2, 1));
  });

  it('cannot step into a month that has not started', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <MonthSwitcher month={FEBRUARY} canGoForward={false} onChange={onChange} />,
    );

    const next = screen.getByRole('button', { name: 'Next month' });
    expect(next).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Previous month' })).not.toHaveAttribute(
      'aria-disabled',
    );
    fireEvent.click(next);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('tells VoiceOver the new month when it changes, not the one it opened on', () => {
    const { rerender } = renderWithProviders(
      <MonthSwitcher month={FEBRUARY} canGoForward onChange={vi.fn()} />,
    );
    expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();

    rerender(
      <MonthSwitcher month={new Date(2026, 2, 1)} canGoForward={false} onChange={vi.fn()} />,
    );

    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('March 2026');
  });
});
