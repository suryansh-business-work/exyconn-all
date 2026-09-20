import { useT } from '@exyconn/i18n';
import { Chip, Stack, Text, fontWeight } from '@exyconn/shell/components/ui';
import type { ProjectHealthOverviewQuery } from '@exyconn/shell/graphql/generated';
import {
  RISK_COLOR,
  RISK_LABEL,
  TIMELINE_COLOR,
  TIMELINE_LABEL,
  percentLabel,
} from '../../projects/health';

/** One project's health, as the portfolio query returns it. */
export type PortfolioRow = ProjectHealthOverviewQuery['projectHealthOverview'][number] & {
  /** The table keys its rows on `id`; the query calls the same value `projectId`. */
  id: string;
};

/** The project itself: what it is called, its ticket prefix and whose work it is. */
export function ProjectCell({ row }: Readonly<{ row: PortfolioRow }>) {
  const t = useT();
  return (
    <Stack spacing={0.5}>
      <Text weight="medium">{row.name}</Text>
      <Text size="caption" color="text.secondary">
        {row.clientName ? `${row.key} · ${row.clientName}` : row.key}
      </Text>
      {row.teamSize > 0 ? (
        <Text size="caption" color="text.secondary">
          {t('{count} on the team', { count: row.teamSize })}
        </Text>
      ) : null}
    </Stack>
  );
}

/**
 * The rating and, underneath it, the reasons the server gave for it.
 *
 * The reasons are the whole point of showing risk in a list: a column of coloured chips
 * invites an argument about the colours, and a chip that says why ends one before it starts.
 */
export function RiskCell({ row }: Readonly<{ row: PortfolioRow }>) {
  const t = useT();
  return (
    <Stack spacing={0.5}>
      <Chip
        size="small"
        label={t(RISK_LABEL[row.risk])}
        color={RISK_COLOR[row.risk]}
        sx={{ fontWeight: fontWeight.semibold, alignSelf: 'flex-start' }}
      />
      {row.riskReasons.map((reason) => (
        <Text key={reason} size="caption" color="text.secondary">
          {t(reason)}
        </Text>
      ))}
    </Stack>
  );
}

/** Where the project stands against its own dates. */
export function TimelineCell({ row }: Readonly<{ row: PortfolioRow }>) {
  const t = useT();
  return (
    <Chip
      size="small"
      variant="outlined"
      label={t(TIMELINE_LABEL[row.timeline])}
      color={TIMELINE_COLOR[row.timeline]}
    />
  );
}

/** How much of the board is finished, with the ticket counts it was worked out from. */
export function ProgressCell({ row }: Readonly<{ row: PortfolioRow }>) {
  const t = useT();
  return (
    <Stack spacing={0.5}>
      <Text>{percentLabel(row.progressPercent, t('Not tracked'))}</Text>
      <Text size="caption" color="text.secondary">
        {t('{done} of {total} tickets', { done: row.doneTaskCount, total: row.taskCount })}
      </Text>
    </Stack>
  );
}

/**
 * Hours against the hours that were agreed.
 *
 * A project with no agreed budget shows what it has spent and nothing else — inventing a
 * percentage against a budget nobody set would be the one figure on this page that is made up.
 */
export function HoursCell({ row }: Readonly<{ row: PortfolioRow }>) {
  const t = useT();
  const spent = row.budgetHours
    ? t('{logged} of {budget} h', { logged: row.loggedHours, budget: row.budgetHours })
    : t('{logged} h logged', { logged: row.loggedHours });
  return (
    <Stack spacing={0.5}>
      <Text>{percentLabel(row.budgetUsedPercent, t('No budget'))}</Text>
      <Text size="caption" color="text.secondary">
        {spent}
      </Text>
    </Stack>
  );
}
