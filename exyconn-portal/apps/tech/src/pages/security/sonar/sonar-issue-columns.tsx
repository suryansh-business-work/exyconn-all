import { useT } from '@exyconn/i18n';
import { Chip, Link, Stack, Text } from '@exyconn/shell/components/ui';
import type { Column } from '@exyconn/shell/components/data/DataTable';
import { SEVERITY_COLOR, type SonarIssueRow } from './sonar.types';

/** File and line, or the file alone for a file-level issue; a dash for a project-level one. */
function issueLocation(row: SonarIssueRow): string {
  if (!row.file) {
    return '—';
  }
  return row.line ? `${row.file}:${row.line}` : row.file;
}

/** A link to the issue on the SonarQube server, named for screen readers by its rule. */
function IssueLink({ row }: Readonly<{ row: SonarIssueRow }>) {
  const t = useT();
  return (
    <Link
      href={row.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('Open in SonarQube: {rule} at {location} (new tab)', {
        rule: row.rule,
        location: issueLocation(row),
      })}
    >
      {t('Open in SonarQube')}
    </Link>
  );
}

export const ISSUE_COLUMNS: Column<SonarIssueRow>[] = [
  {
    key: 'severity',
    label: 'Severity',
    render: (row) => (
      <Chip size="small" color={SEVERITY_COLOR[row.severity] ?? 'default'} label={row.severity} />
    ),
  },
  { key: 'type', label: 'Type', render: (row) => row.type.replaceAll('_', ' ') },
  {
    key: 'message',
    label: 'Issue',
    render: (row) => (
      <Stack>
        <Text size="sm">{row.message}</Text>
        <Text size="caption" color="text.secondary">
          {row.rule}
        </Text>
      </Stack>
    ),
  },
  {
    key: 'file',
    label: 'Where',
    render: (row) => (
      <Text size="sm" sx={{ overflowWrap: 'anywhere' }}>
        {issueLocation(row)}
      </Text>
    ),
  },
  { key: 'url', label: 'Open', render: (row) => <IssueLink row={row} /> },
];
