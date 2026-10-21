import { useT } from '@exyconn/i18n';
import { Flex, LinearProgress, Text } from '@exyconn/shell/components/ui';

/** Shown while the AI writes versions, which can take a while: a bar and what is happening. */
export function AiWritingProgress({ count }: Readonly<{ count: number }>) {
  const t = useT();
  return (
    <Flex direction="column" spacing={1} role="status" aria-live="polite">
      <LinearProgress aria-label={t('Writing the versions')} />
      <Text component="p" size="caption" color="text.secondary" sx={{ m: 0 }}>
        {t('The AI is writing {count} versions. This can take up to a minute.', { count })}
      </Text>
    </Flex>
  );
}
