import { useT } from '@exyconn/i18n';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Stack,
  Text,
} from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useScoreDealMutation } from '@exyconn/shell/graphql/generated';
import type { DealRow } from '../forms/deal';
import { DealScoreChip, signedImpact } from './DealScoreChip';

/**
 * A deal's score on its edit page: the number, every reason behind it and when it was worked
 * out, with a button to work it out again now. The score is computed on the server from the
 * deal's activities, its time in stage and its contact's email — nobody types it.
 */
export function DealScorePanel({ deal }: Readonly<{ deal: DealRow }>) {
  const t = useT();
  const notify = useNotify();
  const { formatDateTime } = useSettings();
  const [rescore, { data, loading }] = useScoreDealMutation();
  const shown = data?.scoreDeal ?? deal;

  const run = async () => {
    try {
      await rescore({ variables: { id: deal.id } });
    } catch (error) {
      notify(errorMessage(error, 'The deal could not be rescored'), 'error');
    }
  };

  return (
    <Box sx={panel}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Text weight="semibold">{t('Deal score')}</Text>
        <DealScoreChip deal={shown} />
        <Button size="small" startIcon={<RefreshIcon />} onClick={run} disabled={loading}>
          {t('Rescore now')}
        </Button>
      </Stack>
      {shown.scoredAt && (
        <Text size="sm" color="text.secondary">
          {t('Worked out {date} from activities, time in stage and email replies.', {
            date: formatDateTime(shown.scoredAt),
          })}
        </Text>
      )}
      <List dense>
        {shown.scoreReasons.map((reason) => (
          <ListItem key={reason.text} disableGutters>
            <ListItemText primary={`${signedImpact(reason.impact)}  ${reason.text}`} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
