import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { DayRangeFilter } from '../../../../../src/pages/chat/sessions/DayRangeFilter';
import type { DayRange } from '../../../../../src/pages/chat/sessions/chat-sessions.filters';
import { renderWithProviders } from '../../../test-utils';
import { PICKED_DAY, pickerProps } from './date-picker-stub';

vi.mock('@exyconn/shell/components/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/shell/components/ui')>();
  const { DatePickerStub } = await import('./date-picker-stub');
  return { ...actual, DatePicker: DatePickerStub };
});

const JUNE_1 = new Date(2026, 5, 1);
const JUNE_9 = new Date(2026, 5, 9);

function renderRange(value: DayRange, messages: Record<string, string> = {}) {
  const onChange = vi.fn();
  renderWithProviders(
    <DayRangeFilter
      fromLabel="Started from"
      toLabel="Started to"
      value={value}
      onChange={onChange}
    />,
    { messages },
  );
  return onChange;
}

function picker(label: string) {
  const props = pickerProps.get(label);
  if (!props) {
    throw new Error(`No picker labelled ${label}`);
  }
  return props;
}

beforeEach(() => {
  pickerProps.clear();
});

describe('DayRangeFilter', () => {
  it('labels both pickers in the viewer’s language', () => {
    renderRange(
      { from: null, to: null },
      { 'Started from': 'Commencé le', 'Started to': 'Jusqu’au' },
    );
    expect(screen.getByRole('button', { name: 'Commencé le' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Jusqu’au' })).toBeInTheDocument();
  });

  it('keeps each end from crossing the other', () => {
    renderRange({ from: JUNE_1, to: JUNE_9 });
    expect(picker('Started from').maxDate).toBe(JUNE_9);
    expect(picker('Started to').minDate).toBe(JUNE_1);
  });

  it('leaves both ends unbounded while the range is open', () => {
    renderRange({ from: null, to: null });
    expect(picker('Started from').maxDate).toBeUndefined();
    expect(picker('Started to').minDate).toBeUndefined();
  });

  it('reports a picked start day, keeping the end', () => {
    const onChange = renderRange({ from: null, to: JUNE_9 });
    fireEvent.click(screen.getByRole('button', { name: 'Started from' }));
    expect(onChange).toHaveBeenCalledWith({ from: PICKED_DAY, to: JUNE_9 });
  });

  it('reports a cleared end day, keeping the start', () => {
    const onChange = renderRange({ from: JUNE_1, to: JUNE_9 });
    fireEvent.click(screen.getByRole('button', { name: 'Clear Started to' }));
    expect(onChange).toHaveBeenCalledWith({ from: JUNE_1, to: null });
  });

  it('flags an end day before the start day', () => {
    renderRange({ from: JUNE_9, to: JUNE_1 });
    expect(screen.getByRole('alert')).toHaveTextContent('Must be on or after the start');
    expect(picker('Started to').slotProps?.textField?.error).toBe(true);
  });

  it('flags nothing for a range in order', () => {
    renderRange({ from: JUNE_1, to: JUNE_9 });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(picker('Started to').slotProps?.textField?.error).toBe(false);
  });
});
