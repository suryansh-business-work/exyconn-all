import { panel } from '../../glass/glass';
import { SkeletonBone } from './SkeletonBone';
import { SkeletonStatus } from './SkeletonStatus';

interface ChartSkeletonProps {
  /** The plot's height in px, matching the chart it stands in for. */
  height?: number;
  label?: string;
}

/** A chart panel: its title, then the plot area. */
export function ChartSkeleton({ height = 240, label }: Readonly<ChartSkeletonProps>) {
  return (
    <SkeletonStatus label={label} sx={[panel, { mb: 2 }]}>
      <SkeletonBone variant="text" sx={{ width: '30%', fontSize: 'h6.fontSize', mb: 1.5 }} />
      <SkeletonBone variant="rounded" data-testid="skeleton-chart" sx={{ height }} />
    </SkeletonStatus>
  );
}
