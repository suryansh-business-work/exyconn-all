import { useT } from '@exyconn/i18n';
import { Alert } from '@exyconn/shell/components/ui';

/**
 * Said above an OAuth app while it is switched off: every company's CRM keeps its Connect
 * button disabled until the switch below is on and saved. `message` is an English source string.
 */
export function ConnectionsOffNotice({ message }: Readonly<{ message: string }>) {
  const t = useT();
  return (
    <Alert severity="warning" sx={{ mb: 2 }}>
      {t(message)}
    </Alert>
  );
}
