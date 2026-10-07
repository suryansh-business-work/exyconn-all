import { screen, within } from '@testing-library/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { FieldValues, Resolver } from 'react-hook-form';
import {
  ArrayEditor,
  type ArrayItemProps,
} from '../../../../../../../src/admin/workflows/editor/inspector/fields/ArrayEditor';
import { CountedField } from '../../../../../../../src/admin/workflows/editor/inspector/fields/CountedField';
import { renderField, submitted } from '../node-form-helpers';

function TitleItem({ name, index }: Readonly<ArrayItemProps>) {
  return <CountedField name={`${name}.title`} label={`Title ${index + 1}`} />;
}

const newItem = vi.fn((items: readonly Record<string, unknown>[]) => ({
  id: `b-${items.length + 1}`,
  title: '',
}));

describe('ArrayEditor', () => {
  it('lists items with a numbered heading and the n/max count', () => {
    renderField(
      <ArrayEditor
        name="buttons"
        title="Buttons"
        itemLabel="Button"
        Item={TitleItem}
        newItem={newItem}
        max={3}
      />,
      {
        buttons: [
          { id: 'a', title: 'Yes' },
          { id: 'b', title: 'No' },
        ],
      },
    );
    const group = screen.getByRole('group', { name: /Buttons/ });
    expect(within(group).getByText('(2/3)')).toBeInTheDocument();
    expect(within(group).getByText('Button 1')).toBeInTheDocument();
    expect(within(group).getByRole('textbox', { name: 'Title 2' })).toHaveValue('No');
  });

  it('adds an item built from the current ones and stops at the limit', async () => {
    const { user, onSubmit, submit } = renderField(
      <ArrayEditor
        name="buttons"
        title="Buttons"
        itemLabel="Button"
        Item={TitleItem}
        newItem={newItem}
        max={2}
      />,
      { buttons: [{ id: 'a', title: 'Yes' }] },
    );
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(newItem).toHaveBeenLastCalledWith([{ id: 'a', title: 'Yes' }]);
    expect(screen.getByText('(2/2)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
    await submit();
    expect((await submitted(onSubmit)).buttons).toEqual([
      { id: 'a', title: 'Yes' },
      { id: 'b-2', title: '' },
    ]);
  });

  it('removes an item but never below the minimum', async () => {
    const { user } = renderField(
      <ArrayEditor
        name="rows"
        title="Rows"
        itemLabel="Row"
        Item={TitleItem}
        newItem={newItem}
        min={1}
      />,
      { rows: [{ title: 'One' }, { title: 'Two' }] },
    );
    expect(screen.getByText('(2)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove Row 1' }));
    expect(screen.getByRole('textbox', { name: 'Title 1' })).toHaveValue('Two');
    expect(screen.getByRole('button', { name: 'Remove Row 1' })).toBeDisabled();
  });

  it('starts an absent list empty and adds to it', async () => {
    const { user } = renderField(
      <ArrayEditor
        name="order.adjustments"
        title="Adjustments"
        itemLabel="Adjustment"
        Item={TitleItem}
        newItem={newItem}
      />,
      { order: {} },
    );
    expect(screen.getByText('(0)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(newItem).toHaveBeenLastCalledWith([]);
    expect(screen.getByText('Adjustment 1')).toBeInTheDocument();
  });

  it("shows the array's own error", async () => {
    const resolver = zodResolver(
      z.object({ cases: z.array(z.object({ title: z.string() })).min(1, 'Add at least one') }),
    ) as unknown as Resolver<FieldValues>;
    const { submit } = renderField(
      <ArrayEditor
        name="cases"
        title="Cases"
        itemLabel="Case"
        Item={TitleItem}
        newItem={newItem}
      />,
      { cases: [] },
      { resolver },
    );
    await submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Add at least one');
  });

  it('translates the heading and item labels', () => {
    renderField(
      <ArrayEditor name="rows" title="Rows" itemLabel="Row" Item={TitleItem} newItem={newItem} />,
      { rows: [{ title: 'One' }] },
      { messages: { Rows: 'Zeilen', Row: 'Zeile' } },
    );
    expect(screen.getByText('Zeilen')).toBeInTheDocument();
    expect(screen.getByText('Zeile 1')).toBeInTheDocument();
  });
});
