/**
 * Fixture markup shaped like the VISIBLE parts of Google Meet the adapter reads: ARIA labels,
 * roles and button text. Class names are deliberately absent — the adapter never uses them.
 */
export const PRE_JOIN = `
  <main>
    <h1>Ready to join?</h1>
    <button>Join now</button>
    <button>Other ways to join</button>
  </main>`;

export const ASKING_TO_JOIN = `
  <main><div role="status">Asking to join…</div></main>`;

export const IN_CALL = `
  <main>
    <div role="toolbar" aria-label="Call controls">
      <button aria-label="Turn off microphone"></button>
      <button aria-label="Leave call"></button>
      <button aria-label="Activities"></button>
    </div>
  </main>`;

export const IN_CALL_TRANSCRIBING = `
  ${IN_CALL}
  <div aria-label="This call is being transcribed"></div>`;

export const IN_CALL_TRANSCRIPT_OFF = `
  ${IN_CALL}
  <aside aria-label="Transcripts">
    <button>Start transcription</button>
  </aside>`;

export const IN_CALL_SWITCH_ON = `
  ${IN_CALL}
  <div role="switch" aria-label="Transcription" aria-checked="true"></div>`;

export const IN_CALL_SWITCH_OFF = `
  ${IN_CALL}
  <div role="switch" aria-label="Transcription" aria-checked="false"></div>`;

export const IN_CALL_TRANSCRIPT_HIDDEN_ON = `
  ${IN_CALL}
  <div hidden><div aria-label="This call is being transcribed"></div></div>`;

export const RECONNECTING = `
  ${IN_CALL}
  <div role="alert">Trying to reconnect…</div>`;

export const LEFT_MEETING = `
  <main><h1>You left the meeting</h1><button>Rejoin</button><button>Return to home screen</button></main>`;

const listItem = (name: string): string =>
  `<div role="listitem" aria-label="${name}">${name}</div>`;

const tile = (name: string, index: number): string =>
  `<div data-participant-id="p${index}"><span data-participant-name>${name}</span></div>`;

/** The call with Meet's People panel open, listing these names. */
export function peoplePanel(names: readonly string[]): string {
  const items = names.map(listItem).join('');
  return `${IN_CALL}<div role="list" aria-label="Participants">${items}</div>`;
}

/** The call with video tiles only: the user's own tile plus these names. */
export function tiles(names: readonly string[], self: string): string {
  const others = names.map(tile).join('');
  return `${IN_CALL}<div data-participant-id="self"><span data-self-name="You">${self}</span></div>${others}`;
}

/** Replaces the test document's body with fixture markup. */
export function render(html: string): Document {
  document.body.innerHTML = html;
  return document;
}
