import { useId, useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useFormatters, useT } from '@exyconn/i18n';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Flex,
  Stack,
  Text,
} from '@exyconn/shell/components/ui';
import { CrmEmailDirection } from '@exyconn/shell/graphql/generated';
import type { EmailMessage } from './emailTypes';
import { FoldedQuote } from './FoldedQuote';
import { splitQuoted } from './quotedText';

interface EmailMessageItemProps {
  message: EmailMessage;
  /** The newest message opens expanded, like Gmail. */
  defaultExpanded: boolean;
}

/** The text a person wrote, with the earlier mail it quotes folded behind "⋯". */
function MessageBody({ text }: Readonly<{ text: string }>) {
  const { main, quoted } = splitQuoted(text);
  return (
    <Stack spacing={1}>
      <Text size="sm" sx={{ whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>
        {main}
      </Text>
      {quoted && <FoldedQuote text={quoted} />}
    </Stack>
  );
}

/**
 * One message of a conversation as a row of its own: who sent it and when, and a preview while
 * folded; unfolded, who it went to and what it says. Every message sits at the same level.
 */
export function EmailMessageItem({ message, defaultExpanded }: Readonly<EmailMessageItemProps>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const summaryId = useId();
  const sent = message.direction === CrmEmailDirection.Out;
  const recipients = [...message.to, ...message.cc].join(', ');
  return (
    <Box component="li" sx={{ listStyle: 'none' }}>
      <Accordion disableGutters expanded={expanded} onChange={(_event, open) => setExpanded(open)}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          id={summaryId}
          sx={{ '& .MuiAccordionSummary-content': { minWidth: 0 } }}
        >
          <Stack spacing={0.25} sx={{ minWidth: 0, width: '100%' }}>
            <Flex direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                color={sent ? 'primary' : 'default'}
                label={sent ? t('Sent') : t('Received')}
              />
              <Text component="span" size="sm" weight="semibold" sx={{ overflowWrap: 'anywhere' }}>
                {message.sentByName || message.from}
              </Text>
              <Text component="span" size="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                <time dateTime={message.sentAt}>{formatDateTime(message.sentAt)}</time>
              </Text>
            </Flex>
            {!expanded && message.snippet && (
              <Text component="span" size="sm" color="text.secondary" noWrap>
                {message.snippet}
              </Text>
            )}
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1.5}>
            <Stack spacing={0.25}>
              <Text size="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                {t('From: {sender}', { sender: message.from })}
              </Text>
              {recipients && (
                <Text size="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                  {t('To: {recipients}', { recipients })}
                </Text>
              )}
            </Stack>
            <MessageBody text={message.bodyText || message.snippet} />
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
