import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import {
  Alert,
  Box,
  Stack,
  Text,
  ToggleButton,
  ToggleButtonGroup,
} from '@exyconn/shell/components/ui';
import { DataTable } from '@exyconn/shell/components/data/DataTable';
import { panel } from '@exyconn/shell/components/glass/glass';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useSonarIssuesQuery } from '@exyconn/shell/graphql/generated';
import { ISSUE_COLUMNS } from './sonar-issue-columns';
import type { SonarOverviewData } from './sonar.types';

/** The filter value that shows every severity: the overview's own list. */
const ALL = 'ALL';

interface SonarIssuesTableProps {
  overview: Pick<SonarOverviewData, 'issues' | 'issuesTotal' | 'severityCounts'>;
}

/**
 * The most severe open issues, each linking back to SonarQube. "All" is the overview's list;
 * a severity asks SonarQube for that severity's worst page, so a filter never comes up empty
 * just because the overall top page held none of it.
 */
export function SonarIssuesTable({ overview }: Readonly<SonarIssuesTableProps>) {
  const t = useT();
  const [severity, setSeverity] = useState(ALL);
  const filtered = severity !== ALL;
  const { data, loading, error } = useSonarIssuesQuery({
    variables: { severity },
    skip: !filtered,
  });
  const issues = filtered ? (data?.sonarIssues ?? []) : overview.issues;
  const rows = issues.map((issue) => ({ ...issue, id: issue.key }));
  const facets = overview.severityCounts.filter((facet) => facet.count > 0);

  return (
    <Box sx={panel}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 1 }}
      >
        <Text size="label" component="h2">
          {t('Open issues ({count})', { count: overview.issuesTotal })}
        </Text>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={severity}
          onChange={(_event, value: string | null) => setSeverity(value ?? ALL)}
          aria-label={t('Filter by severity')}
          sx={{ flexWrap: 'wrap' }}
        >
          <ToggleButton value={ALL}>{t('All')}</ToggleButton>
          {facets.map((facet) => (
            <ToggleButton key={facet.value} value={facet.value}>
              {`${facet.value} (${facet.count})`}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>
      {error && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {errorMessage(error, t('These issues could not be read.'))}
        </Alert>
      )}
      <DataTable
        columns={ISSUE_COLUMNS}
        rows={rows}
        loading={filtered && !data && loading}
        emptyMessage="No open issues at this severity."
      />
    </Box>
  );
}
