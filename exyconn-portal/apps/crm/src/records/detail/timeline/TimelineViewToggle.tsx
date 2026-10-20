import { useSearchParams } from 'react-router-dom';
import TimelineIcon from '@mui/icons-material/Timeline';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { useT } from '@exyconn/i18n';
import { ToggleButton, ToggleButtonGroup } from '@exyconn/shell/components/ui';

export type TimelineView = 'timeline' | 'table';

const VIEW_PARAM = 'view';

/** The activity view, kept in the URL so a refresh or a shared link opens the same one. */
export function useTimelineView(): [TimelineView, (view: TimelineView) => void] {
  const [params, setParams] = useSearchParams();
  const view: TimelineView = params.get(VIEW_PARAM) === 'table' ? 'table' : 'timeline';
  const setView = (next: TimelineView) =>
    setParams(
      (current) => {
        current.set(VIEW_PARAM, next);
        return current;
      },
      { replace: true },
    );
  return [view, setView];
}

interface TimelineViewToggleProps {
  view: TimelineView;
  onChange: (view: TimelineView) => void;
}

/** Switches the activity between the timeline and a table. */
export function TimelineViewToggle({ view, onChange }: Readonly<TimelineViewToggleProps>) {
  const t = useT();
  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={view}
      aria-label={t('Activity view')}
      onChange={(_event, next: TimelineView | null) => {
        if (next) onChange(next);
      }}
    >
      <ToggleButton value="timeline">
        <TimelineIcon fontSize="small" sx={{ mr: 0.5 }} /> {t('Timeline')}
      </ToggleButton>
      <ToggleButton value="table">
        <TableRowsIcon fontSize="small" sx={{ mr: 0.5 }} /> {t('Table')}
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
