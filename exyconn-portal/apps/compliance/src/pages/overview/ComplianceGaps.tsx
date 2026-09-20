import { useT } from '@exyconn/i18n';
import { Alert, Box, Chip, Flex, Stack, Text, color } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';

/** One standard and how many audits it has behind it. */
export interface CoverageRow {
  label: string;
  value: number;
}

interface ComplianceGapsProps {
  standardCoverage: readonly CoverageRow[];
  residualHeat: readonly CoverageRow[];
  findingsOverdue: number;
  risksPastReview: number;
  objectivesAtRisk: number;
  lastReviewOn: string | null;
  lastReviewTitle: string;
  formatDate: (value: string | null | undefined) => string;
}

/** The colour a residual level is drawn in — the same order the register bands them. */
const HEAT: Record<string, string> = {
  LOW: color.green[500],
  MEDIUM: color.amber[500],
  HIGH: color.red[200],
  CRITICAL: color.red[500],
};

/**
 * What an auditor asks, answered before they ask it.
 *
 * Every number here was already in the database and readable only by opening a register and
 * counting: how much is overdue, which standards have never been audited, how much risk is
 * still being carried after the controls, and when leadership last looked at any of it.
 */
export function ComplianceGaps({
  standardCoverage,
  residualHeat,
  findingsOverdue,
  risksPastReview,
  objectivesAtRisk,
  lastReviewOn,
  lastReviewTitle,
  formatDate,
}: Readonly<ComplianceGapsProps>) {
  const t = useT();
  const neverAudited = standardCoverage.filter((row) => row.value === 0);

  return (
    <Stack spacing={1.5}>
      {findingsOverdue > 0 && (
        <Alert severity="error">
          {t('{count} corrective action(s) are past their agreed date.', {
            count: findingsOverdue,
          })}
        </Alert>
      )}
      {risksPastReview > 0 && (
        <Alert severity="warning">
          {t('{count} open risk(s) are past their review date.', { count: risksPastReview })}
        </Alert>
      )}
      {objectivesAtRisk > 0 && (
        <Alert severity="warning">
          {t('{count} objective(s) are at risk or already missed.', { count: objectivesAtRisk })}
        </Alert>
      )}

      <Box sx={panel}>
        <Text size="sm" weight="semibold">
          {t('Residual risk being carried')}
        </Text>
        <Text size="caption" color="text.secondary">
          {t('Open risks by their score after the controls, not before them.')}
        </Text>
        <Flex direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
          {residualHeat.length === 0 && (
            <Text size="sm" color="text.secondary">
              {t('No open risks on the register.')}
            </Text>
          )}
          {residualHeat.map((row) => (
            <Chip
              key={row.label}
              label={`${t(row.label)} · ${row.value}`}
              sx={{ bgcolor: HEAT[row.label] ?? color.blue[400], color: 'common.white' }}
            />
          ))}
        </Flex>
      </Box>

      <Box sx={panel}>
        <Text size="sm" weight="semibold">
          {t('Audits in the last year, by standard')}
        </Text>
        <Text size="caption" color="text.secondary">
          {t('A standard with none is the gap a certification body finds first.')}
        </Text>
        <Flex direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
          {standardCoverage.map((row) => (
            <Chip
              key={row.label}
              label={`${row.label} · ${row.value}`}
              color={row.value > 0 ? 'success' : 'error'}
              variant={row.value > 0 ? 'filled' : 'outlined'}
            />
          ))}
        </Flex>
        {neverAudited.length > 0 && (
          <Text size="caption" color="error.main" sx={{ mt: 1, display: 'block' }}>
            {t('No audit on file for: {standards}', {
              standards: neverAudited.map((row) => row.label).join(', '),
            })}
          </Text>
        )}
      </Box>

      <Box sx={panel}>
        <Text size="sm" weight="semibold">
          {t('Last management review')}
        </Text>
        <Text size="sm" color="text.secondary">
          {lastReviewOn
            ? `${lastReviewTitle} — ${formatDate(lastReviewOn)}`
            : t('Leadership has never recorded one.')}
        </Text>
      </Box>
    </Stack>
  );
}
