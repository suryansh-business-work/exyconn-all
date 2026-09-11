import { YStack } from 'tamagui';
import { formatCount } from '@exyconn/tracker-core';
import { Notice } from '../ui/Notice';
import { Body, Caption } from '../ui/Typography';
import { SkeletonBlock } from '../report/SkeletonBlock';

const SKELETONS = ['a', 'b', 'c', 'd'] as const;

/**
 * On the desktop this is the activity chip's tooltip. A phone has no hover, so it is said once,
 * above the day's shots, where every "0% active" chip can be read against it.
 */
const PENDING_HINT =
  'Activity is measured over the interval each screenshot belongs to. A screenshot is uploaded from inside its interval, so a shot that has landed before its interval reads 0% until the next sync.';

interface EmptyProps {
  loading: boolean;
  error: string | null;
  /** Says what is being waited on while the list is still loading. */
  loadingLabel: string;
}

/** Loading, failed, or a day with nothing on it — whatever stands in for the shots. */
export function GalleryEmpty({ loading, error, loadingLabel }: Readonly<EmptyProps>) {
  if (error !== null) {
    return <Notice severity="error">{error}</Notice>;
  }
  if (loading) {
    return (
      <YStack gap="$3" accessible accessibilityLabel={loadingLabel}>
        {SKELETONS.map((id) => (
          <SkeletonBlock key={id} height={200} />
        ))}
      </YStack>
    );
  }
  return (
    <Body color="$muted" textAlign="center" paddingVertical="$8">
      No screenshots were captured on this day.
    </Body>
  );
}

/** How many shots the day holds, and how to read their activity. */
export function GalleryIntro({ count }: Readonly<{ count: number }>) {
  return (
    <YStack gap="$1.5" paddingBottom="$1">
      <Caption fontWeight="600">{formatCount(count)} captured</Caption>
      <Caption>{PENDING_HINT}</Caption>
    </YStack>
  );
}
