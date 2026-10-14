import type { CallingBotTurnRole } from '@exyconn/shell/graphql/generated';

/** One line of a call's transcript, as the call screen lists it. */
export interface TranscriptLine {
  key: string;
  role: CallingBotTurnRole;
  text: string;
}

/** Where a call is, from the caller's side. */
export type CallPhase = 'idle' | 'connecting' | 'live' | 'ended';
