import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PendingAttachments } from '../../../../../../src/pages/chat/forms/chat-reply/PendingAttachments';
import { renderWithProviders } from '../../../../test-utils';

const FILES = [
  { id: 'f1', name: 'photo.png', data: 'data:image/png;base64,AAAA', size: 2048 },
  { id: 'f2', name: 'clip.mp4', data: 'data:video/mp4;base64,AAAA', size: 3 * 1024 * 1024 },
  { id: 'f3', name: 'voice-note.webm', data: 'data:audio/webm;base64,AAAA', size: 512 },
];

describe('PendingAttachments', () => {
  it('shows nothing while no file is attached', () => {
    const { container } = renderWithProviders(<PendingAttachments files={[]} onRemove={vi.fn()} />);
    expect(container.querySelector('.MuiChip-root')).toBeNull();
  });

  it('lists each file with its size and an icon for its kind', () => {
    renderWithProviders(<PendingAttachments files={FILES} onRemove={vi.fn()} />);

    expect(screen.getByText('photo.png · 2.0 KB')).toBeInTheDocument();
    expect(screen.getByText('clip.mp4 · 3.0 MB')).toBeInTheDocument();
    expect(screen.getByText('voice-note.webm · 512 B')).toBeInTheDocument();
    expect(screen.getByTestId('ImageIcon')).toBeInTheDocument();
    expect(screen.getByTestId('MovieIcon')).toBeInTheDocument();
    expect(screen.getByTestId('MicIcon')).toBeInTheDocument();
  });

  it('removes the file whose cross is pressed', async () => {
    const onRemove = vi.fn();
    renderWithProviders(<PendingAttachments files={FILES} onRemove={onRemove} />);

    await userEvent.click(screen.getByLabelText('Remove clip.mp4'));
    expect(onRemove).toHaveBeenCalledWith('f2');
  });
});
