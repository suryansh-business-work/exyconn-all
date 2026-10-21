import { useT } from '@exyconn/i18n';
import { Heading, Stack, Text } from '@exyconn/shell/components/ui';

/** A hub page's title and the one line saying what is on it. */
export function HubPageHeader({ title, subtitle }: Readonly<{ title: string; subtitle: string }>) {
  const t = useT();
  return (
    <Stack spacing={0.5}>
      <Heading level={4}>{t(title)}</Heading>
      <Text color="text.secondary">{t(subtitle)}</Text>
    </Stack>
  );
}
