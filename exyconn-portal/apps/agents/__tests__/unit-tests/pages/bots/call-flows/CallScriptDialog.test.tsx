import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CallScriptDialog } from '../../../../../src/pages/bots/call-flows/CallScriptDialog';
import { renderWithProviders } from '../../../test-utils';

describe('CallScriptDialog', () => {
  it('shows the script the voice agent follows, and closes', async () => {
    const onClose = vi.fn();
    renderWithProviders(
      <CallScriptDialog open script={'Greet the caller.\nOffer Tuesday.'} onClose={onClose} />,
    );
    const dialog = screen.getByRole('dialog', { name: 'Call script' });
    expect(dialog).toHaveTextContent('Greet the caller. Offer Tuesday.');
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders nothing while closed', () => {
    renderWithProviders(<CallScriptDialog open={false} script="Hidden" onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
