import { useState } from 'react';
import { useFormatters, useT } from '@exyconn/i18n';
import { Avatar, Box, ButtonBase, Collapse, Flex, Stack, Text } from '@exyconn/shell/components/ui';
import { initialsOf } from '../../../records/detail/initials';
import { senderOf, type MailMessage } from '../mailCompose';
import { MailBody } from './MailBody';
import { MailAttachments } from './MailAttachments';

interface MailMessageItemProps {
  accountId: string;
  message: MailMessage;
  /** The newest message starts open; earlier ones show one line until opened. */
  defaultOpen: boolean;
}

/** Who else a message went to, e.g. "To: a@x.io · Cc: b@y.io". */
function recipientLine(message: MailMessage, t: ReturnType<typeof useT>) {
  const parts = [
    message.to.length > 0 ? t('To: {list}', { list: message.to.join(', ') }) : '',
    message.cc.length > 0 ? t('Cc: {list}', { list: message.cc.join(', ') }) : '',
    message.bcc.length > 0 ? t('Bcc: {list}', { list: message.bcc.join(', ') }) : '',
  ];
  return parts.filter(Boolean).join(' · ');
}

/** One message of the open conversation: its header, and its body and files when opened. */
export function MailMessageItem({
  accountId,
  message,
  defaultOpen,
}: Readonly<MailMessageItemProps>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const [open, setOpen] = useState(defaultOpen);
  const sender = senderOf(message);
  return (
    <Box
      component="li"
      sx={{
        listStyle: 'none',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        mb: 1,
        bgcolor: open ? 'background.paper' : 'transparent',
      }}
    >
      <ButtonBase
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        sx={{ width: '100%', textAlign: 'left', display: 'block', borderRadius: 1, p: 1.5 }}
      >
        <Flex direction="row" spacing={1.5} alignItems="flex-start">
          <Avatar alt="" aria-hidden sx={{ width: 32, height: 32, typography: 'caption' }}>
            {initialsOf(message.fromName || message.fromAddress)}
          </Avatar>
          <Stack spacing={0.5} sx={{ minWidth: 0, flexGrow: 1 }}>
            <Flex direction="row" spacing={1} justifyContent="space-between" alignItems="baseline">
              <Text size="sm" weight="semibold" sx={{ overflowWrap: 'anywhere' }}>
                {sender}
              </Text>
              <Text size="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                <time dateTime={message.sentAt}>{formatDateTime(message.sentAt)}</time>
              </Text>
            </Flex>
            <Text
              size="caption"
              color="text.secondary"
              noWrap={!open}
              sx={{ overflowWrap: 'anywhere' }}
            >
              {open ? recipientLine(message, t) : message.text}
            </Text>
          </Stack>
        </Flex>
      </ButtonBase>
      <Collapse in={open} unmountOnExit>
        <Stack spacing={1.5} sx={{ px: 1.5, pb: 1.5 }}>
          <MailBody
            html={message.html}
            text={message.text}
            label={t('Message from {sender}', { sender })}
          />
          <MailAttachments accountId={accountId} attachments={message.attachments} />
        </Stack>
      </Collapse>
    </Box>
  );
}
