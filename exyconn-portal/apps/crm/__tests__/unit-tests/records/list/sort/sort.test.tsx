import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SortDir } from '@exyconn/shell/graphql/generated';
import { SortButton, sortSchema } from '../../../../../src/records/list/sort';
import { emptySortLevel, toSortFormValues } from '../../../../../src/records/list/sort/sort.types';
import { renderWithProviders } from '../../../test-utils';
import { property } from '../../records-fixtures';

const PROPERTIES = [
  property(),
  property({ key: 'email', label: 'Email' }),
  property({ key: 'tier', label: 'Tier', builtIn: false }),
  property({ key: 'city', label: 'City' }),
];

describe('sortSchema', () => {
  it('accepts up to three distinct levels', () => {
    const levels = ['name', 'email', 'city'].map((key) => ({ property: key, dir: SortDir.Asc }));
    expect(sortSchema.safeParse({ levels }).success).toBe(true);
  });

  it('needs a property on each level, no repeats and at most three', () => {
    const result = sortSchema.safeParse({
      levels: [
        { property: 'name', dir: SortDir.Asc },
        { property: ' ', dir: SortDir.Asc },
        { property: 'name', dir: SortDir.Desc },
        { property: 'city', dir: SortDir.Asc },
      ],
    });
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'Choose a property to sort by',
      'Sort by at most 3 properties',
      'This property is already sorted on',
    ]);
    const repeat = sortSchema.safeParse({
      levels: [
        { property: 'name', dir: SortDir.Asc },
        { property: '', dir: SortDir.Asc },
        { property: 'name', dir: SortDir.Desc },
      ],
    });
    expect(repeat.error?.issues.map((issue) => [issue.path.join('.'), issue.message])).toEqual([
      ['levels.1.property', 'Choose a property to sort by'],
      ['levels.2.property', 'This property is already sorted on'],
    ]);
  });

  it('allows two blank levels to report blank, not repeated', () => {
    const result = sortSchema.safeParse({ levels: [emptySortLevel(), emptySortLevel()] });
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'Choose a property to sort by',
      'Choose a property to sort by',
    ]);
  });

  it('reads sorts into form values without typenames', () => {
    expect(
      toSortFormValues([{ __typename: 'CrmSort', property: 'name', dir: SortDir.Desc } as never]),
    ).toEqual({
      levels: [{ property: 'name', dir: SortDir.Desc }],
    });
  });
});

function renderSort(sorts = [{ property: 'name', dir: SortDir.Asc }]) {
  const onApply = vi.fn();
  renderWithProviders(<SortButton properties={PROPERTIES} sorts={sorts} onApply={onApply} />);
  return onApply;
}

async function openSort(levels: number) {
  await userEvent.click(screen.getByRole('button', { name: `Sort (${levels} levels)` }));
  return screen.findByRole('dialog', { name: 'Sort' });
}

describe('SortButton and SortForm', () => {
  it('says newest first with no levels and applies an empty sort', async () => {
    const onApply = renderSort([]);
    const dialog = await openSort(0);
    expect(within(dialog).getByText('Newest records first.')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(onApply).toHaveBeenCalledWith([]));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('adds a second level descending and applies both', async () => {
    const onApply = renderSort();
    const dialog = await openSort(1);
    expect(within(dialog).getByRole('combobox', { name: 'Sort by' })).toHaveTextContent('Name');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Add sort level' }));
    await userEvent.click(within(dialog).getByRole('combobox', { name: 'Then by' }));
    await userEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', { name: 'Tier' }),
    );
    const directions = within(dialog).getAllByRole('group', { name: 'Direction' });
    await userEvent.click(within(directions[1]).getByRole('button', { name: 'Descending' }));
    // Clicking the chosen direction again keeps it: a level always has one.
    await userEvent.click(within(directions[1]).getByRole('button', { name: 'Descending' }));

    await userEvent.click(within(dialog).getByRole('button', { name: 'Apply' }));
    await waitFor(() =>
      expect(onApply).toHaveBeenCalledWith([
        { property: 'name', dir: SortDir.Asc },
        { property: 'tier', dir: SortDir.Desc },
      ]),
    );
  });

  it('refuses a blank level and caps the levels at three', async () => {
    const onApply = renderSort();
    const dialog = await openSort(1);
    const add = within(dialog).getByRole('button', { name: 'Add sort level' });
    await userEvent.click(add);
    await userEvent.click(add);
    expect(add).toBeDisabled();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Apply' }));
    expect(await within(dialog).findAllByText('Choose a property to sort by')).toHaveLength(2);
    expect(onApply).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Remove sort level 3' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Remove sort level 2' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Apply' }));
    await waitFor(() =>
      expect(onApply).toHaveBeenCalledWith([{ property: 'name', dir: SortDir.Asc }]),
    );
  });

  it('clears every level, and Cancel closes without applying', async () => {
    const onApply = renderSort();
    const dialog = await openSort(1);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Clear sort' }));
    expect(within(dialog).getByText('Newest records first.')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(onApply).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('translates built-in property names only', async () => {
    const onApply = vi.fn();
    renderWithProviders(<SortButton properties={PROPERTIES} sorts={[]} onApply={onApply} />, {
      messages: { Name: 'Nom', Tier: 'Niveau' },
    });
    const dialog = await openSort(0);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add sort level' }));
    await userEvent.click(within(dialog).getByRole('combobox', { name: 'Sort by' }));
    const names = within(screen.getByRole('listbox'))
      .getAllByRole('option')
      .map((option) => option.textContent);
    expect(names).toEqual(expect.arrayContaining(['Nom', 'Tier']));
  });
});
