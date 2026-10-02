import { useState } from 'react';
import { startOfMonth } from 'date-fns';
import { useI18n, useT } from '@exyconn/i18n';
import { Box, Text } from '@exyconn/shell/components/ui';
import { LoadingState } from '@exyconn/shell/components/feedback/CenteredState';
import { panel } from '@exyconn/shell/components/glass/glass';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useSocialCalendarQuery } from '@exyconn/shell/graphql/generated';
import { buildCalendar, defaultScheduleTime, queryRange } from '../calendar.days';
import { useComposerData } from '../useComposerData';
import { AccountFilter } from './AccountFilter';
import { CalendarToolbar } from './CalendarToolbar';
import { CalendarDayCell } from './CalendarDayCell';
import { CalendarPostDialog, type CalendarDialogTarget } from './CalendarPostDialog';
import { useCalendarAccounts } from './useCalendarAccounts';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/**
 * Social › Calendar: the month's scheduled and published posts, day by day, for the chosen
 * accounts. A day from today on plans a new post; a post still to go out opens for editing.
 */
export function CalendarTab() {
  const t = useT();
  const { timezone } = useI18n().settings;
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [target, setTarget] = useState<CalendarDialogTarget | null>(null);
  const composer = useComposerData();
  const { selected, choose } = useCalendarAccounts(composer.accounts);
  const accountIds = selected.length > 0 ? selected : null;
  const { from, to } = queryRange(month);
  const { data, loading, error, refetch } = useSocialCalendarQuery({
    variables: { from: from.toISOString(), to: to.toISOString(), accountIds },
    fetchPolicy: 'cache-and-network',
    // The chosen accounts are only known once the connected ones have arrived.
    skip: composer.accountsFirstLoad,
  });
  const days = buildCalendar(month, data?.socialCalendar ?? [], new Date(), timezone);

  const plan = (dayKey: string) =>
    setTarget({
      post: null,
      schedule: {
        accountIds: accountIds ?? composer.accounts.map((account) => account.id),
        scheduledAt: defaultScheduleTime(dayKey, new Date(), timezone).toISOString(),
      },
    });
  const saved = () => {
    setTarget(null);
    refetch().catch((reason: unknown) =>
      portalLogger.warn('Could not reload the calendar', reason),
    );
  };

  return (
    <Box sx={panel}>
      <Box sx={{ display: 'flex', mb: 1.5 }}>
        <AccountFilter
          accounts={composer.accounts}
          selected={selected}
          loading={composer.accountsFirstLoad}
          onChange={choose}
        />
      </Box>
      <CalendarToolbar month={month} onMonth={setMonth} />
      {error && <Text color="error">{error.message}</Text>}
      {composer.accountsFirstLoad || (!data && loading) ? (
        <LoadingState label="Loading calendar" />
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 0.5 }}>
          {WEEKDAYS.map((label) => (
            <Text key={label} size="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
              {t(label)}
            </Text>
          ))}
          {days.map((day) => (
            <CalendarDayCell
              key={day.key}
              day={day}
              onPlan={plan}
              onEdit={(post) => setTarget({ post })}
            />
          ))}
        </Box>
      )}
      <CalendarPostDialog
        target={target}
        accounts={composer.accounts}
        rules={composer.rules}
        onClose={() => setTarget(null)}
        onSaved={saved}
      />
    </Box>
  );
}
