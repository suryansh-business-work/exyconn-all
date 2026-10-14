import { useT } from '@exyconn/i18n';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Text,
} from '@exyconn/shell/components/ui';
import {
  CallingBotTurnRole,
  type CallingBotRecentCallsQuery,
} from '@exyconn/shell/graphql/generated';

export type CallRow = CallingBotRecentCallsQuery['callingBotRecentCalls'][number];

/** Everything said on one call, in order, and why it ended. */
export function CallTranscriptDialog({
  call,
  onClose,
}: Readonly<{ call: CallRow | null; onClose: () => void }>) {
  const t = useT();
  return (
    <Dialog
      open={Boolean(call)}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="call-transcript-title"
    >
      <DialogTitle id="call-transcript-title">{t('Call transcript')}</DialogTitle>
      <DialogContent dividers>
        {call?.transcript.length === 0 && (
          <Text color="text.secondary">{t('Nothing was said.')}</Text>
        )}
        <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1 }}>
          {call?.transcript.map((turn) => (
            <li key={`${turn.at}-${turn.role}`}>
              <Text size="caption" color="text.secondary">
                {turn.role === CallingBotTurnRole.Caller ? t('Caller') : t('Bot')}
              </Text>
              <Text sx={{ display: 'block' }}>{turn.text}</Text>
            </li>
          ))}
        </Box>
        {call?.endReason && (
          <Text size="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            {t('Ended: {reason}', { reason: call.endReason })}
          </Text>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('Close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
