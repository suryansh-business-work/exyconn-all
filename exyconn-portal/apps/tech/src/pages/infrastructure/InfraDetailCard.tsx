import type { ReactNode } from 'react';
import { Box, Flex, Text } from '@exyconn/shell/components/ui';
import { DetailRow } from '@exyconn/shell/components/data/DetailRow';
import { glass } from '@exyconn/shell/components/glass/glass';

/** One label/value pair inside a facts card. `value` is text unless a node is given. */
export interface InfraFact {
  label: string;
  value: string;
  node?: ReactNode;
}

interface InfraDetailCardProps {
  title: string;
  icon: ReactNode;
  facts: InfraFact[];
}

/**
 * A titled card of read-only facts. Every Infrastructure surface is a list of measured
 * values, so they all render through this rather than each inventing its own layout.
 */
export function InfraDetailCard({ title, icon, facts }: Readonly<InfraDetailCardProps>) {
  return (
    <Box sx={[glass, { p: { xs: 2, md: 2.5 }, height: '100%' }]}>
      <Flex direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        {icon}
        <Text weight="medium">{title}</Text>
      </Flex>
      <Flex direction="column" spacing={1}>
        {facts.map((fact) => (
          <DetailRow key={fact.label} label={fact.label}>
            {fact.node ?? (
              <Text size="sm" sx={{ wordBreak: 'break-all' }}>
                {fact.value}
              </Text>
            )}
          </DetailRow>
        ))}
      </Flex>
    </Box>
  );
}
