import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { YStack } from 'tamagui';
import { useCaptureSync } from '../../hooks/useCaptureSync';
import {
  adjacentDay,
  firstParam,
  hasNextDay,
  resolveGalleryDay,
  type GalleryParams,
} from '../../lib/screenshots/gallery-day';
import { Notice } from '../ui/Notice';
import { GalleryBody } from './GalleryBody';
import { GalleryHeader } from './GalleryHeader';
import { GalleryEmpty } from './GalleryStatus';

interface Props {
  /** The route's params: `start`/`end` from My Report, or `capturedAt` from a notification. */
  params: GalleryParams;
  timezone: string;
}

/**
 * The screenshot gallery — the desktop's second window, as a modal route. It is handed a day
 * (never a token) and reads the portal through the same shared tracker as every other screen.
 * The day lives in the route's params, so day navigation and a deep link land identically.
 */
export function ScreenshotsScreen({ params, timezone }: Readonly<Props>) {
  const router = useRouter();
  const start = firstParam(params.start);
  const end = firstParam(params.end);
  const capturedAt = firstParam(params.capturedAt);
  const range = useMemo(
    () => resolveGalleryDay({ start, end, capturedAt }, timezone),
    [start, end, capturedAt, timezone],
  );
  const syncing = useCaptureSync(capturedAt);

  // Opened from a notification with the app closed, the gallery is the only screen there is.
  const close = (): void => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/report');
    }
  };

  const goTo = (direction: 'previous' | 'next'): void => {
    const next = range === null ? null : adjacentDay(range, direction, timezone);
    if (next !== null) {
      router.setParams({ start: next.startISO, end: next.endISO });
    }
  };

  let body = (
    <YStack padding="$4">
      <Notice severity="error" detail="Open a day from My Report to see its screenshots.">
        This link does not point at a day.
      </Notice>
    </YStack>
  );
  if (syncing) {
    body = (
      <YStack padding="$4">
        <GalleryEmpty loading error={null} loadingLabel="Uploading your latest screenshot" />
      </YStack>
    );
  } else if (range !== null) {
    // Keyed on the day, so paging to another day never carries an open shot across.
    body = <GalleryBody key={range.startISO} range={range} timezone={timezone} />;
  }

  return (
    <YStack flex={1} backgroundColor="$app">
      <GalleryHeader
        range={range}
        timezone={timezone}
        hasNext={range !== null && hasNextDay(range, new Date())}
        onClose={close}
        onPrevious={() => goTo('previous')}
        onNext={() => goTo('next')}
      />
      {body}
    </YStack>
  );
}
