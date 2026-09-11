import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import {
  AdapterDateFns,
  Alert,
  LocalizationProvider,
  Stack,
  Tab,
  Tabs,
  TRACKER_RADIUS,
  Typography,
} from '@exyconn/ui';
import DayDetailPanel from '../components/DayDetailPanel';
import MonthSwitcher from '../components/MonthSwitcher';
import ReportCalendar from '../components/ReportCalendar';
import ReportActivityChart from '../components/ReportActivityChart';
import ReportDownloadButton from '../components/ReportDownloadButton';
import ReportMonthChart from '../components/ReportMonthChart';
import ReportTable from '../components/ReportTable';
import ReportTotals from '../components/ReportTotals';
import { formatMonthLabel } from '@exyconn/tracker-core';
import useMyDay from '../hooks/useMyDay';
import useMyReport from '../hooks/useMyReport';

type TabId = 'calendar' | 'days';

interface Props {
  /** The employee's chosen zone: the day bounds and every timestamp below are read in it. */
  timezone: string;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** "2026-02" — the month as a file name can carry it, and as it sorts. */
function monthKeyOf(month: Date): string {
  return `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * The employee's own tracked time. "Calendar" browses it date by date, with that day's
 * screenshots; "Days" keeps the month-at-a-glance table. Nobody else's data is reachable here.
 */
export default function MyReportScreen({ timezone }: Readonly<Props>): ReactElement {
  const today = useMemo(() => new Date(), []);
  const [tab, setTab] = useState<TabId>('calendar');
  const [month, setMonth] = useState<Date>(() => startOfMonth(today));
  const [selected, setSelected] = useState<Date>(today);

  const { days, totals, loading, error } = useMyReport(month, timezone);
  const monthLabel = formatMonthLabel(month);
  const day = useMyDay(selected, timezone);
  const canGoForward = month.getTime() < startOfMonth(today).getTime();

  const selectDate = (date: Date): void => {
    setSelected(date);
    setMonth(startOfMonth(date));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Stack spacing={2}>
        <Stack spacing={0.25}>
          <Typography variant="h6">My Report</Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
            }}
          >
            This is your own tracked time, as your workspace sees it.
          </Typography>
        </Stack>

        <Tabs
          value={tab}
          onChange={(_event, next: TabId) => setTab(next)}
          variant="fullWidth"
          aria-label="Report view"
        >
          <Tab value="calendar" label="Calendar" />
          <Tab value="days" label="Days" />
        </Tabs>

        {error !== null ? (
          <Alert severity="error" variant="outlined" sx={{ borderRadius: `${TRACKER_RADIUS}px` }}>
            {error}
          </Alert>
        ) : null}

        {tab === 'calendar' && (
          <>
            <ReportCalendar
              days={days}
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
        )}

        {tab === 'days' && (
          <>
            <MonthSwitcher month={month} canGoForward={canGoForward} onChange={setMonth} />
            <ReportTotals totals={totals} />
            <ReportMonthChart days={days} monthLabel={monthLabel} />
            {/* Hours first, then how solid they were: the second chart only means something
                once the reader knows how long the days it describes actually were. */}
            <ReportActivityChart days={days} monthLabel={monthLabel} />
            <ReportTable days={days} loading={loading} />
            <ReportDownloadButton
              days={days}
              monthKey={monthKeyOf(month)}
              monthLabel={monthLabel}
            />
          </>
        )}
      </Stack>
    </LocalizationProvider>
  );
}
