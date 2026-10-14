import { screen } from '@testing-library/react';
import type { CtaAction } from '@exyconn/wa-flow';
import { applyForm, makeNode, pickOption, renderNodeForm, replaceText } from '../node-form-helpers';

const textbox = (name: string) => screen.getByRole('textbox', { name });

describe('Buttons form', () => {
  it('edits the frame and adds up to three buttons with their own variables', async () => {
    const { user, onApply } = renderNodeForm(makeNode('buttons'));
    expect(screen.getByText('(2/3)')).toBeInTheDocument();
    await user.type(textbox('Header'), 'Booking');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
    const titles = screen.getAllByRole('textbox', { name: 'Title' });
    expect(screen.getAllByRole('textbox', { name: 'Id' })[2]).toHaveValue('button-3');
    await user.type(titles[2], 'Maybe');
    await user.click(screen.getAllByRole('button', { name: 'Add variable' })[2]);
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'answer');
    await user.type(screen.getByRole('textbox', { name: 'Value' }), 'maybe');
    expect(await applyForm(user, onApply)).toEqual({
      header: 'Booking',
      text: 'Choose an option.',
      buttons: [
        { id: 'yes', title: 'Yes' },
        { id: 'no', title: 'No' },
        { id: 'button-3', title: 'Maybe', set: { answer: 'maybe' } },
      ],
    });
  });

  it('keeps button titles within WhatsApp’s limit', async () => {
    const { user, onApply } = renderNodeForm(makeNode('buttons'));
    await replaceText(user, screen.getAllByRole('textbox', { name: 'Title' })[0], 'A'.repeat(21));
    expect(screen.getByText('21/20')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(await screen.findByText('Too long for WhatsApp')).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
  });
});

describe('Call to action form', () => {
  it('edits a link action', async () => {
    const { user, onApply } = renderNodeForm(makeNode('cta'));
    expect(screen.getByRole('combobox', { name: 'Action' })).toHaveTextContent('Open a link');
    await replaceText(user, textbox('Link'), 'https://clinic.example/book');
    expect(await applyForm(user, onApply)).toEqual({
      text: 'Find out more on our website.',
      actions: [{ kind: 'url', title: 'Open website', url: 'https://clinic.example/book' }],
    });
  });

  it('switches an action to a call, keeping its title', async () => {
    const { user, onApply } = renderNodeForm(makeNode('cta'));
    await pickOption(user, 'Action', 'Call a number');
    expect(screen.queryByRole('textbox', { name: 'Link' })).toBeNull();
    expect(textbox('Button title')).toHaveValue('Open website');
    await user.type(textbox('Phone'), '+91 90000 11111');
    expect(await applyForm(user, onApply)).toEqual({
      text: 'Find out more on our website.',
      actions: [{ kind: 'call', title: 'Open website', phone: '+91 90000 11111' }],
    });
  });

  it('adds a calendar action as the second and last one', async () => {
    const { user, onApply } = renderNodeForm(makeNode('cta'));
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
    await user.click(screen.getAllByRole('combobox', { name: 'Action' })[1]);
    await user.click(await screen.findByRole('option', { name: 'Add to calendar' }));
    expect(screen.getAllByRole('combobox', { name: 'Action' })[1]).toHaveTextContent(
      'Add to calendar',
    );
    await user.type(screen.getAllByRole('textbox', { name: 'Button title' })[1], 'Save it');
    await user.type(textbox('Event title'), 'Check-up');
    expect(textbox('Starts at')).toHaveValue('{{slot}}');
    expect(screen.getByRole('spinbutton', { name: 'Duration (minutes)' })).toHaveValue(30);
    await user.type(textbox('Event location'), 'Room 4');
    expect(await applyForm(user, onApply)).toEqual({
      text: 'Find out more on our website.',
      actions: [
        { kind: 'url', title: 'Open website', url: 'https://example.com' },
        {
          kind: 'calendar',
          title: 'Save it',
          event: { title: 'Check-up', start: '{{slot}}', durationMin: 30, location: 'Room 4' },
        },
      ],
    });
  });

  it('starts an untitled action with an empty title when its kind changes', async () => {
    // A legacy draft may hold an action without a title; switching kinds must not print "undefined".
    const untitled = { kind: 'url', url: 'https://x.example' } as unknown as CtaAction;
    const { user } = renderNodeForm(makeNode('cta', { actions: [untitled] }));
    await pickOption(user, 'Action', 'Call a number');
    expect(textbox('Button title')).toHaveValue('');
    expect(textbox('Phone')).toHaveValue('');
  });
});
