import { Box, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';

import { useBrandingQuery } from '@exyconn/shell/graphql/generated';
import { BrandingForm } from './forms/branding';
import { readingPanel } from '@exyconn/shell/components/glass/glass';

/** Admin → Branding: the organisation's identity, images, palette and contacts. */
export function BrandingPage() {
  const { data, loading } = useBrandingQuery();
  const branding = data?.branding;
  const emptyMessage = loading ? 'Loading…' : 'Branding is unavailable.';

  return (
    <Box>
      <PageHeader
        title="Branding"
        subtitle="Identity, images, colours and contact details used across every app"
      />
      <Box sx={readingPanel}>
        {branding ? (
          <BrandingForm initial={branding} />
        ) : (
          <Text size="sm" color="text.secondary">
            {emptyMessage}
          </Text>
        )}
      </Box>
    </Box>
  );
}
