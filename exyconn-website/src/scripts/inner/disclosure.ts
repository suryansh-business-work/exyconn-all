/**
 * A <details> that is a disclosure on phones and always open from `query` up (the filter
 * sheet, the TOC). Without JavaScript it simply stays a disclosure.
 */
export const openFrom = (details: HTMLDetailsElement, query: string): void => {
  const media = globalThis.matchMedia(query);
  const sync = () => {
    if (media.matches) {
      details.open = true;
    }
  };
  sync();
  media.addEventListener("change", sync);
};
