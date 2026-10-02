import { useT, type Interpolations } from '@exyconn/i18n';
import { Box, Flex, Heading, Text } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { LoadingState } from '@exyconn/shell/components/feedback/CenteredState';
import CelebrationIcon from '@mui/icons-material/Celebration';
import type { Recurring } from './hrDashboard.selectors';

/** Translates one string, with optional {placeholders}. */
type Translate = (source: string, values?: Interpolations) => string;

interface HrBirthdaysProps {
  birthdays: Recurring[];
  formatDate: (value: Date) => string;
  /** True until the card's data first arrives. */
  loading?: boolean;
}

function when(daysAway: number, t: Translate): string {
  if (daysAway === 0) return t('Today');
  if (daysAway === 1) return t('Tomorrow');
  return t('In {days} days', { days: daysAway });
}

/** Birthdays in the next month. The year of birth is never shown. */
export function HrBirthdays({
  birthdays,
  formatDate,
  loading = false,
}: Readonly<HrBirthdaysProps>) {
  const t = useT();
  return (
    <Box sx={[panel, { height: '100%' }]}>
      <Heading level={6}>{t('Birthdays')}</Heading>
      {loading && <LoadingState />}
      {!loading && birthdays.length === 0 && (
        <Text size="sm" color="text.secondary">
          {t('None in the next 30 days.')}
        </Text>
      )}
      {birthdays.map((b) => (
        <Flex key={b.user.id} direction="row" alignItems="center" spacing={1.5} sx={{ mt: 1.5 }}>
          <CelebrationIcon fontSize="small" color="error" />
          <Box>
            <Text weight="medium">{b.user.name}</Text>
            <Text size="caption" color="text.secondary">
              {when(b.daysAway, t)} · {formatDate(b.on)}
            </Text>
          </Box>
        </Flex>
      ))}
    </Box>
  );
}
