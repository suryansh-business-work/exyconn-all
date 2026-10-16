import { Box } from '@/components/ui';
import { panel } from '../../glass/glass';
import { SkeletonBone } from './SkeletonBone';
import { SkeletonStatus } from './SkeletonStatus';
import { skeletonKeys } from './skeletonContext';

interface PanelSkeletonProps {
  /** Lines of content under the heading. */
  lines?: number;
  /** Draws the panel's heading bar. */
  title?: boolean;
  /** Draws the bones without the panel surface — for a section already inside a card. */
  bare?: boolean;
  label?: string;
}

/** A panel of text: a heading and a few lines, the last one shorter, as prose ends. */
export function PanelSkeleton({
  lines = 3,
  title = true,
  bare = false,
  label,
}: Readonly<PanelSkeletonProps>) {
  const keys = skeletonKeys(lines, 'line');
  const lastKey = keys.at(-1);
  return (
    <SkeletonStatus label={label} sx={bare ? undefined : [panel, { mb: 2 }]}>
      {title ? (
        <SkeletonBone
          variant="text"
          data-testid="skeleton-panel-title"
          sx={{ width: '30%', fontSize: 'h6.fontSize', mb: 1 }}
        />
      ) : null}
      <Box>
        {keys.map((key) => (
          <SkeletonBone
            key={key}
            variant="text"
            data-testid="skeleton-line"
            sx={{ width: key === lastKey ? '60%' : '100%' }}
          />
        ))}
      </Box>
    </SkeletonStatus>
  );
}
