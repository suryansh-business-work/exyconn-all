import { screen } from '@testing-library/react';
import { SetRows } from '../../../../../../../src/admin/workflows/editor/inspector/fields/SetRows';
import { renderField, replaceText, submitted } from '../node-form-helpers';

describe('SetRows', () => {
  it('adds, fills and removes variable rows under the default heading', async () => {
    const { user, onSubmit, submit } = renderField(<SetRows name="set" />, {
      set: [{ key: 'fee', value: '650' }],
    });
    expect(screen.getByText('Set variables')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('fee');
    await user.click(screen.getByRole('button', { name: 'Add variable' }));
    const names = screen.getAllByRole('textbox', { name: 'Name' });
    const values = screen.getAllByRole('textbox', { name: 'Value' });
    expect(names).toHaveLength(2);
    expect(screen.getAllByText('Text, {{var}} or a $ helper')).toHaveLength(2);
    await user.type(names[1], 'slot');
    await replaceText(user, values[1], '{{day|day}}');
    await user.click(screen.getByRole('button', { name: 'Remove variable 1' }));
    await submit();
    expect((await submitted(onSubmit)).set).toEqual([{ key: 'slot', value: '{{day|day}}' }]);
  });

  it('uses a custom heading and starts empty', () => {
    renderField(<SetRows name="buttons.0.set" title="Set variables when tapped" />, {
      buttons: [{ id: 'a' }],
    });
    expect(screen.getByText('Set variables when tapped')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).toBeNull();
  });
});
