/**
 * EVERY Google Meet selector and phrase the extension relies on, in one place.
 *
 * Best-effort, by design: Meet has no public DOM contract and changes its markup without
 * notice. The adapter therefore reads only what a person can SEE — ARIA labels, roles,
 * button text, live-region text — never Meet's obfuscated class names, hidden data or
 * network traffic. When Meet changes, update this file only; every reader reports
 * "don't know" (UNKNOWN, no state change, no participants) rather than guessing.
 *
 * Phrases are English: Meet's UI language is the user's. In another language detection
 * degrades to UNKNOWN / unchanged state, which never triggers a reminder.
 */

/** Buttons, toggles and menu items whose text or label carries meaning. */
export const CONTROL_SELECTOR =
  'button, [role="button"], [role="menuitem"], [role="switch"], [role="menuitemcheckbox"]';

/** Places Meet writes status text: headings, alerts and live regions. */
export const STATUS_SELECTOR =
  'h1, h2, [role="heading"], [role="alert"], [role="status"], [aria-live]';

/** The in-call controls: their presence is what "in the meeting" means. */
export const IN_CALL_SELECTOR = [
  'button[aria-label*="Leave call" i]',
  '[role="button"][aria-label*="Leave call" i]',
  '[role="region"][aria-label*="Call controls" i]',
  '[role="toolbar"][aria-label*="Call controls" i]',
].join(', ');

/** Anything whose label mentions transcription — indicators, controls and switches. */
export const TRANSCRIPTION_LABEL_SELECTOR = '[aria-label*="transcri" i]';

/** The People panel's list: when it is visible the roster is complete. */
export const PEOPLE_LIST_SELECTOR = '[role="list"][aria-label*="Participants" i]';
export const PEOPLE_ITEM_SELECTOR = '[role="listitem"]';

/** Video tiles and the element in a tile that shows the person's name. */
export const TILE_SELECTOR = '[data-participant-id]';
export const TILE_NAME_SELECTOR = '[data-self-name], [data-participant-name]';
/** Meet marks the signed-in user's own tile name with this attribute. */
export const SELF_NAME_ATTRIBUTE = 'data-self-name';

/** Meet's "Activities" / "Meeting tools" button, which opens the panel holding Transcripts. */
export const ACTIVITIES_SELECTOR = [
  'button[aria-label*="Activities" i]',
  'button[aria-label*="Meeting tools" i]',
  '[role="button"][aria-label*="Activities" i]',
].join(', ');

/** A phrase that matches when the text equals one of `exact` or contains one of `contains`. */
export interface Phrases {
  exact: readonly string[];
  contains: readonly string[];
}

export const PRE_JOIN_PHRASES: Phrases = {
  exact: ['join now', 'ask to join', 'switch here', 'join here too'],
  contains: ['ready to join?'],
};

export const JOINING_PHRASES: Phrases = {
  exact: ['joining…', 'joining...'],
  contains: ['asking to join', 'asking to be let in', 'when someone lets you in'],
};

export const RECONNECTING_PHRASES: Phrases = {
  exact: ['reconnecting', 'reconnecting…'],
  contains: ['trying to reconnect', 'lost your network connection'],
};

export const ENDED_PHRASES: Phrases = {
  exact: ['rejoin', 'return to home screen'],
  contains: [
    'you left the meeting',
    'you left the call',
    'removed from the meeting',
    'the call has ended',
    'meeting has ended',
  ],
};

/** Transcription is visibly running (an indicator, or the control offering to stop it). */
export const TRANSCRIPTION_ON_PHRASES: Phrases = {
  exact: ['transcribing'],
  contains: [
    'is being transcribed',
    'transcript is on',
    'transcription is on',
    'stop transcription',
    'stop transcript',
    'recording and transcribing',
  ],
};

/** The control is on screen and clearly offers to START transcription, i.e. it is off. */
export const TRANSCRIPTION_OFF_PHRASES: Phrases = {
  exact: [],
  contains: [
    'start transcription',
    'start transcript',
    'start transcribing',
    'transcription is off',
    'transcript is off',
  ],
};

/** Meet's page title prefixes ("Meet - Weekly sync"). */
export const TITLE_PREFIXES = ['Meet - ', 'Meet – ', 'Meet — '];
