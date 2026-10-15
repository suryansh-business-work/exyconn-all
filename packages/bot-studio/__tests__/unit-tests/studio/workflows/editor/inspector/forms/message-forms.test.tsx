import { screen } from '@testing-library/react';
import { applyForm, makeNode, pickOption, renderNodeForm, replaceText } from '../node-form-helpers';

const textbox = (name: string) => screen.getByRole('textbox', { name });

describe('message node forms', () => {
  it('Text: edits the message with formatting help', async () => {
    const { user, onApply } = renderNodeForm(makeNode('text'));
    expect(screen.getByText('*bold*, _italic_ and {{var}} work')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Personalise with variables' })).toBeInTheDocument();
    await replaceText(user, textbox('Message'), 'Thanks!');
    expect(await applyForm(user, onApply)).toEqual({ text: 'Thanks!' });
  });

  it('Notice: edits the notice line', async () => {
    const { user, onApply } = renderNodeForm(makeNode('notice'));
    await replaceText(user, textbox('Notice'), 'Chat is end-to-end encrypted');
    expect(await applyForm(user, onApply)).toEqual({ text: 'Chat is end-to-end encrypted' });
  });

  it('Image: edits the illustration and caption, dropping an emptied title', async () => {
    const { user, onApply } = renderNodeForm(makeNode('image'));
    expect(screen.getByRole('combobox', { name: 'Icon' })).toHaveTextContent('info');
    await pickOption(user, 'Accent', 'blue');
    await user.clear(textbox('Picture title'));
    await user.type(textbox('Picture subtitle'), 'Floor 2');
    await user.type(textbox('Caption'), 'Our clinic');
    expect(await applyForm(user, onApply)).toEqual({
      image: { icon: 'info', accent: 'blue', subtitle: 'Floor 2' },
      caption: 'Our clinic',
    });
  });

  it('Contact: needs a dialable phone and keeps optional fields out when empty', async () => {
    const { user, onApply } = renderNodeForm(makeNode('contact'));
    expect(screen.getByText('As it should be dialled, e.g. +91 90000 00000')).toBeInTheDocument();
    await replaceText(user, textbox('Phone'), '12');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(await screen.findByText('Too short')).toBeInTheDocument();
    await replaceText(user, textbox('Phone'), '+91 98765 43210');
    await user.type(textbox('Role'), 'Reception');
    expect(await applyForm(user, onApply)).toEqual({
      contact: { name: 'Front desk', phone: '+91 98765 43210', role: 'Reception' },
    });
  });

  it('Location: edits the pin and checks the coordinates', async () => {
    const { user, onApply } = renderNodeForm(makeNode('location'));
    const lat = screen.getByRole('spinbutton', { name: 'Latitude' });
    expect(lat).toHaveValue(12.9756);
    await user.clear(lat);
    await user.type(lat, '95');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(await screen.findByText('Too large')).toBeInTheDocument();
    await user.clear(lat);
    await user.type(lat, '19');
    await replaceText(user, textbox('Place name'), 'Bandra branch');
    expect(await applyForm(user, onApply)).toEqual({
      location: { name: 'Bandra branch', address: 'MG Road, Bengaluru', lat: 19, lng: 77.6066 },
    });
  });

  it('Handoff: edits who joins and what they say', async () => {
    const { user, onApply } = renderNodeForm(makeNode('handoff'));
    expect(screen.getByText('Shown as “<name> joined”')).toBeInTheDocument();
    await replaceText(user, textbox('Agent name'), 'Dr. Mehta');
    expect(await applyForm(user, onApply)).toEqual({
      agentName: 'Dr. Mehta',
      text: 'Hi {{user.firstName}}, I can help with that.',
    });
  });

  it('End: edits the closing message and whether the menu comes back', async () => {
    const { user, onApply } = renderNodeForm(makeNode('end'));
    const menu = screen.getByRole('switch', { name: 'Show the menu again' });
    expect(menu).toBeChecked();
    await user.click(menu);
    await user.clear(textbox('Closing message'));
    expect(await applyForm(user, onApply)).toEqual({ text: '', showMenu: false });
  });
});
