import { screen, waitFor } from '@testing-library/react';
import { applyForm, makeNode, renderNodeForm, replaceText } from '../node-form-helpers';

const PENDING = 'Apply to update the canvas. Save draft keeps it.';

describe('NodeFormFrame', () => {
  it('holds Apply and Reset until something changes', () => {
    renderNodeForm(makeNode('text'));
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled();
    expect(screen.queryByText(PENDING)).toBeNull();
  });

  it('says an edit is pending and Reset puts the node back', async () => {
    const { user, onApply } = renderNodeForm(makeNode('text', { text: 'Hi' }));
    const message = screen.getByRole('textbox', { name: 'Message' });
    await user.type(message, ' there');
    expect(screen.getByRole('status')).toHaveTextContent(PENDING);
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(message).toHaveValue('Hi');
    await waitFor(() => expect(screen.queryByText(PENDING)).toBeNull());
    expect(onApply).not.toHaveBeenCalled();
  });

  it('applies the cleaned data and starts again from it', async () => {
    const { user, onApply } = renderNodeForm(makeNode('text', { text: 'Hi', note: 'old' }));
    await replaceText(
      user,
      screen.getByRole('textbox', { name: 'Message' }),
      'Hello {{user.firstName}}',
    );
    await user.clear(screen.getByRole('textbox', { name: 'Note for editors' }));
    expect(await applyForm(user, onApply)).toEqual({ text: 'Hello {{user.firstName}}' });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled());
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue(
      'Hello {{user.firstName}}',
    );
  });

  it('blocks Apply with the field error when the data breaks its schema', async () => {
    const { user, onApply } = renderNodeForm(makeNode('text'));
    await user.clear(screen.getByRole('textbox', { name: 'Message' }));
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(await screen.findByText('This is required')).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
  });

  it('edits the fields every node has: variables, completion and a note', async () => {
    const { user, onApply } = renderNodeForm(makeNode('notice', { set: { stage: 'intro' } }));
    expect(screen.getByText('Every node')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('stage');
    expect(screen.getByText('Only shown here, never to the customer')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add variable' }));
    await user.type(screen.getAllByRole('textbox', { name: 'Name' })[1], 'fee');
    await replaceText(user, screen.getAllByRole('textbox', { name: 'Value' })[1], '$price:650');
    await user.click(
      screen.getByRole('switch', { name: 'Reaching this node completes the workflow' }),
    );
    await user.type(screen.getByRole('textbox', { name: 'Note for editors' }), 'Ask Priya');
    expect(await applyForm(user, onApply)).toEqual({
      text: 'A notice for the customer.',
      set: { stage: 'intro', fee: '$price:650' },
      complete: true,
      note: 'Ask Priya',
    });
  });
});
