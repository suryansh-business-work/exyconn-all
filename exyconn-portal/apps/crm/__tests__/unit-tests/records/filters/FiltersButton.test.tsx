import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { endOfDay, startOfDay } from 'date-fns';
import { CrmOp, CrmPropertyType } from '@exyconn/shell/graphql/generated';
import { FilterBuilderForm } from '../../../../src/records/filters/filter-builder';
import { FiltersButton } from '../../../../src/records/filters/FiltersButton';
import type { FilterGroup } from '../../../../src/records/list/recordQuery';
import { renderWithProviders } from '../../test-utils';
import { choiceProperty, property } from '../records-fixtures';

vi.mock('@exyconn/shell/components/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/components/ui')>()),
  DatePicker: (await import('../date-picker-stub')).DatePickerStub,
}));

const NAME = property({ ops: [CrmOp.Contains, CrmOp.IsEmpty] });
const VALUE = property({
  key: 'value',
  label: 'Value',
  type: CrmPropertyType.Number,
  ops: [CrmOp.Gt, CrmOp.Between],
});
const DUE = property({
  key: 'due',
  label: 'Due',
  type: CrmPropertyType.Date,
  ops: [CrmOp.Before, CrmOp.After, CrmOp.Between, CrmOp.LastDays],
});
const STAGE = choiceProperty(
  { NEW: 'New', HOT: 'Hot' },
  { ops: [CrmOp.In, CrmOp.Eq], builtIn: false, label: 'Stage' },
);
const VIP = property({ key: 'vip', label: 'VIP', type: CrmPropertyType.Boolean, ops: [CrmOp.Eq] });
const PROPERTIES = [NAME, VALUE, DUE, STAGE, VIP];

function renderFilters(groups: FilterGroup[] = []) {
  const onApply = vi.fn();
  renderWithProviders(<FiltersButton properties={PROPERTIES} groups={groups} onApply={onApply} />);
  return onApply;
}

async function openFilters(active = 0) {
  await userEvent.click(screen.getByRole('button', { name: `Filters (${active} active)` }));
  return screen.findByRole('form', { name: 'Filters' });
}

/** The builder on its own, as the side panel shows it: faster than going through the drawer. */
function renderBuilder(groups: FilterGroup[] = []) {
  const onApply = vi.fn();
  renderWithProviders(
    <FilterBuilderForm properties={PROPERTIES} groups={groups} onApply={onApply} onCancel={vi.fn()} />,
  );
  return { onApply, form: screen.getByRole('form', { name: 'Filters' }) };
}

function typeInto(field: HTMLElement, value: string) {
  fireEvent.change(field, { target: { value } });
}

async function pickProperty(form: HTMLElement, name: string, row = 0) {
  await userEvent.click(within(form).getAllByRole('combobox', { name: 'Property' })[row]);
  await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: new RegExp(`^${name}`) }));
}

async function pickOperator(form: HTMLElement, label: string, row = 0) {
  await userEvent.click(within(form).getAllByRole('combobox', { name: 'Operator' })[row]);
  await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: label }));
}

async function apply(form: HTMLElement) {
  await userEvent.click(within(form).getByRole('button', { name: 'Apply' }));
}

async function closed() {
  await waitFor(() => expect(screen.queryByRole('form')).not.toBeInTheDocument());
  await waitFor(() => expect(screen.queryByRole('presentation')).not.toBeInTheDocument());
}

describe('FiltersButton', () => {
  it('counts the active conditions and applies the builder result, closing the panel', async () => {
    const onApply = renderFilters([
      { id: 'g', conditions: [{ id: 'c', property: 'name', op: CrmOp.IsEmpty, values: [] }] },
    ]);
    const form = await openFilters(1);
    expect(screen.getByRole('heading', { name: 'Filters' })).toBeInTheDocument();
    await apply(form);
    await waitFor(() =>
      expect(onApply).toHaveBeenCalledWith([
        {
          id: expect.any(String),
          conditions: [{ id: expect.any(String), property: 'name', op: CrmOp.IsEmpty, values: [] }],
        },
      ]),
    );
    await closed();
  });

  it('closes without applying from Cancel or the close button', async () => {
    const onApply = renderFilters();
    let form = await openFilters();
    await userEvent.click(within(form).getByRole('button', { name: 'Cancel' }));
    await closed();
    form = await openFilters();
    expect(form).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await closed();
    expect(onApply).not.toHaveBeenCalled();
  });
});

