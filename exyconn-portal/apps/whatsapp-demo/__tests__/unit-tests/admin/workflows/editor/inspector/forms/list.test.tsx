import { screen } from '@testing-library/react';
import { applyForm, makeNode, pickOption, renderNodeForm, replaceText } from '../node-form-helpers';

const textbox = (name: string) => screen.getByRole('textbox', { name });
const number = (name: string) => screen.getByRole('spinbutton', { name });
const SECTION = { id: 'section-1', title: 'Options', rows: [{ id: 'row-1', title: 'Option 1' }] };
const BASE = { text: 'Pick one of these.', button: 'View options' };

describe('List form', () => {
  it('adds a row to a section, with a description', async () => {
    const { user, onApply } = renderNodeForm(makeNode('list'));
    expect(screen.getByText('Opens the list, e.g. “View options”')).toBeInTheDocument();
    const [, addRow] = screen.getAllByRole('button', { name: 'Add' });
    await user.click(addRow);
    expect(screen.getAllByRole('textbox', { name: 'Id' })[1]).toHaveValue('row-2');
    await user.type(screen.getAllByRole('textbox', { name: 'Title' })[1], 'Option 2');
    await user.type(screen.getAllByRole('textbox', { name: 'Description' })[1], 'The second one');
    expect(await applyForm(user, onApply)).toEqual({
      ...BASE,
      sections: [
        {
          ...SECTION,
          rows: [
            ...SECTION.rows,
            { id: 'row-2', title: 'Option 2', description: 'The second one' },
          ],
        },
      ],
    });
  });

  it('adds a section that starts with one row and needs titles', async () => {
    const { user, onApply } = renderNodeForm(makeNode('list'));
    await user.click(screen.getAllByRole('button', { name: 'Add' })[0]);
    expect(screen.getAllByRole('textbox', { name: 'Section id' })[1]).toHaveValue('section-2');
    expect(screen.getAllByRole('textbox', { name: 'Id' })[1]).toHaveValue('section-2-row-1');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(await screen.findAllByText('This is required')).toHaveLength(2);
    await user.type(screen.getAllByRole('textbox', { name: 'Section title' })[1], 'More');
    await user.type(screen.getAllByRole('textbox', { name: 'Title' })[1], 'Other');
    expect(await applyForm(user, onApply)).toEqual({
      ...BASE,
      sections: [
        SECTION,
        { id: 'section-2', title: 'More', rows: [{ id: 'section-2-row-1', title: 'Other' }] },
      ],
    });
  });

  it('generates the next few days', async () => {
    const { user, onApply } = renderNodeForm(makeNode('list'));
    expect(screen.getByRole('combobox', { name: 'Generated rows' })).toHaveTextContent(
      'No generated rows',
    );
    await pickOption(user, 'Generated rows', 'The next few days');
    expect(number('How many days')).toHaveValue(7);
    expect(screen.getByRole('switch', { name: 'Skip Sundays' })).toBeChecked();
    await replaceText(user, textbox('Save the day as'), 'visitDay');
    expect(await applyForm(user, onApply)).toEqual({
      ...BASE,
      sections: [SECTION],
      dynamic: { kind: 'days', count: 7, skipSundays: true, var: 'visitDay' },
    });
  });

  it('generates free slots on a chosen day', async () => {
    const node = makeNode('list', { dynamic: { kind: 'days', count: 3, var: 'day' } });
    const { user, onApply } = renderNodeForm(node);
    expect(screen.getByRole('combobox', { name: 'Generated rows' })).toHaveTextContent(
      'The next few days',
    );
    await pickOption(user, 'Generated rows', 'Free time slots on a day');
    expect(screen.queryByRole('spinbutton', { name: 'How many days' })).toBeNull();
    expect(textbox('Day variable')).toHaveValue('day');
    expect(number('From hour')).toHaveValue(9);
    expect(number('To hour')).toHaveValue(17);
    expect(number('Minutes between slots')).toHaveValue(30);
    await user.clear(number('Slots to offer'));
    await user.type(number('Slots to offer'), '4');
    expect(textbox('Save the slot as')).toHaveValue('slot');
    expect(await applyForm(user, onApply)).toEqual({
      ...BASE,
      sections: [SECTION],
      dynamic: { kind: 'slots', dayVar: 'day', from: 9, to: 17, stepMin: 30, take: 4, var: 'slot' },
    });
  });

  it('stops generating rows', async () => {
    const node = makeNode('list', { dynamic: { kind: 'days', count: 3, var: 'day' } });
    const { user, onApply } = renderNodeForm(node);
    await pickOption(user, 'Generated rows', 'No generated rows');
    expect(screen.queryByRole('textbox', { name: 'Save the day as' })).toBeNull();
    expect(await applyForm(user, onApply)).toEqual({ ...BASE, sections: [SECTION] });
  });
});
