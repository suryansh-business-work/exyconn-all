import type { ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import { Flex, Heading, Text } from '@exyconn/shell/components/ui';

interface SettingsSectionProps {
  title: string;
  description: string;
  children: ReactNode;
}

/** A titled group of chatbot settings. */
export function SettingsSection({ title, description, children }: Readonly<SettingsSectionProps>) {
  const t = useT();
  return (
    <Flex component="section" direction="column" spacing={2}>
      <div>
        <Heading level={2} sx={{ typography: 'h6' }}>
          {t(title)}
        </Heading>
        <Text size="sm" color="text.secondary">
          {t(description)}
        </Text>
      </div>
      {children}
    </Flex>
  );
}
