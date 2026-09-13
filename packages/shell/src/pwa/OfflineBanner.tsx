import CloudOffIcon from '@mui/icons-material/CloudOff';
import { Alert, Snackbar } from '@/components/ui';
import { useOnline } from './useOnline';

/**
 * Says so when the network has gone, because an installed portal keeps opening without one.
 *
 * Nothing is cached but the shell — an invoice or a payslip from an hour ago would be worse
 * than no answer — so what a person can do offline is read this and wait. Saying that plainly
 * beats a screen of failed queries.
 */
export function OfflineBanner() {
  const online = useOnline();

  return (
    <Snackbar open={!online} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
      <Alert severity="warning" variant="filled" icon={<CloudOffIcon fontSize="inherit" />}>
        You are offline. Anything you save will not reach the server until the connection is back.
      </Alert>
    </Snackbar>
  );
}
