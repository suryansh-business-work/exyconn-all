import { Link as RouterLink } from 'react-router-dom';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useT } from '@exyconn/i18n';
import { Box, Link, Stack, Typography } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { CrmInsightTone } from '@exyconn/shell/graphql/generated';
import { insightCopy, type InsightRow } from './insights';

/** One finding: an icon for its tone, and the sentence as a link to where it can be acted on. */
function InsightItem({ insight }: Readonly<{ insight: InsightRow }>) {
  const t = useT();
  const { text, to, values } = insightCopy(insight);
  const warning = insight.tone === CrmInsightTone.Warning;
  const sentence = t(text, { ...values, label: t(values.label), compare: t(values.compare) });
  return (
    <Stack component="li" direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
      {warning ? (
        <WarningAmberIcon fontSize="small" color="warning" aria-label={t('Needs attention')} />
      ) : (
        <TrendingUpIcon fontSize="small" color="success" aria-label={t('Going well')} />
      )}
      <Link component={RouterLink} to={to} underline="hover" color="text.primary">
        {sentence}
      </Link>
    </Stack>
  );
}

/** What the numbers say, worked out on the server from the period's real records. */
export function InsightsList({ insights }: Readonly<{ insights: readonly InsightRow[] }>) {
  const t = useT();
  return (
    <Box sx={[panel, { height: '100%' }]}>
      <Typography variant="subtitle2" component="h2" sx={{ fontWeight: 700, mb: 1.5 }}>
        {t('Insights')}
      </Typography>
      {insights.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('Nothing stands out in this period yet.')}
        </Typography>
      ) : (
        <Stack component="ul" spacing={1.5} sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {insights.map((insight) => (
            <InsightItem key={`${insight.kind}:${insight.label}`} insight={insight} />
          ))}
        </Stack>
      )}
    </Box>
  );
}
