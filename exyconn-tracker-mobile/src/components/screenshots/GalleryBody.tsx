import { useState } from 'react';
import { FlatList, RefreshControl, useWindowDimensions } from 'react-native';
import { useDayDetail } from '../../hooks/useMyDay';
import { galleryColumns, type DayRange } from '../../lib/screenshots/gallery-day';
import { useThemeColor } from '../../theme/useThemeColor';
import { GalleryEmpty, GalleryIntro } from './GalleryStatus';
import { ScreenshotCard } from './ScreenshotCard';
import { ScreenshotLightbox } from './ScreenshotLightbox';

interface Props {
  range: DayRange;
  timezone: string;
}

const PADDING = 16;
const GAP = 12;

/**
 * The employee's own screenshots for one day. Every shot carries the two things they are owed
 * about a photograph of their screen: exactly when it was taken (in their zone), and how active
 * the interval it was judging them on actually was.
 */
export function GalleryBody({ range, timezone }: Readonly<Props>) {
  const { detail, loading, error, reload } = useDayDetail(range.startISO, range.endISO);
  const shots = detail?.screenshots ?? [];
  /** Index of the shot open full screen, or null. Held here so paging can walk the day. */
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const ink = useThemeColor('ink');
  const { width } = useWindowDimensions();
  // Wide enough that a screenshot is actually legible — one column on a phone, more on a tablet.
  const columns = galleryColumns(width - PADDING * 2);
  const cardWidth = (width - PADDING * 2 - GAP * (columns - 1)) / columns;

  return (
    <>
      <FlatList
        // A FlatList cannot change its column count in place; a new key lays it out afresh.
        key={`columns-${columns}`}
        style={{ flex: 1 }}
        data={shots}
        numColumns={columns}
        keyExtractor={(shot) => shot.id}
        contentContainerStyle={{ padding: PADDING, gap: GAP, flexGrow: 1 }}
        columnWrapperStyle={columns > 1 ? { gap: GAP } : undefined}
        ListHeaderComponent={shots.length > 0 ? <GalleryIntro count={shots.length} /> : null}
        ListEmptyComponent={
          <GalleryEmpty loading={loading} error={error} loadingLabel="Loading your screenshots" />
        }
        refreshControl={
          <RefreshControl
            refreshing={loading && detail !== null}
            onRefresh={reload}
            tintColor={ink}
          />
        }
        renderItem={({ item, index }) => (
          <ScreenshotCard
            shot={item}
            timezone={timezone}
            width={cardWidth}
            onOpen={() => setOpenIndex(index)}
          />
        )}
      />
      <ScreenshotLightbox
        shots={shots}
        index={openIndex}
        timezone={timezone}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
      />
    </>
  );
}
