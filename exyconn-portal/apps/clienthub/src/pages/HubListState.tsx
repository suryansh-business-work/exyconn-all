import type { ReactNode } from 'react';
import { Alert } from '@exyconn/shell/components/ui';
import { CardGridSkeleton, SkeletonStatus } from '@exyconn/shell/components/feedback/skeletons';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';

interface HubListStateProps {
  /** True until the first answer arrives. */
  loading: boolean;
  /** The query's error, when nothing could be read. */
  error?: Error | null;
  errorText: string;
  isEmpty: boolean;
  emptyTitle: string;
  emptyDescription: string;
  /** The cards, shown once there is something to show. */
  children: ReactNode;
}

/** A hub list's loading, failed, empty and populated states, in that order of precedence. */
export function HubListState({
  loading,
  error,
  errorText,
  isEmpty,
  emptyTitle,
  emptyDescription,
  children,
}: Readonly<HubListStateProps>) {
  if (loading) {
    return (
      <SkeletonStatus>
        <CardGridSkeleton avatar={false} />
      </SkeletonStatus>
    );
  }
  if (error) {
    return <Alert severity="error">{errorMessage(error, errorText)}</Alert>;
  }
  if (isEmpty) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }
  return <>{children}</>;
}
