import { useRouter } from 'expo-router';
import { XStack, YStack } from 'tamagui';
import { dayBounds, formatCount, formatDayLabel, type DayDetail } from '@exyconn/tracker-core';
import { dayTotals, inputSummary } from '../../lib/report/totals';
import { galleryRoute } from '../../lib/screenshots/gallery-day';
import { AppButton } from '../ui/AppButton';
import { Notice } from '../ui/Notice';
import { Surface } from '../ui/Surface';
import { Caption, Heading } from '../ui/Typography';
import { ReportTotals } from './ReportTotals';
import { ScreenshotGrid } from './ScreenshotGrid';
import { SkeletonBlock } from './SkeletonBlock';

interface Props {
  date: Date;
  detail: DayDetail | null;
  loading: boolean;
  error: string | null;
  timezone: string;
}

const SKELETON_TILES = ['t1', 't2', 't3', 't4'] as const;

function DaySkeleton() {
  return (
    <YStack gap="$2" accessible accessibilityLabel="Loading this day">
      <SkeletonBlock height={72} />
      <Surface flexDirection="row" flexWrap="wrap" justifyContent="space-between" rowGap="$3">
        {SKELETON_TILES.map((id) => (
          <SkeletonBlock key={id} width="48%" height={96} />
        ))}
      </Surface>
    </YStack>
  );
}

/** The selected day: its totals, then that day's screenshots — which open in the gallery. */
export function DayDetailPanel({ date, detail, loading, error, timezone }: Readonly<Props>) {
  const router = useRouter();
  const heading = <Heading>{formatDayLabel(date)}</Heading>;

  // The gallery loads its own data, so it is handed the same bounds this panel used — the day
  // as it runs in the EMPLOYEE'S zone, not this phone's.
  const openGallery = (): void => {
    router.push(galleryRoute(dayBounds(date, timezone)));
  };

  if (error !== null) {
    return (
      <YStack gap="$2">
        {heading}
        <Notice severity="error">{error}</Notice>
      </YStack>
    );
  }

  if (loading || detail === null) {
    return (
      <YStack gap="$2">
        {heading}
        <DaySkeleton />
      </YStack>
    );
  }

  return (
    <YStack gap="$2">
      {heading}
      <ReportTotals totals={dayTotals(detail)} />
      <Caption>{inputSummary(detail)}</Caption>
      <Surface>
        <XStack alignItems="center" justifyContent="space-between" gap="$2">
          <Heading size="$4">Screenshots ({formatCount(detail.screenshots.length)})</Heading>
          {detail.screenshots.length > 0 ? (
            <AppButton
              label="Open gallery"
              tone="text"
              icon="image-multiple"
              onPress={openGallery}
            />
          ) : null}
        </XStack>
        <ScreenshotGrid shots={detail.screenshots} timezone={timezone} onOpen={openGallery} />
      </Surface>
    </YStack>
  );
}
