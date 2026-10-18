import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useT } from '@exyconn/i18n';
import { Alert, Button, Link } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useMeetingBookingPagePathQuery } from '@exyconn/shell/graphql/generated';
import { bookingLink } from './bookingLink';

/** The company's scheduling page, listing every open meeting type, to share as one link. */
export function BookingPageLink() {
  const t = useT();
  const notify = useNotify();
  const { data } = useMeetingBookingPagePathQuery();
  const path = data?.meetingBookingPagePath;
  if (!path) {
    return null;
  }
  const url = bookingLink(path);
  const copy = () => {
    globalThis.navigator.clipboard
      .writeText(url)
      .then(() => notify('Booking page link copied', 'success'))
      .catch((error: unknown) => {
        portalLogger.warn('crm: copying the booking page link failed', error);
        notify('Could not copy the link', 'error');
      });
  };
  return (
    <Alert
      severity="info"
      sx={{ mb: 2 }}
      action={
        <Button color="inherit" size="small" startIcon={<ContentCopyIcon />} onClick={copy}>
          {t('Copy')}
        </Button>
      }
    >
      {t('Your booking page:')}{' '}
      <Link href={url} target="_blank" rel="noopener noreferrer">
        {url}
      </Link>
    </Alert>
  );
}
