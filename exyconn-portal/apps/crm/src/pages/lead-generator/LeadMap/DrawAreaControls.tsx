import DrawIcon from '@mui/icons-material/Draw';
import DoneIcon from '@mui/icons-material/Done';
import UndoIcon from '@mui/icons-material/Undo';
import ClearIcon from '@mui/icons-material/Clear';
import { useT } from '@exyconn/i18n';
import { Button, Flex, Paper, Stack, Text } from '@exyconn/shell/components/ui';
import { MAX_AREA_POINTS, MIN_AREA_POINTS } from '../forms/lead-search';
import type { SearchArea } from '../useSearchArea';

type Translate = ReturnType<typeof useT>;

/** What the drawing tool is doing, read out by screen readers as it changes. */
function statusOf(t: Translate, area: SearchArea, mapReady: boolean): string {
  const count = area.points.length;
  if (!mapReady) {
    return t('The map is loading…');
  }
  if (area.drawing && count >= MAX_AREA_POINTS) {
    return t('That is the most corners an area can have ({max}). Choose Finish area.', {
      max: MAX_AREA_POINTS,
    });
  }
  if (area.drawing) {
    return t(
      'Drawing: {count} corners. Click the map to add more, then Finish area (at least {min}).',
      {
        count,
        min: MIN_AREA_POINTS,
      },
    );
  }
  if (area.finished) {
    return t('Area ready with {count} corners. Drag a corner to adjust it, then search.', {
      count,
    });
  }
  return t(
    'Choose Draw area, then click the map to mark the corners. Drawing needs a mouse, pen or touch.',
  );
}

interface DrawAreaControlsProps {
  area: SearchArea;
  mapReady: boolean;
}

/** Real buttons for drawing the search area; the clicks themselves happen on the map. */
export function DrawAreaControls({ area, mapReady }: Readonly<DrawAreaControlsProps>) {
  const t = useT();
  const count = area.points.length;
  const drawLabel = count > 0 ? t('Redraw area') : t('Draw area');
  return (
    <Paper variant="outlined" sx={{ p: 1 }}>
      <Stack spacing={0.5}>
        <Flex direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          {area.drawing ? (
            <>
              <Button
                size="small"
                variant="contained"
                startIcon={<DoneIcon />}
                disabled={count < MIN_AREA_POINTS}
                onClick={area.finish}
              >
                {t('Finish area')}
              </Button>
              <Button
                size="small"
                startIcon={<UndoIcon />}
                disabled={count === 0}
                onClick={area.undo}
              >
                {t('Undo point')}
              </Button>
            </>
          ) : (
            <Button
              size="small"
              variant="contained"
              startIcon={<DrawIcon />}
              disabled={!mapReady}
              onClick={area.start}
            >
              {drawLabel}
            </Button>
          )}
          <Button
            size="small"
            startIcon={<ClearIcon />}
            disabled={count === 0 && !area.drawing}
            onClick={area.clear}
          >
            {t('Clear area')}
          </Button>
        </Flex>
        <Text size="caption" color="text.secondary" role="status">
          {statusOf(t, area, mapReady)}
        </Text>
      </Stack>
    </Paper>
  );
}
