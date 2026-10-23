import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReplyIcon from '@mui/icons-material/Reply';
import { useT } from '@exyconn/i18n';
import { Button, Chip, Flex, IconButton, Stack, Text, Tooltip } from '@exyconn/shell/components/ui';
import { EmailMessageItem } from './EmailMessageItem';
import type { EmailThread } from './emailTypes';
import { useMessageCount } from './useMessageCount';

interface EmailThreadViewProps {
  thread: EmailThread;
  onBack: () => void;
  onReply: (thread: EmailThread) => void;
}

/**
 * One conversation opened from the list, as Gmail shows it: the subject on top, then every
 * message oldest first at the same level, the newest unfolded, and Reply in the same thread.
 */
export function EmailThreadView({ thread, onBack, onReply }: Readonly<EmailThreadViewProps>) {
  const t = useT();
  const countLabel = useMessageCount();
  const subjectId = `thread-subject-${thread.accountId}-${thread.threadId}`;
  const lastIndex = thread.messages.length - 1;
  return (
    <Stack component="article" spacing={1.5} aria-labelledby={subjectId}>
      <Flex direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
        <Tooltip title={t('Back to all emails')}>
          <IconButton onClick={onBack} aria-label={t('Back to all emails')}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Text
          component="h3"
          size="lg"
          weight="semibold"
          id={subjectId}
          sx={{ m: 0, minWidth: 0, overflowWrap: 'anywhere' }}
        >
          {thread.subject || t('(no subject)')}
        </Text>
      </Flex>
      <Flex direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Chip size="small" variant="outlined" label={countLabel(thread.messages.length)} />
        {thread.mailbox && <Chip size="small" color="info" label={thread.mailbox} />}
      </Flex>
      <Stack component="ol" spacing={1} sx={{ m: 0, p: 0 }}>
        {thread.messages.map((message, position) => (
          <EmailMessageItem
            key={message.id}
            message={message}
            defaultExpanded={position === lastIndex}
          />
        ))}
      </Stack>
      <Button
        variant="contained"
        startIcon={<ReplyIcon />}
        onClick={() => onReply(thread)}
        sx={{ alignSelf: 'flex-start' }}
      >
        {t('Reply')}
      </Button>
    </Stack>
  );
}
