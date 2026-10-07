import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { WebsiteChatAttachmentKind } from '@exyconn/shell/graphql/generated';
import { MessageAttachments } from '../../../../../src/pages/chat/conversation/MessageAttachments';
import { renderWithProviders } from '../../../test-utils';

const file = (kind: WebsiteChatAttachmentKind, name: string, url: string) => ({
  kind,
  name,
  url,
  size: 100,
});

describe('MessageAttachments', () => {
  it('plays clips and voice notes inline, with an empty captions track', () => {
    const { container } = renderWithProviders(
      <MessageAttachments
        attachments={[
          file(WebsiteChatAttachmentKind.Video, 'clip.mp4', 'https://cdn.exyconn.com/clip.mp4'),
          file(WebsiteChatAttachmentKind.Audio, 'note.webm', 'https://cdn.exyconn.com/note.webm'),
        ]}
      />,
    );

    const video = container.querySelector('video');
    const audio = container.querySelector('audio');
    expect(video).toHaveAttribute('src', 'https://cdn.exyconn.com/clip.mp4');
    expect(video).toHaveAttribute('controls');
    expect(video).toHaveTextContent('clip.mp4');
    expect(video?.querySelector('track')).toHaveAttribute('kind', 'captions');
    expect(audio).toHaveAttribute('src', 'https://cdn.exyconn.com/note.webm');
    expect(audio).toHaveTextContent('note.webm');
  });

  it('shows pictures linked to the full file, including a reply still being sent', () => {
    renderWithProviders(
      <MessageAttachments
        attachments={[
          file(WebsiteChatAttachmentKind.Image, 'deck.png', 'https://cdn.exyconn.com/deck.png'),
          file(WebsiteChatAttachmentKind.Image, 'draft.png', 'data:image/png;base64,AAAA'),
        ]}
      />,
    );

    const deck = screen.getByRole('img', { name: 'deck.png' });
    expect(deck).toHaveAttribute('src', 'https://cdn.exyconn.com/deck.png');
    expect(deck.closest('a')).toHaveAttribute('href', 'https://cdn.exyconn.com/deck.png');
    expect(deck.closest('a')).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('img', { name: 'draft.png' })).toHaveAttribute(
      'src',
      'data:image/png;base64,AAAA',
    );
  });

  it('drops files from addresses that are not web or data URLs', () => {
    renderWithProviders(
      <MessageAttachments
        attachments={[
          file(WebsiteChatAttachmentKind.Image, 'evil.png', 'javascript:alert(1)'),
          file(WebsiteChatAttachmentKind.Image, 'ok.png', 'https://cdn.exyconn.com/ok.png'),
        ]}
      />,
    );

    expect(screen.queryByRole('img', { name: 'evil.png' })).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'ok.png' })).toBeInTheDocument();
  });

  it('renders nothing when no file can be shown', () => {
    const { container } = renderWithProviders(
      <MessageAttachments
        attachments={[file(WebsiteChatAttachmentKind.Video, 'x.mp4', 'ftp://host/x.mp4')]}
      />,
    );
    expect(container.querySelector('video')).toBeNull();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
