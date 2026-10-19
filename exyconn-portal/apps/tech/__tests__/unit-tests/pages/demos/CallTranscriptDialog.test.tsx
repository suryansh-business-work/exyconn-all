import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CallTranscriptDialog } from '../../../../src/pages/demos/CallTranscriptDialog';
import { renderWithProviders } from '../../test-utils';
import { callRow } from './calling-bot.fixtures';

describe('CallTranscriptDialog', () => {
  it('stays closed without a call', () => {
    renderWithProviders(<CallTranscriptDialog call={null} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('lists every turn in order, naming who spoke', () => {
    renderWithProviders(<CallTranscriptDialog call={callRow()} onClose={vi.fn()} />);
    const turns = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(turns.map((turn) => turn.textContent)).toEqual([
      'BotHello, Smile Dental.',
      'CallerI need a check-up.',
    ]);
    expect(screen.queryByText('Nothing was said.')).not.toBeInTheDocument();
    expect(screen.queryByText(/^Ended:/)).not.toBeInTheDocument();
  });

  it('says when nothing was said, and why the call ended', async () => {
    const onClose = vi.fn();
    renderWithProviders(
      <CallTranscriptDialog
        call={callRow({ transcript: [], endReason: 'Caller hung up' })}
        onClose={onClose}
      />,
    );
    expect(screen.getByText('Nothing was said.')).toBeInTheDocument();
    expect(screen.getByText('Ended: Caller hung up')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
