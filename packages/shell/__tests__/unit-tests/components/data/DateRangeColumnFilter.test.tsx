import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CustomFilterProps } from 'ag-grid-react';
import { DateRangeColumnFilter, withEnd } from '@/components/data/DateRangeColumnFilter';
import type { DateRangeFilterModel } from '@/components/data/serverGridQuery';
import { renderWithProviders } from '../../test-utils';

/** The callbacks the filter last handed ag-grid. */
const registered = vi.hoisted(() => ({
  callbacks: null as null | {
    doesFilterPass: () => boolean;
    getModelAsString: (model: DateRangeFilterModel | null) => string;
  },
}));

vi.mock('ag-grid-react', () => ({
  useGridFilter: (callbacks: typeof registered.callbacks) => {
    registered.callbacks = callbacks;
  },
}));

type Props = CustomFilterProps<unknown, unknown, DateRangeFilterModel>;

function renderFilter(model: DateRangeFilterModel | null) {
  const onModelChange = vi.fn();
  const props = { model, onModelChange } as unknown as Props;
  renderWithProviders(<DateRangeColumnFilter {...props} />);
  return onModelChange;
}

/** The picker inputs, From then To. */
function inputs(): HTMLInputElement[] {
  return Array.from(document.querySelectorAll<HTMLInputElement>('input'));
}

describe('withEnd', () => {
  it('sets one end as a calendar day and keeps the other', () => {
    expect(withEnd(null, 'from', new Date(2026, 2, 1))).toEqual({
      filterType: 'dateRange',
      from: '2026-03-01',
      to: null,
    });
    expect(
      withEnd(
        { filterType: 'dateRange', from: '2026-03-01', to: null },
        'to',
        new Date(2026, 2, 9),
      ),
    ).toEqual({ filterType: 'dateRange', from: '2026-03-01', to: '2026-03-09' });
  });

  it('treats a half-typed date as no day, and clears the filter once neither end is set', () => {
    const model: DateRangeFilterModel = { filterType: 'dateRange', from: '2026-03-01', to: null };
    expect(withEnd(model, 'from', new Date(Number.NaN))).toBeNull();
    expect(withEnd(model, 'from', null)).toBeNull();
    expect(withEnd({ ...model, to: '2026-03-09' }, 'from', null)).toEqual({
      filterType: 'dateRange',
      from: null,
      to: '2026-03-09',
    });
  });
});

describe('DateRangeColumnFilter', () => {
  it('shows the stored days and sends a typed day as the next model', () => {
    const onModelChange = renderFilter({ filterType: 'dateRange', from: '2026-03-01', to: null });
    const [from, to] = inputs();

    expect(from).toHaveValue('03/01/2026');
    expect(to).toHaveValue('');
    fireEvent.change(to, { target: { value: '03/09/2026' } });
    expect(onModelChange).toHaveBeenLastCalledWith({
      filterType: 'dateRange',
      from: '2026-03-01',
      to: '2026-03-09',
    });
  });

  it('sends a typed From day on an empty filter, whose Clear is disabled', () => {
    const onModelChange = renderFilter(null);

    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
    fireEvent.change(inputs()[0], { target: { value: '04/15/2026' } });
    expect(onModelChange).toHaveBeenLastCalledWith({
      filterType: 'dateRange',
      from: '2026-04-15',
      to: null,
    });
  });

  it('clears both ends with Clear', async () => {
    const onModelChange = renderFilter({
      filterType: 'dateRange',
      from: '2026-03-01',
      to: '2026-03-09',
    });

    expect(inputs()[1]).toHaveValue('03/09/2026');
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onModelChange).toHaveBeenLastCalledWith(null);
  });

  it('lets every loaded row through and describes the range in the configured format', () => {
    renderFilter(null);
    const callbacks = registered.callbacks;

    expect(callbacks?.doesFilterPass()).toBe(true);
    expect(
      callbacks?.getModelAsString({ filterType: 'dateRange', from: '2026-03-01', to: null }),
    ).toBe('01 Mar 2026 to …');
    expect(callbacks?.getModelAsString(null)).toBe('… to …');
  });
});
