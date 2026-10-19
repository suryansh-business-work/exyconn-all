import { useFormatters, useT } from '@exyconn/i18n';
import {
  Alert,
  Button,
  List,
  ListItem,
  ListItemText,
  Skeleton,
} from '@exyconn/shell/components/ui';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useCampaignTemplateVersionsQuery,
  useRestoreCampaignTemplateVersionMutation,
} from '@exyconn/shell/graphql/generated';
import type { CampaignTemplateRow } from '../marketing/forms/campaign-template';

interface TemplateVersionsProps {
  template: CampaignTemplateRow;
  onRestored: () => void;
}

/** Every saved version, newest first. Restoring makes an old one current as a new version. */
export function TemplateVersions({ template, onRestored }: Readonly<TemplateVersionsProps>) {
  const t = useT();
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatDateTime } = useFormatters();
  const { data, loading, error, refetch } = useCampaignTemplateVersionsQuery({
    variables: { templateId: template.id },
    fetchPolicy: 'network-only',
  });
  const [restore, { loading: restoring }] = useRestoreCampaignTemplateVersionMutation();
  const restoreVersion = async (version: number) => {
    const ok = await confirm({
      title: 'Restore version {version}?',
      titleValues: { version },
      message: 'It becomes the current design, saved as a new version. Nothing is lost.',
      confirmText: 'Restore',
    });
    if (!ok) return;
    try {
      await restore({ variables: { templateId: template.id, version } });
      notify('Version {version} restored', 'success', { version });
      await refetch();
      onRestored();
    } catch (err) {
      notify(errorMessage(err, 'The version could not be restored'), 'error');
    }
  };
  if (loading && !data) return <Skeleton variant="rounded" height={160} />;
  if (error) return <Alert severity="error">{error.message}</Alert>;
  return (
    <List dense>
      {(data?.campaignTemplateVersions ?? []).map((row) => (
        <ListItem
          key={row.id}
          secondaryAction={
            row.version === template.version ? null : (
              <Button size="small" onClick={() => restoreVersion(row.version)} disabled={restoring}>
                {t('Restore')}
              </Button>
            )
          }
        >
          <ListItemText
            primary={t(
              row.version === template.version
                ? 'Version {version} (current)'
                : 'Version {version}',
              { version: row.version },
            )}
            secondary={`${row.note || t('No note')} · ${row.createdByName || t('System')} · ${formatDateTime(row.createdAt)}`}
          />
        </ListItem>
      ))}
    </List>
  );
}
