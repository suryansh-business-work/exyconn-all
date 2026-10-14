import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatPane } from '../../../../../src/components/wa/chat/ChatPane';
import { renderWithProviders } from '../../../test-utils';
import { bundle, message } from '../wa-ui.fixtures';
import { PROBE_OPTION } from './chat-actions.probe';

const hooks = vi.hoisted(() => ({ notify: vi.fn(), confirm: vi.fn(), logError: vi.fn() }));

vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNotify: () => hooks.notify,
}));
vi.mock('@exyconn/shell/components/feedback/ConfirmProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useConfirm: () => hooks.confirm,
}));
vi.mock('@exyconn/shell/logging/portalLogger', () => ({
  portalLogger: { error: hooks.logError, warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));
vi.mock('../../../../../src/components/wa/messages/MessageView', async () => {
  const { MessageActionsProbe } = await import('./chat-actions.probe');
  return { MessageView: MessageActionsProbe };
});

function renderPane(withTrack = true) {
  const props = {
    onSend: vi.fn(),
    onChoose: vi.fn(),
    onClear: vi.fn(),
    onBack: vi.fn(),
    onTrack: withTrack ? vi.fn() : undefined,
  };
  renderWithProviders(
    <ChatPane bundle={bundle()} messages={[message('m1', Date.now())]} typing={false} {...props} />,
  );
  return { ...props, user: userEvent.setup() };
}

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    configurable: true,
    writable: true,
    value: vi.fn(),
  });
});
afterEach(() => vi.resetAllMocks());

describe('ChatPane', () => {
  it('shows the chat with the business and sends what is typed', async () => {
    const { user, onSend } = renderPane();
    expect(screen.getByRole('main', { name: 'Chat with City Clinic' })).toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: 'Type a message' }), 'hello{Enter}');
    await waitFor(() => expect(onSend).toHaveBeenCalledWith('hello'));
  });

  it('explains that attachments are not part of the demo', async () => {
    const { user } = renderPane();
    await user.click(screen.getByRole('button', { name: 'Attach' }));
    expect(hooks.notify).toHaveBeenCalledWith(
      'Attachments and voice notes are not part of this demo',
      'info',
    );
  });

  it('opens and closes the business info', async () => {
    const { user } = renderPane();
    await user.click(screen.getByRole('button', { name: 'Business info: City Clinic' }));
    expect(await screen.findByText('Business account')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('Business account')).not.toBeInTheDocument());
  });

  it('passes a tapped option to the chat', async () => {
    const { user, onChoose } = renderPane();
    await user.click(screen.getByRole('button', { name: 'probe choose' }));
    expect(onChoose).toHaveBeenCalledWith(PROBE_OPTION, 'm1');
  });

  it('opens a document, reports it, and closes it', async () => {
    const { user, onTrack } = renderPane();
    await user.click(screen.getByRole('button', { name: 'probe document' }));
    expect(await screen.findByRole('dialog', { name: /invoice\.pdf/ })).toBeInTheDocument();
    expect(onTrack).toHaveBeenCalledWith({
      type: 'DOCUMENT_OPENED',
      demoKey: 'clinic',
      label: 'invoice.pdf',
    });
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('opens a ticket QR, reports it, and closes it', async () => {
    const { user, onTrack } = renderPane();
    await user.click(screen.getByRole('button', { name: 'probe ticket' }));
    expect(await screen.findByRole('dialog', { name: 'Gate pass' })).toBeInTheDocument();
    expect(onTrack).toHaveBeenCalledWith({
      type: 'QR_OPENED',
      demoKey: 'clinic',
      label: 'Gate pass',
    });
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('still opens attachments when nothing tracks them', async () => {
    const { user } = renderPane(false);
    await user.click(screen.getByRole('button', { name: 'probe ticket' }));
    expect(await screen.findByRole('dialog', { name: 'Gate pass' })).toBeInTheDocument();
  });

  it('explains a link that would leave the demo', async () => {
    const { user } = renderPane();
    await user.click(screen.getByRole('button', { name: 'probe external' }));
    expect(hooks.notify).toHaveBeenCalledWith('In a live setup this opens {target}', 'info', {
      target: 'https://example.com',
    });
  });

  it('clears the chat only after the destructive confirm', async () => {
    hooks.confirm.mockResolvedValue(true);
    const { user, onClear } = renderPane();
    await user.click(screen.getByRole('button', { name: 'Chat menu' }));
    await user.click(screen.getByRole('menuitem', { name: 'Clear chat' }));
    await waitFor(() => expect(onClear).toHaveBeenCalledTimes(1));
    expect(hooks.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Clear this chat?',
        confirmText: 'Clear chat',
        destructive: true,
      }),
    );
  });

  it('keeps the chat when the confirm is declined', async () => {
    hooks.confirm.mockResolvedValue(false);
    const { user, onClear } = renderPane();
    await user.click(screen.getByRole('button', { name: 'Chat menu' }));
    await user.click(screen.getByRole('menuitem', { name: 'Clear chat' }));
    await waitFor(() => expect(hooks.confirm).toHaveBeenCalledTimes(1));
    expect(onClear).not.toHaveBeenCalled();
  });

  it('logs a confirm that fails', async () => {
    const failure = new Error('dialog broke');
    hooks.confirm.mockRejectedValue(failure);
    const { user, onClear } = renderPane();
    await user.click(screen.getByRole('button', { name: 'Chat menu' }));
    await user.click(screen.getByRole('menuitem', { name: 'Clear chat' }));
    await waitFor(() =>
      expect(hooks.logError).toHaveBeenCalledWith('wa-demo: clear chat failed', failure),
    );
    expect(onClear).not.toHaveBeenCalled();
  });
});