// Autocomplete-heavy rows render slowly on a loaded machine.
describe('FilterBuilderForm', { timeout: 60_000 }, () => {
  it('opens on one blank row and applies nothing when it is left blank', async () => {
    const { form, onApply } = renderBuilder();
    expect(within(form).getByRole('heading', { name: 'Group 1' })).toBeInTheDocument();
    await apply(form);
    await waitFor(() => expect(onApply).toHaveBeenCalledWith([]));
  });

  it('groups the properties Built-in then Custom with their types', async () => {
    const { form } = renderBuilder();
    await userEvent.click(within(form).getByRole('combobox', { name: 'Property' }));
    expect(screen.getByRole('listbox')).toHaveTextContent(/^Built-in.*NameText.*Custom.*StageDropdown$/);
  });

  it('builds a text condition, and shows a missing value under it', async () => {
    const { form, onApply } = renderBuilder();
    await pickProperty(form, 'Name');
    expect(within(form).getByRole('combobox', { name: 'Operator' })).toHaveTextContent('contains');
    await apply(form);
    expect(await within(form).findByRole('alert')).toHaveTextContent('Enter a value');
    expect(onApply).not.toHaveBeenCalled();

    typeInto(within(form).getByRole('textbox', { name: 'Value' }), 'acme');
    await apply(form);
    await waitFor(() =>
      expect(onApply).toHaveBeenCalledWith([
        {
          id: expect.any(String),
          conditions: [{ id: expect.any(String), property: 'name', op: CrmOp.Contains, values: ['acme'] }],
        },
      ]),
    );
  });

  it('needs no value for unknown', async () => {
    const { form, onApply } = renderBuilder();
    await pickProperty(form, 'Name');
    await pickOperator(form, 'is unknown');
    expect(within(form).queryByRole('textbox', { name: 'Value' })).not.toBeInTheDocument();
    await apply(form);
    await waitFor(() => expect(onApply.mock.calls[0][0][0].conditions[0].values).toEqual([]));
  });

  it('starts blank boxes when the operator takes another shape, keeps the value otherwise', async () => {
    renderBuilder([{ id: 'g', conditions: [{ id: 'c', property: 'value', op: CrmOp.Gt, values: ['5'] }] }]);
    const form = screen.getByRole('form', { name: 'Filters' });
    expect(within(form).getByRole('spinbutton', { name: 'Value' })).toHaveValue(5);
    await pickOperator(form, 'is greater than');
    expect(within(form).getByRole('spinbutton', { name: 'Value' })).toHaveValue(5);
    await pickOperator(form, 'is between');
    expect(within(form).getByRole('spinbutton', { name: 'From' })).toHaveValue(null);
    expect(within(form).getByRole('spinbutton', { name: 'To' })).toHaveValue(null);
  });

  it('checks and builds a number range', async () => {
    const { form, onApply } = renderBuilder();
    await pickProperty(form, 'Value');
    await pickOperator(form, 'is between');
    await apply(form);
    expect(await within(form).findByRole('alert')).toHaveTextContent('Enter both values');
    typeInto(within(form).getByRole('spinbutton', { name: 'From' }), '10');
    typeInto(within(form).getByRole('spinbutton', { name: 'To' }), '1');
    await apply(form);
    await waitFor(() =>
      expect(within(form).getByRole('alert')).toHaveTextContent(
        'The first number must not be larger than the second',
      ),
    );
    typeInto(within(form).getByRole('spinbutton', { name: 'To' }), '20');
    await apply(form);
    await waitFor(() =>
      expect(onApply.mock.calls[0][0][0].conditions[0]).toMatchObject({
        op: CrmOp.Between,
        values: ['10', '20'],
      }),
    );
  });

  it('sends a "before" date as the start of the day', async () => {
    const { form, onApply } = renderBuilder();
    await pickProperty(form, 'Due');
    expect(within(form).getByRole('combobox', { name: 'Operator' })).toHaveTextContent('is before');
    typeInto(within(form).getByLabelText('Date'), '2026-10-15');
    expect(within(form).getByLabelText('Date')).toHaveAttribute('data-value', new Date(2026, 9, 15).toDateString());
    await apply(form);
    await waitFor(() =>
      expect(onApply.mock.calls[0][0][0].conditions[0].values).toEqual([
        startOfDay(new Date(2026, 9, 15)).toISOString(),
      ]),
    );
  });

  it('sends an "after" date as the end of the day', async () => {
    const { form, onApply } = renderBuilder();
    await pickProperty(form, 'Due');
    await pickOperator(form, 'is after');
    typeInto(within(form).getByLabelText('Date'), '2026-10-15');
    await apply(form);
    await waitFor(() =>
      expect(onApply.mock.calls[0][0][0].conditions[0].values).toEqual([
        endOfDay(new Date(2026, 9, 15)).toISOString(),
      ]),
    );
  });

  it('treats a half-typed date as not set and checks a date range', async () => {
    const { form, onApply } = renderBuilder();
    await pickProperty(form, 'Due');
    await pickOperator(form, 'is between');
    typeInto(within(form).getByLabelText('From'), 'bad');
    typeInto(within(form).getByLabelText('To'), '2026-10-01');
    await apply(form);
    expect(await within(form).findByRole('alert')).toHaveTextContent('Enter both values');
    typeInto(within(form).getByLabelText('From'), '2026-10-20');
    await apply(form);
    await waitFor(() =>
      expect(within(form).getByRole('alert')).toHaveTextContent('The start date must be on or before the end'),
    );
    typeInto(within(form).getByLabelText('From'), '2026-09-20');
    fireEvent.blur(within(form).getByLabelText('From'));
    await apply(form);
    await waitFor(() => expect(onApply).toHaveBeenCalled());
  });

  it('asks for whole days in the last-days filter', async () => {
    const { form, onApply } = renderBuilder();
    await pickProperty(form, 'Due');
    await pickOperator(form, 'is in the last');
    typeInto(within(form).getByRole('spinbutton', { name: 'Days' }), '7');
    await apply(form);
    await waitFor(() =>
      expect(onApply.mock.calls[0][0][0].conditions[0]).toMatchObject({ op: CrmOp.LastDays, values: ['7'] }),
    );
  });

  it('picks several options of a choice property, and says when none is picked', async () => {
    const { form, onApply } = renderBuilder();
    await pickProperty(form, 'Stage');
    expect(within(form).getByRole('combobox', { name: 'Operator' })).toHaveTextContent('is any of');
    await apply(form);
    expect(await within(form).findByRole('alert')).toHaveTextContent('Choose at least one option');
    await userEvent.click(within(form).getByRole('combobox', { name: 'Values' }));
    await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Hot' }));
    await userEvent.click(within(form).getByRole('combobox', { name: 'Values' }));
    await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'New' }));
    fireEvent.blur(within(form).getByRole('combobox', { name: 'Values' }));
    await apply(form);
    await waitFor(() => expect(onApply.mock.calls[0][0][0].conditions[0].values).toEqual(['HOT', 'NEW']));
  });

  it('picks one option of a choice property', async () => {
    const { form, onApply } = renderBuilder([
      { id: 'g', conditions: [{ id: 'c', property: 'stage', op: CrmOp.Eq, values: ['HOT'] }] },
    ]);
    await userEvent.click(within(form).getByRole('combobox', { name: 'Value' }));
    await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'New' }));
    await apply(form);
    await waitFor(() =>
      expect(onApply.mock.calls[0][0][0].conditions[0]).toMatchObject({ op: CrmOp.Eq, values: ['NEW'] }),
    );
  });

  it('asks Yes or No for a Yes/No property', async () => {
    const { form, onApply } = renderBuilder();
    await pickProperty(form, 'VIP');
    await userEvent.click(within(form).getByRole('combobox', { name: 'Value' }));
    await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'No' }));
    await apply(form);
    await waitFor(() => expect(onApply.mock.calls[0][0][0].conditions[0]).toMatchObject({ values: ['false'] }));
  });

  it('adds and removes conditions and groups, and clears everything', async () => {
    const { form } = renderBuilder();
    await userEvent.click(within(form).getByRole('button', { name: 'Add filter' }));
    expect(within(form).getByText('and')).toBeInTheDocument();
    expect(within(form).getAllByRole('combobox', { name: 'Property' })).toHaveLength(2);
    await userEvent.click(within(form).getAllByRole('button', { name: 'Remove filter' })[1]);
    expect(within(form).getAllByRole('combobox', { name: 'Property' })).toHaveLength(1);

    await userEvent.click(within(form).getByRole('button', { name: 'Add filter group' }));
    expect(within(form).getByText('OR')).toBeInTheDocument();
    await userEvent.click(within(form).getByRole('button', { name: 'Remove group 2' }));
    expect(within(form).queryByText('OR')).not.toBeInTheDocument();

    await userEvent.click(within(form).getByRole('button', { name: 'Clear all' }));
    expect(within(form).getByText('No filters yet. Every record is shown.')).toBeInTheDocument();
    await userEvent.click(within(form).getByRole('button', { name: 'Add filter' }));
    expect(within(form).getByRole('heading', { name: 'Group 1' })).toBeInTheDocument();
  });

  it('caps the groups and the conditions at the server limits', () => {
    const many = (count: number, prefix: string) =>
      Array.from({ length: count }, (_unused, index) => ({
        id: `${prefix}${index}`,
        property: 'name',
        op: CrmOp.IsEmpty,
        values: [],
      }));
    const { form } = renderBuilder([
      { id: 'g0', conditions: many(20, 'c') },
      ...Array.from({ length: 9 }, (_unused, index) => ({ id: `g${index + 1}`, conditions: many(1, `x${index}`) })),
    ]);
    expect(within(form).getByRole('button', { name: 'Add filter group' })).toBeDisabled();
    expect(within(form).getAllByRole('button', { name: 'Add filter' })[0]).toBeDisabled();
  });

  it('flags a deleted property and an operator it no longer allows', async () => {
    const { form } = renderBuilder([
      {
        id: 'g',
        conditions: [
          { id: 'c1', property: 'gone', op: CrmOp.Eq, values: ['x'] },
          { id: 'c2', property: 'name', op: CrmOp.Gt, values: ['x'] },
        ],
      },
    ]);
    await apply(form);
    expect(await within(form).findByText('Choose a property')).toBeInTheDocument();
    expect(within(form).getByText('Choose how to compare')).toBeInTheDocument();
  });

  it('starts the operator again when the property changes or is cleared', async () => {
    const { form, onApply } = renderBuilder([
      { id: 'g', conditions: [{ id: 'c', property: 'value', op: CrmOp.Gt, values: ['5'] }] },
    ]);
    await pickProperty(form, 'Name');
    expect(within(form).getByRole('combobox', { name: 'Operator' })).toHaveTextContent('contains');
    expect(within(form).getByRole('textbox', { name: 'Value' })).toHaveValue('');
    await userEvent.click(within(form).getByRole('button', { name: 'Clear' }));
    expect(within(form).queryByRole('combobox', { name: 'Operator' })).not.toBeInTheDocument();
    fireEvent.blur(within(form).getByRole('combobox', { name: 'Property' }));
    await apply(form);
    await waitFor(() => expect(onApply).toHaveBeenCalledWith([]));
  });
});
