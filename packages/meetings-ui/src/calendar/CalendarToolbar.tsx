import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useI18n, useT } from '@exyconn/i18n';
import { Button, Flex, Heading, IconButton, Text } from '@exyconn/shell/components/ui';
import { ENTRY_STYLE } from './calendar-kinds';

interface CalendarToolbarProps {
  month: Date;
  onStep: (step: 1 | -1) => void;
  onToday: () => void;
}

/** The month shown, the way back and forward, and what each colour means. */
export function CalendarToolbar({ month, onStep, onToday }: Readonly<CalendarToolbarProps>) {
  const t = useT();
  const { locale } = useI18n();
  const title = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(month);
  return (
    <Flex direction="column" spacing={1} sx={{ mb: 1.5 }}>
      <Flex direction="row" alignItems="center" spacing={1} wrap>
        <IconButton aria-label={t('Previous month')} onClick={() => onStep(-1)}>
          <ChevronLeftIcon />
        </IconButton>
        <Heading level={2} sx={{ typography: 'h6', minWidth: 150, textAlign: 'center' }}>
          {title}
        </Heading>
        <IconButton aria-label={t('Next month')} onClick={() => onStep(1)}>
          <ChevronRightIcon />
        </IconButton>
        <Button size="small" variant="outlined" onClick={onToday}>
          {t('Today')}
        </Button>
      </Flex>
      <Flex direction="row" spacing={1.5} wrap>
        {Object.values(ENTRY_STYLE).map((kind) => (
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
