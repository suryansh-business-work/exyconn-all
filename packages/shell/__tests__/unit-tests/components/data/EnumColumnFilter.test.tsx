import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CustomFilterProps } from 'ag-grid-react';
import { EnumColumnFilter, enumLabel, toggledModel } from '@/components/data/EnumColumnFilter';
import type { EnumFilterModel } from '@/components/data/serverGridQuery';
import { renderWithProviders } from '../../test-utils';

/** The callbacks the filter last handed ag-grid. */
const registered = vi.hoisted(() => ({
  callbacks: null as null | {
    doesFilterPass: () => boolean;
    getModelAsString: (model: EnumFilterModel | null) => string;
  },
}));

vi.mock('ag-grid-react', () => ({
  useGridFilter: (callbacks: typeof registered.callbacks) => {
    registered.callbacks = callbacks;
  },
}));

type Props = CustomFilterProps<unknown, unknown, EnumFilterModel>;

function renderFilter(model: EnumFilterModel | null, options: readonly string[]) {
  const onModelChange = vi.fn();
  const props = { model, onModelChange, options } as unknown as Props & {
    options: readonly string[];
  };
  renderWithProviders(<EnumColumnFilter {...props} />, { messages: { Yes: 'Sí' } });
  return onModelChange;
}

describe('enumLabel', () => {
  it('reads a flag as Yes/No and an enum value as title-cased words', () => {
    expect(enumLabel('true')).toBe('Yes');
    expect(enumLabel('false')).toBe('No');
    expect(enumLabel('IN_PROGRESS')).toBe('In Progress');
  });
});

describe('toggledModel', () => {
  const options = ['OPEN', 'WON', 'LOST'];

  it('ticks a value, keeping the options’ order', () => {
    expect(toggledModel(options, { filterType: 'enum', values: ['LOST'] }, 'OPEN')).toEqual({
      filterType: 'enum',
      values: ['OPEN', 'LOST'],
    });
    expect(toggledModel(options, null, 'WON')).toEqual({ filterType: 'enum', values: ['WON'] });
  });

  it('unticks a value, and clears the filter once none is left', () => {
    const model: EnumFilterModel = { filterType: 'enum', values: ['OPEN', 'WON'] };
    expect(toggledModel(options, model, 'WON')).toEqual({ filterType: 'enum', values: ['OPEN'] });
    expect(toggledModel(options, { filterType: 'enum', values: ['OPEN'] }, 'OPEN')).toBeNull();
  });
});

describe('EnumColumnFilter', () => {
  it('shows a checkbox per value, ticked as the model says', () => {
    renderFilter({ filterType: 'enum', values: ['true'] }, ['true', 'false']);

    expect(screen.getByRole('group', { name: 'Show rows with' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Sí' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'No' })).not.toBeChecked();
  });

  it('sends the next model when a value is ticked or unticked', async () => {
    const onModelChange = renderFilter({ filterType: 'enum', values: ['OPEN'] }, ['OPEN', 'WON']);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Won' }));
    expect(onModelChange).toHaveBeenLastCalledWith({ filterType: 'enum', values: ['OPEN', 'WON'] });

    await userEvent.click(screen.getByRole('checkbox', { name: 'Open' }));
    expect(onModelChange).toHaveBeenLastCalledWith(null);
  });

  it('lets every loaded row through and describes the model in words', () => {
    renderFilter(null, ['OPEN']);
    const callbacks = registered.callbacks;

    expect(screen.getByRole('checkbox', { name: 'Open' })).not.toBeChecked();
    expect(callbacks?.doesFilterPass()).toBe(true);
    expect(
      callbacks?.getModelAsString({ filterType: 'enum', values: ['true', 'IN_PROGRESS'] }),
    ).toBe('Sí, In Progress');
    expect(callbacks?.getModelAsString(null)).toBe('');
  });
});
