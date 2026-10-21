import { useT } from '@exyconn/i18n';
import { Button, Card, Stack, Text } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { SharedItemSignature } from '@exyconn/shell/components/clients/SharedItemSignature';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ArticleIcon from '@mui/icons-material/ArticleOutlined';
import type { ClientHubSharedItemsQuery } from '@exyconn/shell/graphql/generated';

export type HubSharedItem = ClientHubSharedItemsQuery['clientHubSharedItems'][number];

interface SharedItemCardProps {
  item: HubSharedItem;
  onRead: (item: HubSharedItem) => void;
}

/** A contract, document or policy shared with the client: its live status, file and text. */
export function SharedItemCard({ item, onRead }: Readonly<SharedItemCardProps>) {
  const t = useT();
  const { formatDate } = useSettings();
  return (
    <Card sx={{ p: 2, height: '100%' }}>
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          <StatusChip value={item.kind} />
          <StatusChip value={item.status} />
        </Stack>
        <Text weight="semibold" size="lg">
          {item.title}
        </Text>
        <Text size="sm" color="text.secondary">
          {t('Shared on {date}', { date: formatDate(item.sharedAt) })}
        </Text>
        <Text size="sm">
          <SharedItemSignature item={item} />
        </Text>
        {item.note && (
          <Text size="sm" component="p" sx={{ whiteSpace: 'pre-wrap' }}>
            {item.note}
          </Text>
        )}
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          {item.hasContent && (
            <Button variant="outlined" startIcon={<ArticleIcon />} onClick={() => onRead(item)}>
              {t('Read')}
            </Button>
          )}
          {item.fileUrl && (
            <Button
              variant="outlined"
              href={item.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<OpenInNewIcon />}
            >
              {t('Open file')}
            </Button>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}
