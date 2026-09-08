import { Box, Flex, IconButton, Link, Text } from '@exyconn/shell/components/ui';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
/**
 * The shape this list draws. Structural rather than the generated fragment so the same
 * component renders a saved attachment and one that has been uploaded but not yet sent
 * with its comment.
 */
export interface AttachmentView {
  url: string;
  name: string;
  contentType: string;
  uploadedByName?: string;
}

interface AttachmentListProps {
  files: readonly AttachmentView[];
  /** Omit to render the list read-only — a comment's files cannot be taken off again. */
  onRemove?: (file: AttachmentView) => void;
  emptyText?: string;
}

const isImage = (contentType: string) => contentType.startsWith('image/');

/** One file: an image renders as its own thumbnail, anything else as a PDF glyph. */
function AttachmentThumb({ file }: Readonly<{ file: AttachmentView }>) {
  if (isImage(file.contentType)) {
    return (
      <Box
        component="img"
        src={file.url}
        alt={file.name}
        sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 1 }}
      />
    );
  }
  return (
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: 1,
        bgcolor: 'action.hover',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <PictureAsPdfIcon fontSize="small" color="error" />
    </Box>
  );
}

/** The files on a ticket or a comment, as a link list with a thumbnail apiece. */
export function AttachmentList({ files, onRemove, emptyText }: Readonly<AttachmentListProps>) {
  if (files.length === 0) {
    return emptyText ? (
      <Text size="sm" color="text.secondary">
        {emptyText}
      </Text>
    ) : null;
  }

  return (
    <Flex direction="column" spacing={1}>
      {files.map((file) => (
        <Flex key={file.url} direction="row" alignItems="center" spacing={1.25}>
          <AttachmentThumb file={file} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Link href={file.url} target="_blank" rel="noreferrer" underline="hover">
              <Text size="sm" sx={{ wordBreak: 'break-all' }}>
                {file.name}
              </Text>
            </Link>
            {file.uploadedByName ? (
              <Text size="caption" color="text.secondary">
                Added by {file.uploadedByName}
              </Text>
            ) : null}
          </Box>
          {onRemove ? (
            <IconButton
              size="small"
              aria-label={`Remove ${file.name}`}
              onClick={() => onRemove(file)}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          ) : null}
        </Flex>
      ))}
    </Flex>
  );
}
