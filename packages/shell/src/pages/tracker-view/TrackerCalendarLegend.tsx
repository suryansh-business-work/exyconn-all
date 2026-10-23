import { useT } from '@exyconn/i18n';
import { MARK_MEANINGS, MARK_ORDER, MARK_WORDS } from '@exyconn/tracker-core';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, IconButton, Text, Tooltip } from '@/components/ui';
import { STATUS_ICONS, useStatusColors } from './tracker.status';

/**
 * What each tile colour means, drawn exactly as the tiles draw it, above the calendar. Each
 * tile names its mark; the info button in its bottom corner explains it on hover or keyboard focus.
 */
export function TrackerCalendarLegend() {
  const t = useT();
  const colors = useStatusColors();
  return (
    <Box
      component="ul"
      aria-label={t('Calendar legend')}
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))',
          sm: 'repeat(3, minmax(0, 1fr))',
          lg: 'repeat(6, minmax(0, 1fr))',
        },
        gap: 1,
        listStyle: 'none',
        m: 0,
        p: 0,
      }}
    >
      {MARK_ORDER.map((mark) => {
        const { hue, tint } = colors(mark);
        return (
          <Box
            component="li"
            key={mark}
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1,
              pb: 4,
              borderRadius: 1,
              border: 1,
              borderColor: hue,
              bgcolor: tint,
            }}
          >
            <Box aria-hidden sx={{ display: 'flex', fontSize: 20, color: hue }}>
              {STATUS_ICONS[mark]}
            </Box>
            <Text
              size="sm"
              weight="semibold"
              sx={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}
            >
              {t(MARK_WORDS[mark])}
            </Text>
            <Tooltip title={t(MARK_MEANINGS[mark])} describeChild>
              <IconButton
                size="small"
                aria-label={t('What {mark} means', { mark: t(MARK_WORDS[mark]) })}
                sx={{
                  position: 'absolute',
                  right: (theme) => theme.spacing(0.5),
                  bottom: (theme) => theme.spacing(0.5),
                  color: hue,
                }}
              >
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      })}
    </Box>
  );
}
