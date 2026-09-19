import { useT } from '@exyconn/i18n';
import LinkIcon from '@mui/icons-material/Link';
import { Box, Button, Text } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import type { SocialAppStatusesQuery } from '@exyconn/shell/graphql/generated';

type Provider = SocialAppStatusesQuery['socialAppStatuses'][number];

/** Friendly names for the networks a connection adds. */
const NETWORK_NAMES: Readonly<Record<string, string>> = {
  LINKEDIN: 'LinkedIn',
  FACEBOOK: 'Facebook Pages',
  INSTAGRAM: 'Instagram Business',
  X: 'X profile',
  YOUTUBE: 'YouTube channel',
};

interface ProviderCardProps {
  provider: Provider;
  connecting: boolean;
  onConnect: () => void;
}

/** One provider: what connecting it adds, and the button — or why there is none yet. */
export function ProviderCard({ provider, connecting, onConnect }: Readonly<ProviderCardProps>) {
  const t = useT();
  const adds = provider.networks.map((network) => NETWORK_NAMES[network] ?? network).join(', ');
  return (
    <Box sx={[panel, { height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }]}>
      <Text weight="bold">{provider.label}</Text>
      <Text size="sm" color="text.secondary" sx={{ flexGrow: 1 }}>
        {t('Adds: {networks}', { networks: adds })}
      </Text>
      <Button
        variant="contained"
        startIcon={<LinkIcon />}
        disabled={!provider.available || connecting}
        onClick={onConnect}
      >
        {connecting ? t('Opening…') : t('Connect')}
      </Button>
      {!provider.available && (
        <Text size="caption" color="text.secondary">
          {t('Not set up yet — Tech adds it under Environment Variables › Social apps.')}
        </Text>
      )}
    </Box>
  );
}
