import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useApolloClient } from '@apollo/client/react';
import { useFormatters, useT } from '@exyconn/i18n';
import {
  Chip,
  Flex,
  Heading,
  IconButton,
  Skeleton,
  Stack,
  Text,
  Tooltip,
} from '@exyconn/shell/components/ui';
import {
  CrmMailThreadPreviewFragmentDoc,
  type CrmMailThreadPreviewFragment,
} from '@exyconn/shell/graphql/generated';
import type { OpenThread } from '../useMailRoute';

interface ReaderPreviewProps {
  open: OpenThread;
  onBack: () => void;
}

/** How many body lines stand in for the messages while they load. */
const BODY_LINES = ['first', 'second', 'third', 'fourth'];

/**
 * The conversation while its messages load from Gmail: the subject, sender and preview the
 * list already has, at once, with placeholders only where the messages will be.
 */
export function ReaderPreview({ open, onBack }: Readonly<ReaderPreviewProps>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const client = useApolloClient();
  const row = client.readFragment<CrmMailThreadPreviewFragment>({
    id: client.cache.identify({
      __typename: 'CrmMailThreadSummary',
      id: `${open.accountId}:${open.threadId}`,
    }),
    fragment: CrmMailThreadPreviewFragmentDoc,
  });
  return (
    <Stack spacing={2} aria-busy="true" aria-label={t('Opening the conversation')}>
      <Flex direction="row" spacing={0.5} alignItems="center">
        <Tooltip title={t('Back to the list')}>
          <IconButton onClick={onBack} aria-label={t('Back to the list')}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
      </Flex>
      {row ? (
        <>
          <Heading level={2} sx={{ typography: 'h6', overflowWrap: 'anywhere' }}>
            {row.subject || t('(no subject)')}
          </Heading>
          <Flex direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Chip size="small" label={row.mailbox} />
          </Flex>
          <Flex direction="row" spacing={1} justifyContent="space-between" alignItems="baseline">
            <Text size="sm" weight="semibold" sx={{ overflowWrap: 'anywhere' }}>
              {row.fromName || row.fromAddress}
            </Text>
            <Text size="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
              <time dateTime={row.lastAt}>{formatDateTime(row.lastAt)}</time>
            </Text>
          </Flex>
          <Text size="sm" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
            {row.snippet}
          </Text>
        </>
      ) : (
        <Skeleton variant="text" width="60%" height={32} />
      )}
      <Stack spacing={1}>
        {BODY_LINES.map((line) => (
          <Skeleton key={line} variant="text" />
        ))}
      </Stack>
    </Stack>
  );
}
