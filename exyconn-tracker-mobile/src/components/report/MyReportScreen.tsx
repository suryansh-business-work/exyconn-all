import { useMemo, useState } from 'react';
import { YStack } from 'tamagui';
import { formatMonthLabel } from '@exyconn/tracker-core';
import { useMyDay } from '../../hooks/useMyDay';
import { useMyReport } from '../../hooks/useMyReport';
import { canGoForward, monthKeyOf, startOfMonth } from '../../lib/report/month';
import { Notice } from '../ui/Notice';
import { ScreenLayout } from '../ui/ScreenLayout';
import { Caption, Title } from '../ui/Typography';
import { DayDetailPanel } from './DayDetailPanel';
import { MonthSwitcher } from './MonthSwitcher';
import { ReportActivityChart } from './ReportActivityChart';
import { ReportCalendar } from './ReportCalendar';
import { ReportDownloadButton } from './ReportDownloadButton';
import { ReportMonthChart } from './ReportMonthChart';
import { ReportTable } from './ReportTable';
import { ReportTotals } from './ReportTotals';
import { SegmentedControl, type SegmentOption } from '../ui/SegmentedControl';

type TabId = 'calendar' | 'days';

const TABS: readonly SegmentOption<TabId>[] = [
  { value: 'calendar', label: 'Calendar' },
  { value: 'days', label: 'Days' },
];

interface Props {
  /** The employee's chosen zone: the day bounds and every timestamp below are read in it. */
  timezone: string;
}

/**
 * The employee's own tracked time. "Calendar" browses it date by date, with that day's
 * screenshots; "Days" keeps the month-at-a-glance table. Nobody else's data is reachable here.
 */
export function MyReportScreen({ timezone }: Readonly<Props>) {
  const today = useMemo(() => new Date(), []);
  const [tab, setTab] = useState<TabId>('calendar');
  const [month, setMonth] = useState<Date>(() => startOfMonth(today));
  const [selected, setSelected] = useState<Date>(today);

  const report = useMyReport(month, timezone);
  const day = useMyDay(selected, timezone);
  const monthLabel = formatMonthLabel(month);

  const selectDate = (date: Date): void => {
    setSelected(date);
    setMonth(startOfMonth(date));
  };

  const refresh = (): void => {
    report.reload();
    day.reload();
  };

  return (
    <ScreenLayout onRefresh={refresh} refreshing={report.loading}>
      <YStack gap="$1">
        <Title>My Report</Title>
        <Caption>This is your own tracked time, as your workspace sees it.</Caption>
      </YStack>

      <SegmentedControl options={TABS} value={tab} onChange={setTab} label="Report view" full />

      {report.error === null ? null : <Notice severity="error">{report.error}</Notice>}

      {tab === 'calendar' ? (
        <>
          <ReportCalendar
            days={report.days}
            month={month}
            selected={selected}
            maxDate={today}
            onSelect={selectDate}
            onMonthChange={setMonth}
          />
          <DayDetailPanel
            date={selected}
            detail={day.detail}
            loading={day.loading}
            error={day.error}
            timezone={timezone}
          />
        </>
      ) : (
        <>
          <MonthSwitcher
            month={month}
            canGoForward={canGoForward(month, today)}
            onChange={setMonth}
          />
          <ReportTotals totals={report.totals} />
          <ReportMonthChart days={report.days} monthLabel={monthLabel} />
          {/* Hours first, then how solid they were: the second chart only means something
              once the reader knows how long the days it describes actually were. */}
          <ReportActivityChart days={report.days} monthLabel={monthLabel} />
          <ReportTable days={report.days} loading={report.loading} />
          <ReportDownloadButton
            days={report.days}
            monthKey={monthKeyOf(month)}
            monthLabel={monthLabel}
          />
        </>
      )}
    </ScreenLayout>
  );
}
