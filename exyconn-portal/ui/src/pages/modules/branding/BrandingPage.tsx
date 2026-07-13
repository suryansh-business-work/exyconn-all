import { Box, Text } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { glass } from '@/components/glass/glass';
import { useBrandingQuery } from '@/graphql/generated';
import { BrandingForm } from './forms/branding';

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
      <Box sx={[glass, { p: { xs: 2, md: 3 } }]}>
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
