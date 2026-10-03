import { useT } from '@exyconn/i18n';
import { WhatsappWorkflowStatus } from '@exyconn/shell/graphql/generated';
import { Chip } from '@exyconn/shell/components/ui';

/**
 * Draft (never published, or edited since) or Published, with the published version — the
 * same chip on the list and in the editor's header.
 */
export function WorkflowStatusChip({
  status,
  version,
}: Readonly<{ status: WhatsappWorkflowStatus; version: number }>) {
  const t = useT();
  if (status === WhatsappWorkflowStatus.Published) {
    return <Chip size="small" color="success" label={t('Published v{version}', { version })} />;
  }
  const label = version > 0 ? t('Draft · live v{version}', { version }) : t('Draft');
  return <Chip size="small" color="warning" variant="outlined" label={label} />;
}
