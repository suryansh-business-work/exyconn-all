import { useState } from 'react';
import KeyIcon from '@mui/icons-material/Key';
import { useT } from '@exyconn/i18n';
import { Box, Button, Flex, Text } from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { panel } from '@exyconn/shell/components/glass/glass';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useClearApifyTokenMutation,
  type LeadSourceConfigQuery,
} from '@exyconn/shell/graphql/generated';
import { ApifySettingsForm } from './forms/apify-settings';

type Settings = LeadSourceConfigQuery['leadSourceConfig'];

/** Whether Apify is set up, with Set up / Change and Remove. */
export function ApifySettingsCard({ settings }: Readonly<{ settings: Settings }>) {
  const t = useT();
  const confirm = useConfirm();
  const notify = useNotify();
  const [editing, setEditing] = useState(false);
  const [clear] = useClearApifyTokenMutation({ refetchQueries: ['LeadSourceConfig'] });

  const remove = async () => {
    const ok = await confirm({
      title: 'Remove the Apify token',
      message: 'Clutch searches will use Clutch’s own server only.',
      confirmText: 'Remove',
      destructive: true,
    });
    if (!ok) {
      return;
    }
    try {
      await clear();
      notify('Apify token removed');
    } catch (err) {
      notify(errorMessage(err, 'Could not remove the token'), 'error');
    }
  };

  const status = settings.hasApifyToken
    ? t('Apify is set up (token ending {hint}, actor {actor}).', {
        hint: settings.apifyTokenHint,
        actor: settings.clutchActorId,
      })
    : t('Apify is not set up: searches use Clutch’s own server (free, top matches, no portfolio).');

  return (
    <Box sx={{ ...panel, mb: 2 }}>
      <Flex direction="row" justifyContent="space-between" alignItems="center" wrap spacing={1}>
        <Flex direction="row" spacing={1} alignItems="center">
          <KeyIcon fontSize="small" color={settings.hasApifyToken ? 'success' : 'disabled'} />
          <Text size="sm">{status}</Text>
        </Flex>
        <Flex direction="row" spacing={1}>
          <Button size="small" onClick={() => setEditing(true)}>
            {settings.hasApifyToken ? t('Change') : t('Set up Apify')}
          </Button>
          {settings.hasApifyToken && (
            <Button size="small" color="error" onClick={remove}>
              {t('Remove')}
            </Button>
          )}
        </Flex>
      </Flex>
      <CrudDialog
        open={editing}
        title={t('Apify for lead generators')}
        onClose={() => setEditing(false)}
      >
        {editing && (
          <ApifySettingsForm
            settings={settings}
            onDone={() => setEditing(false)}
            onCancel={() => setEditing(false)}
          />
        )}
      </CrudDialog>
    </Box>
  );
}
