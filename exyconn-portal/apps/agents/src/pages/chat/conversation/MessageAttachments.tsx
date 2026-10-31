import { HTTP_URL } from '@exyconn/regex';
import { Box, Flex, Link } from '@exyconn/shell/components/ui';
import { WebsiteChatAttachmentKind } from '@exyconn/shell/graphql/generated';
import type { ChatMessage } from '../socket/chatSocket.types';

type Attachment = ChatMessage['attachments'][number];

const MEDIA_SX = { display: 'block', maxWidth: '100%', width: 260, borderRadius: 1 } as const;

/** Uploaded files are served from the media host; a reply still being sent shows its data URL. */
const safeSource = (url: string): boolean => HTTP_URL.test(url) || url.startsWith('data:');

/**
 * One file, played or shown inline. Visitors' clips and voice notes come with no captions file,
 * so the captions track is empty and the file name stays as the fallback text.
 */
function AttachmentView({ attachment }: Readonly<{ attachment: Attachment }>) {
  if (attachment.kind === WebsiteChatAttachmentKind.Video) {
    return (
      <Box component="video" controls preload="metadata" src={attachment.url} sx={MEDIA_SX}>
        <track kind="captions" />
        {attachment.name}
      </Box>
    );
  }
  if (attachment.kind === WebsiteChatAttachmentKind.Audio) {
    return (
      <Box
        component="audio"
        controls
        preload="metadata"
        src={attachment.url}
        sx={{ display: 'block', maxWidth: '100%' }}
      >
        <track kind="captions" />
        {attachment.name}
      </Box>
    );
  }
  return (
    <Link href={attachment.url} target="_blank" rel="noopener noreferrer">
      <Box
        component="img"
        src={attachment.url}
        alt={attachment.name}
        loading="lazy"
        sx={MEDIA_SX}
      />
    </Link>
  );
}

/** The images, videos and voice notes sent with a message. */
export function MessageAttachments({ attachments }: Readonly<{ attachments: Attachment[] }>) {
  const shown = attachments.filter((attachment) => safeSource(attachment.url));
  if (shown.length === 0) {
    return null;
  }
  return (
    <Flex direction="column" spacing={1} sx={{ mt: 0.5 }}>
      {shown.map((attachment) => (
        <AttachmentView
          key={`${attachment.name}-${attachment.url.slice(-48)}`}
          attachment={attachment}
        />
      ))}
    </Flex>
  );
}
