import type { ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, Flex, Text } from '@/components/ui';

interface FormSectionProps {
  title: string;
  /** One line under the title saying what the section is for. */
  hint?: string;
  children: ReactNode;
}

/**
 * A titled group of fields in a long form. The fields sit two to a row on a wide screen and
 * stack on a phone; a child with `data-wide` takes the whole row.
 */
export function FormSection({ title, hint, children }: Readonly<FormSectionProps>) {
  const t = useT();
  return (
    <Flex direction="column" spacing={1.5}>
      <Box>
        <Text weight="semibold">{t(title)}</Text>
        {hint && (
          <Text size="sm" color="text.secondary">
            {t(hint)}
          </Text>
        )}
      </Box>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          '& > [data-wide]': { gridColumn: '1 / -1' },
        }}
      >
        {children}
      </Box>
    </Flex>
  );
}
