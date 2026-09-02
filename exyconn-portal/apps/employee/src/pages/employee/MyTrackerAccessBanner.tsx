import { Alert } from '@exyconn/shell/components/ui';
import type { MyTrackerAccessData } from '@exyconn/shell/pages/tracker-view/tracker.types';

interface MyTrackerAccessBannerProps {
  access: MyTrackerAccessData;
  formatDate: (value: string | Date | null | undefined) => string;
}

/** Shows the employee their own tracker access status at the top of the page. */
export function MyTrackerAccessBanner({
  access,
  formatDate,
}: Readonly<MyTrackerAccessBannerProps>) {
  if (!access?.isActive) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No tracker access — desktop tracking is not enabled for your account.
      </Alert>
    );
  }
  return (
    <Alert severity="success" sx={{ mb: 2 }}>
      Tracking enabled since {formatDate(access.grantedAt)}.
    </Alert>
  );
}
