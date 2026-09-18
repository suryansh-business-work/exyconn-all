import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import { useT } from '@exyconn/i18n';
import {
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  Stack,
  Text,
} from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import type { ItOnboardingQuery } from '@exyconn/shell/graphql/generated';

export type JoinerRow = ItOnboardingQuery['itOnboarding'][number];

interface JoinerCardProps {
  joiner: JoinerRow;
  busy: boolean;
  onTick: (key: string, done: boolean) => void;
  onProvision: () => void;
}

/**
 * One new joiner as IT sees them: the checklist items IT owns (laptop, email, accounts), the
 * access they already have, and the standard applications they are still missing.
 */
export function JoinerCard({ joiner, busy, onTick, onProvision }: Readonly<JoinerCardProps>) {
  const t = useT();
  const { formatDate } = useSettings();
  return (
    <Stack spacing={1.5} sx={panel}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
        <Text size="label">{joiner.employeeName}</Text>
        <Text size="caption" color="text.secondary">
          {t('Joins {date}', { date: formatDate(joiner.joinDate) })}
        </Text>
      </Stack>
      <Stack>
        {joiner.items.map((item) => (
          <FormControlLabel
            key={item.key}
            control={
              <Checkbox
                checked={item.done}
                disabled={busy}
                onChange={(event) => onTick(item.key, event.target.checked)}
              />
            }
            label={`${item.label} · ${t('due {date}', { date: formatDate(item.dueOn) })}`}
          />
        ))}
      </Stack>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
        {joiner.access.map((grant) => (
          <Chip key={grant.application} size="small" color="success" label={grant.application} />
        ))}
        {joiner.missingApplications.map((app) => (
          <Chip key={app} size="small" variant="outlined" label={t('{app} — missing', { app })} />
        ))}
      </Stack>
      <Button
        size="small"
        variant="outlined"
        startIcon={<PlaylistAddIcon />}
        disabled={busy || joiner.missingApplications.length === 0}
        onClick={onProvision}
        sx={{ alignSelf: 'flex-start' }}
      >
        {t('Request the missing applications')}
      </Button>
    </Stack>
  );
}
