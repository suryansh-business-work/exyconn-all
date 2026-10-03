import type { ReactElement } from 'react';
import { useState } from 'react';
import { Alert, IconButton, Stack, TextField } from '@exyconn/ui';
import SendRounded from '@mui/icons-material/SendRounded';
import { useT } from '@exyconn/i18n';
import { messageOf } from '../run';
import { useAnnounce } from '../a11y/LiveAnnouncer';

/** The portal refuses anything longer, so the field stops before the round trip does. */
const MAX_CHARS = 2000;

interface Props {
  sending: boolean;
  onSend: (body: string) => Promise<void>;
}

/**
 * Where the employee writes back.
 *
 * Enter sends and Shift+Enter starts a line, which is what every chat this sits beside does.
 * The box only clears once the portal has taken the message — clearing on the press would
 * lose what somebody typed the first time their wifi dropped.
 */
export default function MessageComposer({ sending, onSend }: Readonly<Props>): ReactElement {
  const t = useT();
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const canSend = body.trim() !== '' && !sending;
  useAnnounce(error, 'assertive');

  const submit = (): void => {
    if (!canSend) {
      return;
    }
    setError(null);
    onSend(body.trim())
      .then(() => setBody(''))
      .catch((cause: unknown) => {
        console.error('Sending the message failed', cause);
        setError(
          messageOf(
            cause,
            t('Your message could not be sent. Check your connection and try again.'),
          ),
        );
      });
  };

  return (
    <Stack spacing={1}>
      {error === null ? null : <Alert severity="error">{error}</Alert>}
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: 'flex-end',
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          size="small"
          label={t('Message')}
          placeholder={t('Write to your workspace…')}
          value={body}
          disabled={sending}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          slotProps={{
            htmlInput: { maxLength: MAX_CHARS },
          }}
        />
        <IconButton
          color="primary"
          aria-label={t('Send message')}
          loading={sending}
          disabled={!canSend}
          onClick={submit}
        >
          <SendRounded />
        </IconButton>
      </Stack>
    </Stack>
  );
}
