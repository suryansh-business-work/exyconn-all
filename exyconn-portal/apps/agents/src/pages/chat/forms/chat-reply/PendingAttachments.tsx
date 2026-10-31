import { useT } from '@exyconn/i18n';
import CancelIcon from '@mui/icons-material/Cancel';
import ImageIcon from '@mui/icons-material/Image';
import MicIcon from '@mui/icons-material/Mic';
import MovieIcon from '@mui/icons-material/Movie';
import { Chip, Flex } from '@exyconn/shell/components/ui';
import { formatBytes } from '@exyconn/shell/utils/file';
import type { ChatReplyFile } from './chat-reply.types';

function KindIcon({ data }: Readonly<{ data: string }>) {
  if (data.startsWith('data:audio/')) {
    return <MicIcon />;
  }
  if (data.startsWith('data:video/')) {
    return <MovieIcon />;
  }
  return <ImageIcon />;
}

/** The files waiting to go with the reply, each removable before sending. */
export function PendingAttachments({
  files,
  onRemove,
}: Readonly<{ files: ChatReplyFile[]; onRemove: (id: string) => void }>) {
  const t = useT();
  if (files.length === 0) {
    return null;
  }
  return (
    <Flex direction="row" flexWrap="wrap" gap={1} sx={{ px: 2, pt: 1.5 }}>
      {files.map((file) => (
        <Chip
          key={file.id}
          icon={<KindIcon data={file.data} />}
          label={`${file.name} · ${formatBytes(file.size)}`}
          onDelete={() => onRemove(file.id)}
          deleteIcon={<CancelIcon aria-label={t('Remove {name}', { name: file.name })} />}
        />
      ))}
    </Flex>
  );
}
