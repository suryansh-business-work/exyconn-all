import { MyReportScreen } from '../../components/report/MyReportScreen';
import { useTrackerState } from '../../hooks/useTrackerState';

/** My Report — the employee's own tracked time, read in their chosen zone. */
export default function ReportRoute() {
  const state = useTrackerState();
  if (state === null) {
    return null;
  }
  return <MyReportScreen timezone={state.timezone} />;
}
