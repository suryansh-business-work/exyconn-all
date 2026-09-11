import type { ReactElement } from 'react';
import { useState } from 'react';
import { IconButton, Stack, TextField } from '@exyconn/ui';
import SendRounded from '@mui/icons-material/SendRounded';

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
  const [body, setBody] = useState('');
  const canSend = body.trim() !== '' && !sending;

  const submit = (): void => {
    if (!canSend) {
      return;
    }
    onSend(body.trim())
      .then(() => setBody(''))
      .catch((cause: unknown) => console.error('Sending the message failed', cause));
  };

  return (
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
        placeholder="Write to your workspace…"
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
          htmlInput: { maxLength: MAX_CHARS, 'aria-label': 'Message' },
        }}
      />
      <IconButton color="primary" aria-label="Send message" disabled={!canSend} onClick={submit}>
        <SendRounded />
      </IconButton>
    </Stack>
  );
}
