import type { ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import { Flex, Text } from '@exyconn/shell/components/ui';

interface ClientSectionProps {
  title: string;
  children: ReactNode;
}

/** A titled group of fields on the client form; the title is translated here. */
export function ClientSection({ title, children }: Readonly<ClientSectionProps>) {
  const t = useT();
  return (
    <Flex direction="column" spacing={2}>
      <Text weight="semibold">{t(title)}</Text>
      {children}
    </Flex>
  );
}
