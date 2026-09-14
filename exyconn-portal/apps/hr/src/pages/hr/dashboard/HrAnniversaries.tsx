import { useT, type Interpolations } from '@exyconn/i18n';
import { Box, Flex, Heading, Text } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import CakeIcon from '@mui/icons-material/Cake';
import type { Anniversary } from './hrDashboard.selectors';

/** Translates one string, with optional {placeholders}. */
type Translate = (source: string, values?: Interpolations) => string;

interface HrAnniversariesProps {
  anniversaries: Anniversary[];
  formatDate: (value: Date) => string;
}

function when(daysAway: number, t: Translate): string {
  if (daysAway === 0) return t('Today');
  if (daysAway === 1) return t('Tomorrow');
  return t('In {days} days', { days: daysAway });
}

/** "1 year" and "2 years" are two whole sentences, because not every language agrees alike. */
function yearsServed(years: number, t: Translate): string {
  if (years === 1) return t('{years} year', { years });
  return t('{years} years', { years });
}

/** Work anniversaries in the next month — the cheapest recognition there is. */
export function HrAnniversaries({ anniversaries, formatDate }: Readonly<HrAnniversariesProps>) {
  const t = useT();
  return (
    <Box sx={[panel, { height: '100%' }]}>
      <Heading level={6}>{t('Work anniversaries')}</Heading>
      {anniversaries.length === 0 && (
        <Text size="sm" color="text.secondary">
          {t('None in the next 30 days.')}
        </Text>
      )}
      {anniversaries.map((a) => (
        <Flex key={a.user.id} direction="row" alignItems="center" spacing={1.5} sx={{ mt: 1.5 }}>
          <CakeIcon fontSize="small" color="secondary" />
          <Box>
            <Text weight="medium">
              {a.user.name} · {yearsServed(a.years, t)}
            </Text>
            <Text size="caption" color="text.secondary">
              {when(a.daysAway, t)} · {formatDate(a.on)}
            </Text>
          </Box>
        </Flex>
      ))}
    </Box>
  );
}
