import { useT } from '@exyconn/i18n';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DownloadIcon from '@mui/icons-material/Download';
import { Button, Flex } from '@exyconn/shell/components/ui';

export interface ConversationActionsProps {
  /** True when the chat is already assigned to the signed-in person. */
  isMine: boolean;
  isClosed: boolean;
  claiming: boolean;
  onClaim: () => void;
  onClose: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

/** Claim, Close chat, Download conversation and Delete, in the conversation's header. */
export function ConversationActions({
  isMine,
  isClosed,
  claiming,
  onClaim,
  onClose,
  onDownload,
  onDelete,
}: Readonly<ConversationActionsProps>) {
  const t = useT();

  return (
    <Flex direction="row" flexWrap="wrap" gap={1}>
      {!isMine && !isClosed && (
        <Button
          variant="contained"
          startIcon={<AssignmentIndIcon />}
          onClick={onClaim}
          disabled={claiming}
        >
          {t('Claim')}
        </Button>
      )}
      {!isClosed && (
        <Button variant="outlined" color="success" startIcon={<DoneAllIcon />} onClick={onClose}>
          {t('Close chat')}
        </Button>
      )}
      <Button variant="outlined" startIcon={<DownloadIcon />} onClick={onDownload}>
        {t('Download conversation')}
      </Button>
      <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={onDelete}>
        {t('Delete')}
      </Button>
    </Flex>
  );
}
