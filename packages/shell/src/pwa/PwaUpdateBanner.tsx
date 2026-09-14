import { Alert, Button, Snackbar } from '@/components/ui';
import { usePwaUpdate } from './usePwaUpdate';

/**
 * Tells somebody a newer version of this portal is ready, and lets them take it when they
 * are between two pieces of work rather than in the middle of one.
 *
 * Deliberately quiet and dismissible: nothing here is urgent enough to interrupt a form.
 */
export function PwaUpdateBanner() {
  const { ready, apply } = usePwaUpdate();

  return (
    <Snackbar open={ready} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
      <Alert
        severity="info"
        variant="filled"
        action={
          <Button color="inherit" size="small" onClick={apply}>
            Reload
          </Button>
        }
      >
        A new version of this portal is ready.
      </Alert>
    </Snackbar>
  );
}
