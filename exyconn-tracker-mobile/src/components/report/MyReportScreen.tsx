import { useMemo, useState } from 'react';
import { formatMonthLabel, type PeriodLength } from '@exyconn/tracker-core';
import { useMyDay } from '../../hooks/useMyDay';
import { useMyReport } from '../../hooks/useMyReport';
import { usePeriodInsights } from '../../hooks/usePeriodInsights';
import { canGoForward, monthKeyOf, startOfMonth } from '../../lib/report/month';
import { Notice } from '../ui/Notice';
import { ScreenLayout } from '../ui/ScreenLayout';
import { Caption } from '../ui/Typography';
import { DayDetailPanel } from './DayDetailPanel';
import { MonthSwitcher } from './MonthSwitcher';
import { ReportActivityChart } from './ReportActivityChart';
import { ReportCalendar } from './ReportCalendar';
import { ReportDownloadButton } from './ReportDownloadButton';
import { ReportMonthChart } from './ReportMonthChart';
import { ReportOverview } from './overview/ReportOverview';
import { ReportTable } from './ReportTable';
import { ReportTotals } from './ReportTotals';
import { SegmentedControl, type SegmentOption } from '../ui/SegmentedControl';

type TabId = 'overview' | 'calendar' | 'days';

const TABS: readonly SegmentOption<TabId>[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'days', label: 'Days' },
];

interface Props {
  /** The employee's chosen zone: the day bounds and every timestamp below are read in it. */
  timezone: string;
}

/**
 * The employee's own tracked time. "Overview" compares the last 7 or 30 days with the period
 * before; "Calendar" browses it date by date, with that day's screenshots; "Days" keeps the
 * month-at-a-glance table. Nobody else's data is reachable here.
 */
export function MyReportScreen({ timezone }: Readonly<Props>) {
  const today = useMemo(() => new Date(), []);
  const [tab, setTab] = useState<TabId>('overview');
  const [length, setLength] = useState<PeriodLength>(7);
  const [month, setMonth] = useState<Date>(() => startOfMonth(today));
  const [selected, setSelected] = useState<Date>(today);

  const report = useMyReport(month, timezone);
  const day = useMyDay(selected, timezone);
  const insights = usePeriodInsights(length, timezone);
  const monthLabel = formatMonthLabel(month);

  const selectDate = (date: Date): void => {
    setSelected(date);
    setMonth(startOfMonth(date));
  };

  const refresh = (): void => {
    report.reload();
    day.reload();
    insights.reload();
  };

  return (
    <ScreenLayout onRefresh={refresh} refreshing={report.loading}>
      <Caption>This is your own tracked time, as your workspace sees it.</Caption>

      <SegmentedControl options={TABS} value={tab} onChange={setTab} label="Report view" full />

      {report.error === null ? null : <Notice severity="error">{report.error}</Notice>}

      {tab === 'overview' ? (
        <ReportOverview length={length} onLengthChange={setLength} insights={insights} />
      ) : null}

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
      ) : null}

      {tab === 'days' ? (
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
      ) : null}
    </ScreenLayout>
  );
}
