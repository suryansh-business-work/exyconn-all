import { useT } from '@exyconn/i18n';
import { Alert, Box, Text } from '@exyconn/shell/components/ui';
import { GATE_SEVERITY, metricLabel, type SonarOverviewData } from './sonar.types';

type Gate = NonNullable<SonarOverviewData['qualityGate']>;

const GATE_TITLE: Record<string, string> = {
  OK: 'Quality gate passed',
  WARN: 'Quality gate passed with warnings',
  ERROR: 'Quality gate failed',
  NONE: 'This project has no quality gate',
};

/** The project's quality gate, and every condition that did not pass. */
export function QualityGateBanner({ gate }: Readonly<{ gate: Gate }>) {
  const t = useT();
  const failing = gate.conditions.filter((condition) => condition.status !== 'OK');
  return (
    <Alert severity={GATE_SEVERITY[gate.status] ?? 'info'} sx={{ mb: 2 }}>
      <Text weight="bold" component="p">
        {t(GATE_TITLE[gate.status] ?? 'Quality gate: {status}', { status: gate.status })}
      </Text>
      {failing.length > 0 && (
        <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 3 }}>
          {failing.map((condition) => (
            <li key={condition.metric}>
              <Text size="sm">
                {t('{metric} is {actual} (must be {comparator} {threshold})', {
                  metric: metricLabel(condition.metric),
                  actual: condition.actualValue,
                  comparator: condition.comparator === 'LT' ? t('at least') : t('at most'),
                  threshold: condition.errorThreshold,
                })}
              </Text>
            </li>
          ))}
        </Box>
      )}
    </Alert>
  );
}
