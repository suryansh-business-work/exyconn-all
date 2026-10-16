import { useT } from '@exyconn/i18n';
import { Box, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';

import { useBrandingQuery } from '@exyconn/shell/graphql/generated';
import { BrandingForm } from './forms/branding';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import { FormSkeleton } from '@exyconn/shell/components/feedback/skeletons';

/** Admin → Branding: the organisation's identity, images, palette and contacts. */
export function BrandingPage() {
  const t = useT();
  const { data, loading } = useBrandingQuery();
  const branding = data?.branding;
  let body = (
    <Text size="sm" color="text.secondary">
      {t('Branding is unavailable.')}
    </Text>
  );
  if (branding) {
    body = <BrandingForm initial={branding} />;
  } else if (loading) {
    body = <FormSkeleton fields={8} surface={false} label="Loading branding" />;
  }

  return (
    <Box>
      <PageHeader
        title="Branding"
        subtitle="Identity, images, colours and contact details used across every app"
      />
      <Box sx={readingPanel}>{body}</Box>
    </Box>
  );
}
