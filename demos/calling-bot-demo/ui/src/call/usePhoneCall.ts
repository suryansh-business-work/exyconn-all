import { useCallback, useEffect, useState } from 'react';
import { useT } from '@exyconn/i18n';
import {
  CallingBotCallStatus,
  CallingBotChannel,
  useCallingBotCallQuery,
  useStartCallingBotCallMutation,
} from '@exyconn/shell/graphql/generated';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import type { CallPhase, TranscriptLine } from './transcript';

/** How often a phone call's transcript is refreshed while it runs. */
const POLL_MS = 2000;

const FINISHED = new Set([CallingBotCallStatus.Ended, CallingBotCallStatus.Failed]);

function phaseOf(status: CallingBotCallStatus | undefined, requested: boolean): CallPhase {
  if (!requested) {
    return 'idle';
  }
  if (status && FINISHED.has(status)) {
    return 'ended';
  }
  return status === CallingBotCallStatus.Live ? 'live' : 'connecting';
}

/**
 * A call with the bot on the caller's own phone: Vobiz rings the number, and the transcript is
 * followed here as the call goes. `scenarioId` is the example the bot plays; null keeps its own
 * settings.
 */
export function usePhoneCall(scenarioId: string | null) {
  const t = useT();
  const [startCall, { loading: starting }] = useStartCallingBotCallMutation();
  const [callId, setCallId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data, startPolling, stopPolling } = useCallingBotCallQuery({
    variables: { id: callId ?? '' },
    skip: !callId,
    fetchPolicy: 'network-only',
  });
  const call = data?.callingBotCall;
  const finished = Boolean(call && FINISHED.has(call.status));

  useEffect(() => {
    if (callId && !finished) {
      startPolling(POLL_MS);
    }
    return stopPolling;
  }, [callId, finished, startPolling, stopPolling]);

  const start = useCallback(
    async (phone: string) => {
      setError(null);
      try {
        const { data: started } = await startCall({
          variables: { input: { channel: CallingBotChannel.Phone, phone, scenarioId } },
        });
        setCallId(started?.startCallingBotCall.call.id ?? null);
      } catch (error_) {
        setError(errorMessage(error_, t('The phone call could not be placed.')));
      }
    },
    [scenarioId, startCall, t],
  );

  const lines: TranscriptLine[] = (call?.transcript ?? []).map((turn) => ({
    key: `${turn.at}-${turn.role}`,
    role: turn.role,
    text: turn.text,
  }));
  const startedAt = call?.answeredAt ? Date.parse(call.answeredAt) : null;

  return {
    phase: phaseOf(call?.status, Boolean(callId) || starting),
    status: call?.status ?? null,
    endReason: call?.endReason ?? '',
    lines,
    error: error ?? (call?.status === CallingBotCallStatus.Failed ? call.endReason : null),
    startedAt,
    start,
    reset: () => setCallId(null),
  };
}
