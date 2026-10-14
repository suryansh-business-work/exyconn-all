import { useT } from '@exyconn/i18n';
import { Box, ButtonBase } from '@exyconn/shell/components/ui';
import { useWaPalette } from '../../../theme/useWa';
import { WA_FONT, WA_SIZE, WA_SPACE } from '../../../theme/wa.tokens';
import { Bubble } from './Bubble';
import { MapArt } from './MapArt';
import { MessageText } from './MessageText';
import type { ContentProps } from './types';

const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=';

/** A shared location: a map with a pin, the place and its address; opens real maps. */
export function LocationMessage({ content, frame }: ContentProps<'location'>) {
  const t = useT();
  const c = useWaPalette();
  const { location } = content;
  const open = () => {
    globalThis.open(`${MAPS_URL}${location.lat},${location.lng}`, '_blank', 'noopener,noreferrer');
  };
  return (
    <Box sx={{ width: WA_SIZE.card, maxWidth: '100%' }}>
      <Bubble mine={false} tail={frame.tail} time={frame.time} flush>
        <ButtonBase
          onClick={open}
          aria-label={t('Open {name} in maps', { name: location.name })}
          sx={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            fontFamily: 'inherit',
            overflow: 'hidden',
          }}
        >
          <MapArt height={WA_SIZE.map} label={t('Map of {name}', { name: location.name })} />
          <Box sx={{ p: `${WA_SPACE.xs} ${WA_SPACE.sm} 0` }}>
            <Box sx={{ fontSize: WA_FONT.preview, color: c.link, fontWeight: 500 }}>
              {location.name}
            </Box>
            <Box sx={{ fontSize: WA_FONT.small, color: c.textMuted }}>{location.address}</Box>
          </Box>
        </ButtonBase>
        {content.caption ? (
          <Box sx={{ p: `${WA_SPACE.xs} ${WA_SPACE.sm} 0` }}>
            <MessageText text={content.caption} />
          </Box>
        ) : null}
      </Bubble>
    </Box>
  );
}
