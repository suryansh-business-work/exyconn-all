import AttachFileIcon from '@mui/icons-material/AttachFile';
import { Box, Link } from '@exyconn/shell/components/ui';

interface Attachment {
  url: string;
  name: string;
  contentType: string;
}

const linkSx = { display: 'inline-flex', alignItems: 'center', gap: 0.5 };

/**
 * Plays a recording, shows a photo, links anything else — in place, on the timeline. A
 * recording has no captions of its own; the empty track keeps the player accessible to
 * assistive tech, and the file link under it is always there to download.
 */
export function AttachmentPreview({ attachment }: Readonly<{ attachment: Attachment }>) {
  const { url, name, contentType } = attachment;
  if (contentType.startsWith('audio/')) {
    return (
      <audio
        controls
        preload="none"
        src={url}
        aria-label={name}
        style={{ width: '100%', maxWidth: 360 }}
      >
        <track kind="captions" />
      </audio>
    );
  }
  if (contentType.startsWith('video/')) {
    return (
      <video
        controls
        preload="metadata"
        src={url}
        aria-label={name}
        style={{ width: '100%', maxWidth: 420 }}
      >
        <track kind="captions" />
      </video>
    );
  }
  if (contentType.startsWith('image/')) {
    return (
      <Link href={url} target="_blank" rel="noopener noreferrer">
        <Box
          component="img"
          src={url}
          alt={name}
          loading="lazy"
          sx={{ maxWidth: 240, maxHeight: 160 }}
        />
      </Link>
    );
  }
  return (
    <Link href={url} target="_blank" rel="noopener noreferrer" sx={linkSx}>
      <AttachFileIcon fontSize="small" />
      {name}
    </Link>
  );
}
