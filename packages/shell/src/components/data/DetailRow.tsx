import type { ReactNode } from 'react';
import { Box, Flex, Text } from '@/components/ui';

interface DetailRowProps {
  label: string;
  children: ReactNode;
}

/**
 * One label/value line in a read-only details drawer. Every module's "view" dialog is
 * built from these, so the label column reads the same everywhere.
 */
export function DetailRow({ label, children }: Readonly<DetailRowProps>) {
  return (
    <Flex direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
      <Text size="sm" color="text.secondary">
        {label}
      </Text>
      <Box sx={{ textAlign: 'right' }}>{children}</Box>
    </Flex>
  );
}
