import { useT } from '@exyconn/i18n';
import { Alert } from '@exyconn/shell/components/ui';
import {
  ChartSkeleton,
  PageHeaderSkeleton,
  SkeletonStatus,
} from '@exyconn/shell/components/feedback/skeletons';

interface BuilderStateProps {
  loading: boolean;
  error?: Error;
  /** What is being opened: "page", "fragment". */
  label: string;
}

/** What the builder shows until its document and resources are ready. */
export function BuilderState({ loading, error, label }: Readonly<BuilderStateProps>) {
  const t = useT();
  const what = t(label);
  if (error) {
    return (
      <Alert severity="error">
        {t('Could not open the {what}: {reason}', { what, reason: error.message })}
      </Alert>
    );
  }
  if (loading) {
    return (
      <SkeletonStatus label="Opening the {what}" labelValues={{ what }}>
        <PageHeaderSkeleton />
        <ChartSkeleton height={480} />
      </SkeletonStatus>
    );
  }
  return <Alert severity="warning">{t('That {what} no longer exists.', { what })}</Alert>;
}
