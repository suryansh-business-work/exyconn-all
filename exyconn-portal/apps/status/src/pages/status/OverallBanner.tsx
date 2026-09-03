import { Box, Flex, Typography, alpha, useTheme } from '@exyconn/shell/components/ui';
import { formatWith } from '@exyconn/shell/utils/date';
import { STATE_META, TIME_FORMAT } from '../../status.constants';
import type { StatusOverview } from './status.types';

interface OverallBannerProps {
  overview: StatusOverview;
}

/** The headline: one sentence anyone can read in a second, in the state's colour. */
export function OverallBanner({ overview }: Readonly<OverallBannerProps>) {
  const theme = useTheme();
  const { headline, tone, icon: Icon } = STATE_META[overview.state];
  const color = theme.palette[tone].main;
  const checkedLine = `Checked every ${overview.checkIntervalMinutes} min · last updated ${formatWith(overview.generatedAt, TIME_FORMAT)}`;

  return (
    <Box
      sx={{
        p: { xs: 2.5, md: 3.5 },
        borderRadius: 3,
        border: 1,
        borderColor: alpha(color, 0.4),
        bgcolor: alpha(color, 0.08),
      }}
    >
      <Flex alignItems="center" spacing={2}>
        <Icon sx={{ fontSize: 44, color }} />
        <Box>
          <Typography variant="h5" fontWeight={800}>
            {headline}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {overview.operational} of {overview.total} services operational · {checkedLine}
          </Typography>
        </Box>
      </Flex>
    </Box>
  );
}
