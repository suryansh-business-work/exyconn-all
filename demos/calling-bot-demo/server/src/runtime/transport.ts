import type { TurnRole } from '../index';
import type { AudioFormat } from './audio';

/** What a call shows its caller as it goes (the browser call screen; a phone has no screen). */
export type CallEvent =
  | { type: 'turn'; role: TurnRole; text: string }
  /** `failed`: the call broke (a provider refused it) rather than being hung up or timed out. */
  | { type: 'ended'; reason: string; failed: boolean };

/** The line a conversation runs over: a browser socket or a Vobiz media stream. */
export interface Transport {
  readonly format: AudioFormat;
  /** Plays a chunk of the bot's voice to the caller. */
  play(audio: string): void;
  /** Drops the bot's voice still queued to play — the caller is talking. */
  clear(): void;
  /** Tells the caller's screen what happened, where there is one. */
  notify(event: CallEvent): void;
  /** Ends the line. */
  hangUp(): void;
}
