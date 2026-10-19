import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Alert, Button, Stack } from '@exyconn/shell/components/ui';
import { useRemembered, type CommsPanel } from '../commsStore';
import { StartCallForm } from '../forms/start-call';
import { CallNoteForm } from '../forms/call-note';

interface CallPanelProps {
  panel: CommsPanel;
  onClose: () => void;
}

/**
 * Click-to-call: pick the number and the agent's own phone, then Call. Once the provider has
 * queued it, the panel says the agent's phone is ringing and offers a notes box for the call.
 */
export function CallPanel({ panel, onClose }: Readonly<CallPanelProps>) {
  const t = useT();
  const [ringing, setRinging] = useRemembered(panel.key, 'ringing', false);
  const [failure, setFailure] = useState('');

  if (ringing) {
    return (
      <Stack spacing={2}>
        <Alert
          severity="info"
          role="status"
          action={
            <Button color="inherit" size="small" onClick={() => setRinging(false)}>
              {t('Call again')}
            </Button>
          }
        >
          {t('Ringing your phone — answer to connect to {name}', { name: panel.name })}
        </Alert>
        <CallNoteForm panel={panel} onCancel={onClose} />
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      {failure && (
        <Alert severity="error" role="alert">
          {failure}
        </Alert>
      )}
      <StartCallForm
        panel={panel}
        onStarted={() => {
          setFailure('');
          setRinging(true);
        }}
        onFailed={setFailure}
        onCancel={onClose}
      />
    </Stack>
  );
}
