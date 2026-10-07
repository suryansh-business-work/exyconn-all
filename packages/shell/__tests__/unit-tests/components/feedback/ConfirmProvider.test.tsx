import { describe, expect, it, vi } from 'vitest';
import { render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '@exyconn/i18n';
import { ConfirmProvider, useConfirm } from '@/components/feedback/ConfirmProvider';

type ConfirmArgs = Parameters<ReturnType<typeof useConfirm>>[0];

function Asker({
  options,
  onAnswer,
}: Readonly<{ options: ConfirmArgs; onAnswer: (ok: boolean) => void }>) {
  const confirm = useConfirm();
  return (
    <button type="button" onClick={() => confirm(options).then(onAnswer)}>
      ask
    </button>
  );
}

function renderAsker(options: ConfirmArgs, messages: Record<string, string> = {}) {
  const onAnswer = vi.fn();
  render(
    <I18nProvider locale="en" messages={messages}>
      <ConfirmProvider>
        <Asker options={options} onAnswer={onAnswer} />
      </ConfirmProvider>
    </I18nProvider>,
  );
  return onAnswer;
}

describe('ConfirmProvider', () => {
  it('asks with the defaults and resolves true on Confirm', async () => {
    const user = userEvent.setup();
    const onAnswer = renderAsker({ message: 'Archive this lead?' });

    await user.click(screen.getByRole('button', { name: 'ask' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Please confirm');
    expect(dialog).toHaveTextContent('Archive this lead?');
    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmButton).toHaveClass('MuiButton-colorPrimary');

    await user.click(confirmButton);
    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith(true));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('resolves false on Cancel', async () => {
    const user = userEvent.setup();
    const onAnswer = renderAsker({ message: 'Leave the page?' });

    await user.click(screen.getByRole('button', { name: 'ask' }));
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith(false));
  });

  it('resolves false when the dialog is dismissed with Escape', async () => {
    const user = userEvent.setup();
    const onAnswer = renderAsker({ message: 'Leave the page?' });

    await user.click(screen.getByRole('button', { name: 'ask' }));
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');

    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith(false));
  });

  it('translates a custom destructive prompt with its values', async () => {
    const user = userEvent.setup();
    const onAnswer = renderAsker(
      {
        title: 'Delete {kind}',
        titleValues: { kind: 'lead' },
        message: 'Delete "{name}"?',
        messageValues: { name: 'Acme' },
        confirmText: 'Delete',
        cancelText: 'Keep',
        destructive: true,
      },
      { 'Delete {kind}': 'Eliminar {kind}', Delete: 'Eliminar', Keep: 'Conservar' },
    );

    await user.click(screen.getByRole('button', { name: 'ask' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Eliminar lead');
    expect(dialog).toHaveTextContent('Delete "Acme"?');
    expect(screen.getByRole('button', { name: 'Conservar' })).toBeInTheDocument();
    const destroy = screen.getByRole('button', { name: 'Eliminar' });
    expect(destroy).toHaveClass('MuiButton-colorError');

    await user.click(destroy);
    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith(true));
  });

  it('shows no body text for an empty message', async () => {
    const user = userEvent.setup();
    renderAsker({ message: '' });

    await user.click(screen.getByRole('button', { name: 'ask' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog.querySelector('.MuiDialogContentText-root')).toBeEmptyDOMElement();
  });
});

describe('useConfirm', () => {
  it('refuses to run outside a ConfirmProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useConfirm())).toThrow(
      'useConfirm must be used within a ConfirmProvider',
    );
    vi.restoreAllMocks();
  });
});
