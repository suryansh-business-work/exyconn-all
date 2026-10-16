import type { ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, Text } from '@exyconn/shell/components/ui';

/** One labelled fact on a profile; renders nothing when there is nothing to say. */
export function DetailField({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  const t = useT();
  if (children === '' || children === null || children === undefined) {
    return null;
  }
  return (
    <Box>
      <Text size="caption" color="text.secondary">
        {t(label)}
      </Text>
      <Box sx={{ overflowWrap: 'anywhere' }}>{children}</Box>
    </Box>
  );
}
