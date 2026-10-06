/**
 * A short two-note chime made with the Web Audio API — no audio file to download. Browsers
 * only let audio start after the visitor has interacted with the page, so the context is
 * created on the first click inside the chat (`primeAudio`).
 */
let context: AudioContext | null = null;

export function primeAudio(): void {
  if (context || !("AudioContext" in globalThis)) {
    return;
  }
  context = new globalThis.AudioContext();
}

function note(ctx: AudioContext, frequency: number, start: number): void {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + 0.3);
}

export function chime(): void {
  if (!context) {
    return;
  }
  const ctx = context;
  ctx
    .resume()
    .then(() => {
      note(ctx, 880, ctx.currentTime);
      note(ctx, 1318.5, ctx.currentTime + 0.12);
    })
    .catch((error: unknown) => console.warn("[chat] chime could not play", error));
}
