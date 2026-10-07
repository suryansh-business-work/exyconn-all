import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VoiceNoteControls } from '../../../../../../src/pages/chat/forms/chat-reply/VoiceNoteControls';
import { renderWithProviders } from '../../../../test-utils';

describe('VoiceNoteControls', () => {
  it('shows how long the note is in minutes and seconds', () => {
    renderWithProviders(<VoiceNoteControls seconds={65} onStop={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('Recording 1:05');
  });

  it('starts at 0:00', () => {
    renderWithProviders(<VoiceNoteControls seconds={0} onStop={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('Recording 0:00');
  });

  it('keeps the note or throws it away', async () => {
    const onStop = vi.fn();
    const onCancel = vi.fn();
    renderWithProviders(<VoiceNoteControls seconds={9} onStop={onStop} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole('button', { name: 'Stop and attach' }));
    expect(onStop).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
