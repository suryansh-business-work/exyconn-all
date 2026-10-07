import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AttachmentList, type AttachmentView } from '../../../../../src/pages/projects/attachments';
import { renderWithProviders } from '../../../test-utils';

const SCREENSHOT: AttachmentView = {
  url: 'https://ik.example/shot.png',
  name: 'shot.png',
  contentType: 'image/png',
  uploadedByName: 'Asha Rao',
};
const SPEC: AttachmentView = {
  url: 'https://ik.example/spec.pdf',
  name: 'spec.pdf',
  contentType: 'application/pdf',
};

describe('AttachmentList', () => {
  it('says what to say when nothing is attached', () => {
    renderWithProviders(<AttachmentList files={[]} emptyText="Nothing attached yet." />);

    expect(screen.getByText('Nothing attached yet.')).toBeInTheDocument();
  });

  it('shows nothing at all for an empty list with no empty text', () => {
    renderWithProviders(<AttachmentList files={[]} />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByText(/./)).not.toBeInTheDocument();
  });

  it('draws an image as its own thumbnail and links every file in a new tab', () => {
    renderWithProviders(<AttachmentList files={[SCREENSHOT, SPEC]} />);

    expect(screen.getByRole('img', { name: 'shot.png' })).toHaveAttribute('src', SCREENSHOT.url);
    expect(screen.queryByRole('img', { name: 'spec.pdf' })).not.toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'spec.pdf' });
    expect(link).toHaveAttribute('href', SPEC.url);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });

  it('says who added a file when it is known', () => {
    renderWithProviders(<AttachmentList files={[SCREENSHOT, SPEC]} />);

    expect(screen.getAllByText(/Added by/)).toHaveLength(1);
    expect(screen.getByText('Added by Asha Rao')).toBeInTheDocument();
  });

  it('offers to remove a file only when the list is editable', async () => {
    const onRemove = vi.fn();
    const { rerender } = renderWithProviders(
      <AttachmentList files={[SCREENSHOT, SPEC]} onRemove={onRemove} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Remove spec.pdf' }));
    expect(onRemove).toHaveBeenCalledWith(SPEC);

    rerender(<AttachmentList files={[SCREENSHOT, SPEC]} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
