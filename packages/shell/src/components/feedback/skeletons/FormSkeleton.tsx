import { Stack } from '@/components/ui';
import { readingPanel } from '../../glass/glass';
import { SkeletonBone } from './SkeletonBone';
import { SkeletonStatus } from './SkeletonStatus';
import { skeletonKeys } from './skeletonContext';

interface FormSkeletonProps {
  fields?: number;
  /** Draws the form on its own panel; off for a form already inside a dialog or card. */
  surface?: boolean;
  label?: string;
}

/** A form: a column of outlined fields, then its actions on the right. */
export function FormSkeleton({ fields = 4, surface = true, label }: Readonly<FormSkeletonProps>) {
  return (
    <SkeletonStatus label={label} sx={surface ? readingPanel : undefined}>
      <Stack spacing={2}>
        {skeletonKeys(fields, 'field').map((key) => (
          <SkeletonBone
            key={key}
            variant="rounded"
            data-testid="skeleton-field"
            sx={{ height: 40 }}
          />
        ))}
      </Stack>
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', mt: 3 }}>
        <SkeletonBone variant="rounded" sx={{ width: 88, height: 36 }} />
        <SkeletonBone variant="rounded" sx={{ width: 104, height: 36 }} />
      </Stack>
    </SkeletonStatus>
  );
}
