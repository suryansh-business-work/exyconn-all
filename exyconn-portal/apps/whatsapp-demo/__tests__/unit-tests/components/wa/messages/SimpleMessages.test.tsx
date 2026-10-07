import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import {
  ButtonsMessage,
  ImageMessage,
  ListMessage,
  SystemNotice,
  TextMessage,
} from '../../../../../src/components/wa/messages/SimpleMessages';
import { renderWithProviders } from '../../../test-utils';
import { frame, option, picture, renderMessage } from './messages.fixtures';

describe('TextMessage', () => {
  it("shows the text under a human agent's name after a handoff", () => {
    renderWithProviders(
      <TextMessage content={{ type: 'text', text: 'I can help', sender: 'Priya' }} frame={frame} />,
    );
    expect(screen.getByText('Priya')).toBeInTheDocument();
    expect(screen.getByText('I can help')).toBeInTheDocument();
  });
});

describe('ButtonsMessage', () => {
  it('answers with the tapped button, quoting the message', async () => {
    const book = option('book', 'Book a visit');
    const { actions, user } = renderMessage(
      <ButtonsMessage
        content={{
          type: 'buttons',
          header: 'Welcome',
          text: 'What would you like to do?',
          footer: 'Open 9 to 6',
          buttons: [book, option('hours', 'Opening hours')],
        }}
        frame={frame}
      />,
    );
    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('Open 9 to 6')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Book a visit' }));
    expect(actions.choose).toHaveBeenCalledWith(book, 'What would you like to do?');
  });
});

describe('ListMessage', () => {
  const slot = option('s-10', '10:00 AM', 'Dr. Rao');
  const content = {
    type: 'list' as const,
    text: 'Pick a slot',
    button: 'See slots',
    sections: [{ id: 'mon', title: 'Monday', rows: [slot, option('s-11', '11:00 AM')] }],
  };

  it('opens the options, sends the picked one and closes', async () => {
    const { actions, user } = renderMessage(<ListMessage content={content} frame={frame} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'See slots' }));
    const dialog = await screen.findByRole('dialog', { name: 'See slots' });
    expect(dialog.className).toContain('MuiDialog-paper');
    await user.click(screen.getByRole('radio', { name: /10:00 AM/ }));
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(actions.choose).toHaveBeenCalledWith(slot, 'Pick a slot');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes without sending anything', async () => {
    const { actions, user } = renderMessage(<ListMessage content={content} frame={frame} />);
    await user.click(screen.getByRole('button', { name: 'See slots' }));
    await user.click(await screen.findByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(actions.choose).not.toHaveBeenCalled();
  });
});

describe('ImageMessage', () => {
  it('draws the illustration with its title, subtitle and the caption', () => {
    renderWithProviders(
      <ImageMessage
        content={{ type: 'image', image: picture, caption: 'See you then' }}
        frame={frame}
      />,
    );
    const art = screen.getByRole('img', { name: 'Your visit' });
    expect(art).toHaveTextContent('Your visitTomorrow, 10 AM');
    expect(screen.getByText('See you then')).toBeInTheDocument();
  });

  it('names an untitled picture by its icon and has no caption', () => {
    const { container } = renderWithProviders(
      <ImageMessage
        content={{ type: 'image', image: { icon: 'receipt', accent: 'slate' } }}
        frame={frame}
      />,
    );
    expect(screen.getByRole('img', { name: 'receipt' })).toHaveTextContent('');
    expect(container).toHaveTextContent('10:30 AM');
  });
});

describe('SystemNotice', () => {
  it('shows a centred notice, not a bubble', () => {
    renderWithProviders(<SystemNotice text="Messages are end-to-end encrypted" />, {
      messages: { Notice: 'Aviso' },
    });
    expect(screen.getByRole('note', { name: 'Aviso' })).toHaveTextContent(
      'Messages are end-to-end encrypted',
    );
  });
});
