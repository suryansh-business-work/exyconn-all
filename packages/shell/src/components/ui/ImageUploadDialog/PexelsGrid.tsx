import { Box, ButtonBase, Grid2, Typography } from '@exyconn/ui';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import type { PexelsMediaFieldsFragment } from '@/graphql/generated';

/** mm:ss for a clip length, so a 95-second video reads as 1:35. */
const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
};

interface PexelsTileProps {
  item: PexelsMediaFieldsFragment;
  onPick: (item: PexelsMediaFieldsFragment) => void;
}

/** One result: its still frame, the credit Pexels requires, and the clip length. */
function PexelsTile({ item, onPick }: Readonly<PexelsTileProps>) {
  return (
    <ButtonBase
      onClick={() => onPick(item)}
      aria-label={`Use ${item.alt || 'this Pexels result'} by ${item.credit}`}
      sx={{
        position: 'relative',
        width: '100%',
        height: 110,
        borderRadius: 1,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        '&:hover .pexels-credit': { opacity: 1 },
      }}
    >
      <Box
        component="img"
        src={item.previewUrl}
        alt={item.alt}
        loading="lazy"
        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      {item.duration > 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            px: 0.5,
            borderRadius: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 0.25,
            bgcolor: 'rgba(0,0,0,0.6)',
            color: '#fff',
          }}
        >
          <PlayCircleIcon sx={{ fontSize: 12 }} />
          <Typography variant="caption">{formatDuration(item.duration)}</Typography>
        </Box>
      )}
      <Box
        className="pexels-credit"
        sx={{
          position: 'absolute',
          insetInline: 0,
          bottom: 0,
          px: 0.75,
          py: 0.25,
          opacity: 0,
          transition: 'opacity 120ms',
          bgcolor: 'rgba(0,0,0,0.6)',
          color: '#fff',
        }}
      >
        <Typography variant="caption" noWrap component="span">
          {item.credit}
        </Typography>
      </Box>
    </ButtonBase>
  );
}

interface PexelsGridProps {
  items: readonly PexelsMediaFieldsFragment[];
  onPick: (item: PexelsMediaFieldsFragment) => void;
}

/** Result grid shared by the stock photo and stock video tabs. */
export function PexelsGrid({ items, onPick }: Readonly<PexelsGridProps>) {
  return (
    <Grid2 container spacing={1}>
      {items.map((item) => (
        <Grid2 key={item.id} size={{ xs: 6, sm: 4 }}>
          <PexelsTile item={item} onPick={onPick} />
        </Grid2>
      ))}
    </Grid2>
  );
}
