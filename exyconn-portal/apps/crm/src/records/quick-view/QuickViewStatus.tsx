import { useT } from '@exyconn/i18n';
import { Alert, Button, Stack } from '@exyconn/shell/components/ui';
import {
  PanelSkeleton,
  SkeletonBone,
  SkeletonStatus,
} from '@exyconn/shell/components/feedback/skeletons';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';

interface QuickViewStatusProps {
  /** The query's error, if reading the record failed. */
  error?: unknown;
  onRetry: () => void;
  /** What the skeleton announces, e.g. "Loading the company". */
  loadingLabel: string;
  /** The message when the record could not be read, e.g. "Could not load the company." */
  errorText: string;
}

/** The quick view before its record arrives: a skeleton, or the error with Retry. */
export function QuickViewStatus({
  error,
  onRetry,
  loadingLabel,
  errorText,
}: Readonly<QuickViewStatusProps>) {
  const t = useT();
  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={onRetry}>
            {t('Retry')}
          </Button>
        }
      >
        {errorMessage(error, t(errorText))}
      </Alert>
    );
  }
  return (
    <SkeletonStatus label={loadingLabel}>
      <Stack spacing={1.5}>
        <SkeletonBone variant="rounded" width={56} height={56} />
        <SkeletonBone variant="text" sx={{ width: '60%' }} />
        <SkeletonBone variant="text" sx={{ width: '40%' }} />
        <PanelSkeleton lines={5} title={false} bare />
      </Stack>
    </SkeletonStatus>
  );
}
