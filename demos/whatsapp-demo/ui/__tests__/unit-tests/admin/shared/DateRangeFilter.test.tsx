import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import { DateRangeFilter } from '../../../../src/admin/shared/DateRangeFilter';
import { renderWithProviders } from '../../test-utils';

interface PickerProps {
  label: string;
  value: Date;
  minDate?: Date;
  maxDate?: Date;
  onChange: (date: Date | null) => void;
}

const day = (date: Date | undefined) => (date ? format(date, 'yyyy-MM-dd') : 'none');

/** Stands in for the MUI X picker: shows its bounds and reports a chosen, half-typed or cleared date. */
function PickerStub({ label, value, minDate, maxDate, onChange }: Readonly<PickerProps>) {
  return (
    <fieldset aria-label={label}>
      <p>{`value ${day(value)} min ${day(minDate)} max ${day(maxDate)}`}</p>
      <button type="button" onClick={() => onChange(new Date(2026, 8, 20))}>
        pick
      </button>
      <button type="button" onClick={() => onChange(new Date(Number.NaN))}>
        half-typed
      </button>
      <button type="button" onClick={() => onChange(null)}>
        clear
      </button>
    </fieldset>
  );
}

vi.mock('@exyconn/shell/components/ui', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  DatePicker: (props: Readonly<PickerProps>) => <PickerStub {...props} />,
}));

const RANGE = { from: new Date(2026, 8, 8), to: new Date(2026, 9, 7) };

function mount(preset: number | null = 30) {
  const onChange = vi.fn();
  const user = userEvent.setup();
  renderWithProviders(<DateRangeFilter range={RANGE} preset={preset} onChange={onChange} />);
  return { onChange, user };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 7, 9, 0));
});
afterEach(() => {
  vi.useRealTimers();
});

describe('DateRangeFilter', () => {
  it('offers the presets, with the matching one pressed', () => {
    mount(30);
    const group = screen.getByRole('group', { name: 'Quick date range' });
    const buttons = within(group).getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual([
      'Last 7 days',
      'Last 30 days',
      'Last 90 days',
    ]);
    expect(within(group).getByRole('button', { name: 'Last 30 days' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('picks a preset range ending today', async () => {
    const { onChange, user } = mount(30);
    await user.click(screen.getByRole('button', { name: 'Last 90 days' }));
    expect(onChange).toHaveBeenCalledWith({
      from: new Date(2026, 6, 10),
      to: new Date(2026, 9, 7),
    });
  });

  it('ignores pressing the preset that is already on', async () => {
    const { onChange, user } = mount(7);
    await user.click(screen.getByRole('button', { name: 'Last 7 days' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('bounds the pickers by each other and by today', () => {
    mount(null);
    expect(screen.getByRole('group', { name: 'From' })).toHaveTextContent(
      'value 2026-09-08 min none max 2026-10-07',
    );
    expect(screen.getByRole('group', { name: 'To' })).toHaveTextContent(
      'value 2026-10-07 min 2026-09-08 max 2026-10-07',
    );
  });

  it('changes either end once a real date is chosen', async () => {
    const { onChange, user } = mount(null);
    await user.click(within(screen.getByRole('group', { name: 'From' })).getByText('pick'));
    expect(onChange).toHaveBeenLastCalledWith({ ...RANGE, from: new Date(2026, 8, 20) });
    await user.click(within(screen.getByRole('group', { name: 'To' })).getByText('pick'));
    expect(onChange).toHaveBeenLastCalledWith({ ...RANGE, to: new Date(2026, 8, 20) });
  });

  it.each(['half-typed', 'clear'])('waits on a %s date', async (action) => {
    const { onChange, user } = mount(null);
    for (const name of ['From', 'To']) {
      await user.click(within(screen.getByRole('group', { name })).getByText(action));
    }
    expect(onChange).not.toHaveBeenCalled();
  });
});
