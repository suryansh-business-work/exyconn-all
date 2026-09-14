import { format } from 'date-fns';
import { useT } from '@exyconn/i18n';
import { Box, Flex, Heading, Text } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import CelebrationIcon from '@mui/icons-material/Celebration';
import type { HolidayLike } from '@exyconn/shell/utils/upcomingHolidays';

interface HrUpcomingHolidaysProps {
  holidays: HolidayLike[];
  formatDate: (value: string) => string;
}

/** Next company holidays, soonest first. */
export function HrUpcomingHolidays({ holidays, formatDate }: Readonly<HrUpcomingHolidaysProps>) {
  const t = useT();
  return (
    <Box sx={[panel, { height: '100%' }]}>
      <Heading level={6}>{t('Upcoming holidays')}</Heading>
      {holidays.length === 0 && (
        <Text size="sm" color="text.secondary">
          {t('No holidays scheduled ahead.')}
        </Text>
      )}
      {holidays.map((holiday) => (
        <Flex key={holiday.id} direction="row" alignItems="center" spacing={1.5} sx={{ mt: 1.5 }}>
          <CelebrationIcon fontSize="small" color="warning" />
          <Box>
            <Text weight="medium">{holiday.name}</Text>
            <Text size="caption" color="text.secondary">
              {formatDate(holiday.date)} · {format(new Date(holiday.date), 'EEEE')}
            </Text>
          </Box>
        </Flex>
      ))}
    </Box>
  );
}
