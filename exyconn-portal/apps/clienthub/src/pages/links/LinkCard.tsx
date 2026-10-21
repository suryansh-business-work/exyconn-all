import { useT } from '@exyconn/i18n';
import { Button, Card, Stack, Text } from '@exyconn/shell/components/ui';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import type { ClientHubLinksQuery } from '@exyconn/shell/graphql/generated';

export type HubLink = ClientHubLinksQuery['clientHubLinks'][number];

/** One important link: what it is, why it matters, and a button that opens it. */
export function LinkCard({ link }: Readonly<{ link: HubLink }>) {
  const t = useT();
  return (
    <Card sx={{ p: 2, height: '100%' }}>
      <Stack spacing={1}>
        <Text weight="semibold" size="lg">
          {link.title}
        </Text>
        {link.description && <Text color="text.secondary">{link.description}</Text>}
        {link.details && (
          <Text size="sm" component="p" sx={{ whiteSpace: 'pre-wrap' }}>
            {link.details}
          </Text>
        )}
        <Text size="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
          {link.url}
        </Text>
        <Button
          variant="outlined"
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          endIcon={<OpenInNewIcon />}
          sx={{ alignSelf: 'flex-start' }}
        >
          {t('Open')}
        </Button>
      </Stack>
    </Card>
  );
}
