import { useT } from '@exyconn/i18n';
import { CircularProgress, Flex, Text } from '@exyconn/shell/components/ui';

/** The spinner the calendar shows while a month's free times load. */
export function SlotsLoading() {
  const t = useT();
  return (
    <Flex
      role="status"
      aria-live="polite"
      alignItems="center"
      justifyContent="center"
      spacing={1.5}
      sx={{ minHeight: 240 }}
    >
      <CircularProgress size={36} />
      <Text size="sm" color="text.secondary">
        {t('Loading free times…')}
      </Text>
    </Flex>
  );
}
