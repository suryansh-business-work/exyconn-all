import { screen } from '@testing-library/react';
import { applyForm, makeNode, pickOption, renderNodeForm, replaceText } from '../node-form-helpers';

const textbox = (name: string) => screen.getByRole('textbox', { name });
const number = (name: string) => screen.getByRole('spinbutton', { name });

describe('logic node forms', () => {
  it('Delay: keeps the typing time within its range', async () => {
    const { user, onApply } = renderNodeForm(makeNode('delay'));
    expect(number('Typing time (ms)')).toHaveAttribute('step', '100');
    await user.clear(number('Typing time (ms)'));
    await user.type(number('Typing time (ms)'), '50');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(await screen.findByText('Too small')).toBeInTheDocument();
    await user.type(number('Typing time (ms)'), '0');
    expect(await applyForm(user, onApply)).toEqual({ ms: 500 });
  });

  it('Reminder: edits when it is due and its label', async () => {
    const { user, onApply } = renderNodeForm(makeNode('reminder'));
    expect(number('Send after (ms)')).toHaveValue(60_000);
    await replaceText(user, textbox('Reminder label'), 'Follow up');
    expect(await applyForm(user, onApply)).toEqual({ afterMs: 60_000, label: 'Follow up' });
  });

  it("Jump: offers the demo's workflows", async () => {
    const { user, onApply } = renderNodeForm(makeNode('jump'));
    expect(screen.getByRole('combobox', { name: 'Workflow' })).toHaveTextContent('main');
    await pickOption(user, 'Workflow', 'faq');
    expect(await applyForm(user, onApply)).toEqual({ workflowKey: 'faq' });
  });

  it('Input: edits the question, variable, answer type and date rule', async () => {
    const { user, onApply } = renderNodeForm(makeNode('input'));
    expect(screen.getByText('An answer of the wrong type is asked again')).toBeInTheDocument();
    await pickOption(user, 'Answer type', 'date');
    await replaceText(user, textbox('Save the answer as'), 'dob');
    await user.type(textbox('Message when the answer is not valid'), 'Use DD/MM/YYYY');
    await user.click(screen.getByRole('switch', { name: 'Dates only: must not be in the future' }));
    expect(await applyForm(user, onApply)).toEqual({
      prompt: 'Please type your name.',
      var: 'dob',
      kind: 'date',
      error: 'Use DD/MM/YYYY',
      past: true,
    });
  });

  it('AI: warns while OpenAI is not configured', () => {
    renderNodeForm(makeNode('ai'), { aiConfigured: false });
    expect(screen.getByRole('alert')).toHaveTextContent('OpenAI not configured');
  });

  it('AI: edits intents and the values to extract', async () => {
    const { user, onApply } = renderNodeForm(makeNode('ai'));
    expect(screen.queryByRole('alert')).toBeNull();
    const [addIntent, addValue] = screen.getAllByRole('button', { name: 'Add' });
    await user.click(addIntent);
    expect(screen.getAllByRole('textbox', { name: 'Intent id' })[1]).toHaveValue('intent-2');
    await user.type(screen.getAllByRole('textbox', { name: 'What it means' })[1], 'Wants a refund');
    await user.click(addValue);
    expect(textbox('Save as')).toHaveValue('value-1');
    expect(screen.getByRole('combobox', { name: 'Kind' })).toHaveTextContent('text');
    await pickOption(user, 'Kind', 'email');
    await user.type(textbox('What to look for'), 'Their email');
    await user.type(textbox('When not understood'), 'Sorry?');
    expect(await applyForm(user, onApply)).toEqual({
      prompt: 'How can I help you today?',
      intents: [
        { id: 'help', description: 'The customer asks for help' },
        { id: 'intent-2', description: 'Wants a refund' },
      ],
      entities: [{ name: 'value-1', kind: 'email', description: 'Their email' }],
      retry: 'Sorry?',
    });
  });

  it('Condition: compares only with operators that take a value', async () => {
    const { user, onApply } = renderNodeForm(makeNode('condition'));
    expect(screen.getByText(/the first that matches is followed/)).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Value' })).toBeNull();
    await pickOption(user, 'Test', 'eq');
    await user.type(textbox('Value'), 'Priya');
    expect(await applyForm(user, onApply)).toEqual({
      cases: [{ id: 'has-value', var: 'name', op: 'eq', value: 'Priya' }],
    });
  });

  it('Condition: a new case needs its variable before Apply', async () => {
    const { user, onApply } = renderNodeForm(makeNode('condition'));
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getAllByRole('textbox', { name: 'Id' })[1]).toHaveValue('case-2');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(await screen.findByText('This is required')).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
    await user.type(screen.getAllByRole('textbox', { name: 'Variable' })[1], 'city');
    expect(await applyForm(user, onApply)).toEqual({
      cases: [
        { id: 'has-value', var: 'name', op: 'notEmpty' },
        { id: 'case-2', var: 'city', op: 'eq', value: '' },
      ],
    });
  });
});
