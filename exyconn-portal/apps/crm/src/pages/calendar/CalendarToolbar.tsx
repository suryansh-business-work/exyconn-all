import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useFormatters, useI18n, useT } from '@exyconn/i18n';
import {
  Button,
  Flex,
  Heading,
  IconButton,
  Text,
  ToggleButton,
  ToggleButtonGroup,
} from '@exyconn/shell/components/ui';
import { KIND_STYLE } from './calendar.kinds';
import { VIEWS, type CalendarView } from './calendar.grid';

const VIEW_LABEL: Readonly<Record<CalendarView, string>> = {
  month: 'Month',
  week: 'Week',
  day: 'Day',
};

interface CalendarToolbarProps {
  view: CalendarView;
  anchor: Date;
  days: readonly Date[];
  onView: (view: CalendarView) => void;
  onStep: (step: 1 | -1) => void;
  onToday: () => void;
}

/** The period shown, the way back and forward, the view switch and what each colour means. */
export function CalendarToolbar({
  view,
  anchor,
  days,
  onView,
  onStep,
  onToday,
}: Readonly<CalendarToolbarProps>) {
  const t = useT();
  const { locale } = useI18n();
  const { formatDate } = useFormatters();
  const monthTitle = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
    anchor,
  );
  const rangeTitle = t('{from} to {to}', {
    from: formatDate(days[0]),
    to: formatDate(days.at(-1) ?? days[0]),
  });
  const titles: Record<CalendarView, string> = {
    month: monthTitle,
    week: rangeTitle,
    day: formatDate(anchor),
  };
  return (
    <Flex direction="column" spacing={1} sx={{ mb: 1.5 }}>
      <Flex direction="row" alignItems="center" spacing={1} wrap>
        <IconButton aria-label={t('Previous')} onClick={() => onStep(-1)}>
          <ChevronLeftIcon />
        </IconButton>
        <Heading level={6} sx={{ minWidth: 150, textAlign: 'center' }}>
          {titles[view]}
        </Heading>
        <IconButton aria-label={t('Next')} onClick={() => onStep(1)}>
          <ChevronRightIcon />
        </IconButton>
        <Button size="small" variant="outlined" onClick={onToday}>
          {t('Today')}
        </Button>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={view}
          aria-label={t('Calendar view')}
          onChange={(_event, next: CalendarView | null) => {
            if (next) {
              onView(next);
            }
          }}
          sx={{ ml: { sm: 'auto' } }}
        >
          {VIEWS.map((option) => (
            <ToggleButton key={option} value={option}>
              {t(VIEW_LABEL[option])}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Flex>
      <Flex direction="row" spacing={1.5} wrap>
        {Object.values(KIND_STYLE).map((kind) => (
          <Text
            key={kind.label}
            size="caption"
            sx={{ pl: 0.5, borderLeft: 3, borderColor: kind.tone }}
          >
            {t(kind.label)}
          </Text>
        ))}
      </Flex>
    </Flex>
  );
}
