import type { ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, Text } from '@/components/ui';

interface DetailFactProps {
  label: string;
  children: ReactNode;
}

/**
 * One fact on a summary card: a small label with its value on the line below. The label is
 * a block of its own, so the two can never run together ("EMPLOYMENTACTIVE").
 */
export function DetailFact({ label, children }: Readonly<DetailFactProps>) {
  const t = useT();
  return (
    <Box sx={{ minWidth: 0 }}>
      <Text size="overline" color="text.secondary" sx={{ display: 'block', lineHeight: 1.6 }}>
        {t(label)}
      </Text>
      <Text size="sm" component="div" sx={{ overflowWrap: 'anywhere' }}>
        {children}
      </Text>
    </Box>
  );
}

/** Lays facts out in even columns that wrap on narrow screens instead of crowding a row. */
export function DetailFactGrid({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        columnGap: 3,
        rowGap: 2,
      }}
    >
      {children}
    </Box>
  );
}
