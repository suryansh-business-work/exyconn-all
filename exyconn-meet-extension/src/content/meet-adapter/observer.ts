import { debounce } from '../../utils/debounce';

/** Quiet time after the last DOM change before the page is read again. */
export const OBSERVE_DEBOUNCE_MS = 1000;
/** A page that never goes quiet is still read at least this often. */
export const OBSERVE_MAX_WAIT_MS = 3000;

/**
 * One MutationObserver on the body, debounced — no polling. `onSettled` runs once the page
 * has been quiet for a second (and at least every few seconds while Meet keeps animating).
 * Returns a stop function that disconnects the observer and drops any pending read.
 */
export function watchPage(doc: Document, onSettled: () => void): () => void {
  const read = debounce(onSettled, OBSERVE_DEBOUNCE_MS, OBSERVE_MAX_WAIT_MS);
  const observer = new MutationObserver(() => read.schedule());
  observer.observe(doc.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['aria-label', 'aria-checked', 'aria-pressed', 'hidden', 'aria-hidden'],
    characterData: true,
  });
  read.schedule();
  return () => {
    observer.disconnect();
    read.cancel();
  };
}
