import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ChatMessage } from '@exyconn/wa-flow';
import { ChatWidget } from '../../../src/widget/ChatWidget';
import type { WidgetChat } from '../../../src/widget/useWidgetChat';
import { renderWithProviders } from '../test-utils';
import { botSays, demoProfile, documentAttachment } from './widget.fixtures';

const original = Element.prototype.scrollIntoView;

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  Element.prototype.scrollIntoView = original;
});

function chat(messages: ChatMessage[] = []) {
  const demo = demoProfile();
  return {
    bundle: { demo, workflows: [], revision: 'r1' },
    user: { id: 'u-1', firstName: 'Asha', fullName: 'Asha Nair', email: '', phone: '' },
    aiConfigured: false,
    messages,
    typing: false,
    send: vi.fn(),
    choose: vi.fn(),
    restart: vi.fn(),
    startWorkflow: vi.fn(),
  } satisfies WidgetChat;
}

describe('ChatWidget', () => {
  it("is a region named for the business, with the conversation, composer and credit", async () => {
    const live = chat([botSays({ type: 'text', text: 'Welcome!' })]);
    renderWithProviders(<ChatWidget chat={live} height={500} />);
    const panel = screen.getByRole('region', { name: 'Chat with Green Grocer' });
    expect(panel).toHaveStyle({ height: '500px' });
    expect(within(panel).getByText('Welcome!')).toBeInTheDocument();
    expect(within(panel).getByText('AI agent by Exyconn')).toBeInTheDocument();
    await userEvent.type(within(panel).getByRole('textbox', { name: 'Type a message' }), 'Hi{Enter}');
    expect(live.send).toHaveBeenCalledWith('Hi');
    await userEvent.click(within(panel).getByRole('button', { name: 'Start over' }));
    expect(live.restart).toHaveBeenCalledTimes(1);
  });

  it('fills its parent by default and passes taps on to the chat', async () => {
    const yes = { id: 'yes', title: 'Yes', ref: { workflow: 'w', node: 'n', handle: 'yes' } };
    const live = chat([botSays({ type: 'buttons', text: 'Book?', buttons: [yes] })]);
    renderWithProviders(<ChatWidget chat={live} />);
    expect(screen.getByRole('region', { name: 'Chat with Green Grocer' })).toHaveStyle({
      height: '100%',
    });
    await userEvent.click(screen.getByRole('button', { name: 'Yes' }));
    expect(live.choose).toHaveBeenCalledWith(yes, 'Book?');
  });

  it('says where a link or call button would go on a real website', async () => {
    renderWithProviders(
      <ChatWidget
        chat={chat([
          botSays({
            type: 'cta',
            text: 'Reach us',
            actions: [
              { kind: 'url', title: 'Website', url: 'https://grocer.example' },
              { kind: 'call', title: 'Call', phone: '+91 90000 00000' },
            ],
          }),
        ])}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Website' }));
    expect(
      await screen.findByText('On your website this button opens https://grocer.example.'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Call' }));
    expect(
      await screen.findByText('On your website this button calls +91 90000 00000.'),
    ).toBeInTheDocument();
  });

  it('opens a document in the viewer and closes it again', async () => {
    renderWithProviders(
      <ChatWidget chat={chat([botSays({ type: 'document', document: documentAttachment() })])} />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Open PDF' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Repair estimate')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('offers Close when the host can minimise it', async () => {
    const onClose = vi.fn();
    renderWithProviders(<ChatWidget chat={chat()} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Close chat' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
