import type { ReactElement } from 'react';
import ReplyIcon from '@mui/icons-material/Reply';
import ReplyAllIcon from '@mui/icons-material/ReplyAll';
import ForwardIcon from '@mui/icons-material/Forward';
import { useT } from '@exyconn/i18n';
import { Box, Button, Flex, Heading } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import {
  ComposeEmailForm,
  type ComposeEmailContext,
} from '../../../records/detail/forms/compose-email';
import type { ReplyMode } from '../mailCompose';

interface ReplyAreaProps {
  /** The reply being written; null shows the reply buttons instead. */
  compose: ComposeEmailContext | null;
  /** Reply all is offered only when the newest message went to more than one person. */
  canReplyAll: boolean;
  onStart: (mode: ReplyMode) => void;
  onSent: () => void;
  onCancel: () => void;
}

const BUTTONS: ReadonlyArray<{ mode: ReplyMode; label: string; icon: ReactElement }> = [
  { mode: 'reply', label: 'Reply', icon: <ReplyIcon /> },
  { mode: 'replyAll', label: 'Reply all', icon: <ReplyAllIcon /> },
  { mode: 'forward', label: 'Forward', icon: <ForwardIcon /> },
];

/**
 * Reply, Reply all and Forward under the conversation, and the shared CRM compose form in
 * their place once one is chosen. A reply goes out through the CRM's send path, so it also
 * lands on the contact's timeline.
 */
export function ReplyArea({
  compose,
  canReplyAll,
  onStart,
  onSent,
  onCancel,
}: Readonly<ReplyAreaProps>) {
  const t = useT();
  if (compose) {
    const title = compose.threadId ? t('Reply') : t('Forward');
    return (
      <Box sx={panel} component="section" aria-label={title}>
        <Heading level={3} sx={{ typography: 'subtitle1', mb: 2 }}>
          {title}
        </Heading>
        <ComposeEmailForm context={compose} onDone={onSent} onCancel={onCancel} />
      </Box>
    );
  }
  const buttons = BUTTONS.filter((button) => canReplyAll || button.mode !== 'replyAll');
  return (
    <Flex direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {buttons.map((button) => (
        <Button
          key={button.mode}
          variant="outlined"
          startIcon={button.icon}
          onClick={() => onStart(button.mode)}
        >
          {t(button.label)}
        </Button>
      ))}
    </Flex>
  );
}
