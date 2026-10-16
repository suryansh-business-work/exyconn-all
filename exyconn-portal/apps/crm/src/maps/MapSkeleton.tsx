import { SkeletonBone, SkeletonStatus } from '@exyconn/shell/components/feedback/skeletons';

/** A map's box while Google Maps downloads: the same size, announced as loading. */
export function MapSkeleton({ height }: Readonly<{ height: number | string }>) {
  return (
    <SkeletonStatus label="Loading the map" sx={{ height }}>
      <SkeletonBone variant="rounded" data-testid="skeleton-map" sx={{ height: '100%' }} />
    </SkeletonStatus>
  );
}
