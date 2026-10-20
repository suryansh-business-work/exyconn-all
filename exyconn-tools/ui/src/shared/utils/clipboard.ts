import { logFailure } from './logFailure';

/** Copies text to the clipboard; a refusal (no permission, insecure context) is logged, never thrown. */
export function copyText(text: string): void {
  navigator.clipboard.writeText(text).catch(logFailure('Copy to clipboard failed'));
}
