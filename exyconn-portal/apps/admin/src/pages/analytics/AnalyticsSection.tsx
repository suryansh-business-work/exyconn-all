import type { ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, Stack, Text } from '@exyconn/shell/components/ui';

interface AnalyticsSectionProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

/** One titled block of the analytics page: users, employees, the tracker or the platform. */
export function AnalyticsSection({ title, subtitle, children }: Readonly<AnalyticsSectionProps>) {
  const t = useT();
  return (
    <Box component="section" aria-label={t(title)}>
      <Text component="h2" size="lg" weight="bold">
        {t(title)}
      </Text>
      <Text component="p" size="sm" color="text.secondary" sx={{ mb: 1.5 }}>
        {t(subtitle)}
      </Text>
      <Stack spacing={1.5}>{children}</Stack>
    </Box>
  );
}
