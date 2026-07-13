import { useState } from 'react';
import { Box, Chip, Dialog, DialogContent, Flex, Text } from '@/components/ui';
import type { DateTimeFormatter, TrackerScreenshotData } from './tracker.types';

interface TrackerScreenshotGalleryProps {
  screenshots: readonly TrackerScreenshotData[];
  formatDateTime: DateTimeFormatter;
}

/** Presentational screenshot grid; clicking a thumbnail opens a larger dialog. */
export function TrackerScreenshotGallery({
  screenshots,
  formatDateTime,
}: Readonly<TrackerScreenshotGalleryProps>) {
  const [active, setActive] = useState<TrackerScreenshotData | null>(null);

  if (screenshots.length === 0) {
    return (
      <Text size="sm" color="text.secondary">
        No screenshots captured.
      </Text>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
          gap: 1,
        }}
      >
        {screenshots.map((shot) => (
          <Box
            key={shot.id}
            component="button"
            type="button"
            onClick={() => setActive(shot)}
            aria-label={`Open screenshot from ${formatDateTime(shot.capturedAt)}`}
            sx={{
              p: 0,
              border: 0,
              cursor: 'pointer',
              borderRadius: 1,
              overflow: 'hidden',
              position: 'relative',
              bgcolor: 'transparent',
            }}
          >
            <Box
              component="img"
              src={shot.imageUrl}
              alt=""
              sx={{ width: '100%', height: 72, objectFit: 'cover', display: 'block' }}
            />
            {shot.blurred && (
              <Chip label="Blurred" size="small" sx={{ position: 'absolute', top: 4, left: 4 }} />
            )}
          </Box>
        ))}
      </Box>

      <Dialog open={Boolean(active)} onClose={() => setActive(null)} maxWidth="md" fullWidth>
        <DialogContent>
          {active && (
            <Box>
              <Box
                component="img"
                src={active.imageUrl}
                alt={`Screenshot from ${formatDateTime(active.capturedAt)}`}
                sx={{ width: '100%', height: 'auto', borderRadius: 1, display: 'block' }}
              />
              <Flex direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
                <Text size="sm" color="text.secondary">
                  {formatDateTime(active.capturedAt)}
                </Text>
                {active.blurred && <Chip label="Blurred" size="small" />}
              </Flex>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
