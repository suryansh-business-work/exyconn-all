import { addMonths, subMonths } from 'date-fns';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useI18n, useT } from '@exyconn/i18n';
import { Flex, Heading, IconButton, Text } from '@exyconn/shell/components/ui';
import { STATUS_TONE } from './calendar.status';

interface CalendarToolbarProps {
  month: Date;
  onMonth: (month: Date) => void;
}

/** The month shown, the way to the one before and after, and what each colour means. */
export function CalendarToolbar({ month, onMonth }: Readonly<CalendarToolbarProps>) {
  const t = useT();
  const { locale } = useI18n();
  // The month's name in the reader's own language; no pattern is written down here.
  const title = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(month);
  return (
    <Flex direction="row" alignItems="center" spacing={1} wrap sx={{ mb: 1.5 }}>
      <IconButton aria-label={t('Previous month')} onClick={() => onMonth(subMonths(month, 1))}>
        <ChevronLeftIcon />
      </IconButton>
      <Heading level={6} sx={{ minWidth: 150, textAlign: 'center' }}>
        {title}
      </Heading>
      <IconButton aria-label={t('Next month')} onClick={() => onMonth(addMonths(month, 1))}>
        <ChevronRightIcon />
      </IconButton>
      <Flex direction="row" spacing={1.5} wrap sx={{ ml: 'auto' }}>
        {Object.values(STATUS_TONE).map((status) => (
          <Text
            key={status.label}
            size="caption"
            sx={{ pl: 0.5, borderLeft: 3, borderColor: status.tone }}
          >
            {t(status.label)}
          </Text>
        ))}
      </Flex>
    </Flex>
  );
}
