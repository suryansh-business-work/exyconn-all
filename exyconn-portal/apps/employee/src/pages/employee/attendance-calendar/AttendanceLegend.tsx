import { useT } from '@exyconn/i18n';
import { Box, Flex, Heading, Text } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { DAY_STATUS_STYLE, LEGEND_ORDER } from './dayStatusStyle';

/** What each colour means, and which one wins when a day has more than one. */
export function AttendanceLegend() {
  const t = useT();
  return (
    <Box component="section" aria-label={t('Calendar colours')} sx={[panel, { height: '100%' }]}>
      <Heading level={6}>{t('What the colours mean')}</Heading>
      <Box component="ul" sx={{ listStyle: 'none', p: 0, my: 1.5 }}>
        {LEGEND_ORDER.map((status) => {
          const style = DAY_STATUS_STYLE[status];
          return (
            <Flex component="li" key={status} direction="row" spacing={1} sx={{ mb: 1 }}>
              <Box
                sx={{
                  width: 14,
                  height: 14,
                  mt: 0.5,
                  flexShrink: 0,
                  borderRadius: 0.5,
                  bgcolor: style.tone,
                }}
              />
              <Box>
                <Text size="sm" weight="medium">
                  {t(style.label)}
                </Text>
                <Text component="p" size="caption" color="text.secondary">
                  {t(style.explanation)}
                </Text>
              </Box>
            </Flex>
          );
        })}
      </Box>
      <Text component="p" size="caption" color="text.secondary">
        {t(
          'A day shows one colour. What you marked comes first, then leave, then a holiday — so attendance marked on a holiday shows green. Today has a dark outline.',
        )}
      </Text>
    </Box>
  );
}
