import DescriptionIcon from '@mui/icons-material/Description';
import { borderWidth, Box, Stack, Text } from '@exyconn/ui';

/** What a rendered attachment needs. Matches the generated `TicketAttachmentFields`. */
export interface AttachmentItem {
  url: string;
  name: string;
  contentType: string;
}

const THUMB = 56;

const isImage = (item: AttachmentItem) => item.contentType.startsWith('image/');

interface AttachmentTileProps {
  item: AttachmentItem;
}

/** One attachment: a thumbnail for a picture, a named link for anything else. */
function AttachmentTile({ item }: Readonly<AttachmentTileProps>) {
  return (
    <Box
      component="a"
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 0.75,
        borderRadius: 1,
        border: `${borderWidth.hairline}px solid`,
        borderColor: 'divider',
        textDecoration: 'none',
        color: 'text.primary',
        maxWidth: 260,
      }}
    >
      {isImage(item) ? (
        <Box
          component="img"
          src={item.url}
          alt={item.name}
          sx={{ width: THUMB, height: THUMB, objectFit: 'cover', borderRadius: 1 }}
        />
      ) : (
        <DescriptionIcon color="action" />
      )}
      <Text size="sm" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.name}
      </Text>
    </Box>
  );
}

interface AttachmentListProps {
  items: readonly AttachmentItem[];
}

/** The files posted with a message. Renders nothing when there are none. */
export function AttachmentList({ items }: Readonly<AttachmentListProps>) {
  if (items.length === 0) {
    return null;
  }
  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mt: 1 }}>
      {items.map((item) => (
        <AttachmentTile key={item.url} item={item} />
      ))}
    </Stack>
  );
}
