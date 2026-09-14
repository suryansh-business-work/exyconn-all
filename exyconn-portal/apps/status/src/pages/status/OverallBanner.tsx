import {
  CARD_RADIUS,
  Box,
  Flex,
  Typography,
  alpha,
  useTheme,
  iconSize,
} from '@exyconn/shell/components/ui';
import { useT } from '@exyconn/i18n';
import { formatWith } from '@exyconn/shell/utils/date';
import { STATE_META, TIME_FORMAT } from '../../status.constants';
import type { StatusOverview } from './status.types';

interface OverallBannerProps {
  overview: StatusOverview;
}

/** The headline: one sentence anyone can read in a second, in the state's colour. */
export function OverallBanner({ overview }: Readonly<OverallBannerProps>) {
  const t = useT();
  const theme = useTheme();
  const { headline, tone, icon: Icon } = STATE_META[overview.state];
  const color = theme.palette[tone].main;
  const checkedLine = t('Checked every {minutes} min · last updated {updated}', {
    minutes: overview.checkIntervalMinutes,
    updated: formatWith(overview.generatedAt, TIME_FORMAT),
  });

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: `${CARD_RADIUS}px`,
        border: 1,
        borderColor: alpha(color, 0.4),
        bgcolor: alpha(color, 0.08),
      }}
    >
      <Flex alignItems="center" spacing={2}>
        <Icon sx={{ fontSize: iconSize['4xl'], color }} />
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
            }}
          >
            {t(headline)}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
            }}
          >
            {t('{operational} of {total} services operational · {checked}', {
              operational: overview.operational,
              total: overview.total,
              checked: checkedLine,
            })}
          </Typography>
        </Box>
      </Flex>
    </Box>
  );
}
