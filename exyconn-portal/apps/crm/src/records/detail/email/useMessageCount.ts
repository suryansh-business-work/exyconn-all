import { useT } from '@exyconn/i18n';

/** "1 message" or "{count} messages". */
export function useMessageCount() {
  const t = useT();
  return (count: number) => (count === 1 ? t('1 message') : t('{count} messages', { count }));
}
