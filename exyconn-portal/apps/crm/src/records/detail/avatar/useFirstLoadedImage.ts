import { useEffect, useState } from 'react';

/**
 * The widest image that is still refused. Google's favicon service answers a domain it has no
 * icon for with a 16px generic globe (behind a 404 the browser ignores for images), so a 16px
 * answer is that globe — or an icon too small to show — and the next source is tried instead.
 */
const PLACEHOLDER_WIDTH = 16;

/**
 * Loads each source in turn until one arrives (larger than a placeholder), then reports it;
 * reports an empty string when none loads. Returns a cancel function that drops any answer
 * still on its way.
 */
export function loadFirstImage(
  sources: readonly string[],
  onDone: (src: string) => void,
): () => void {
  let image: HTMLImageElement | null = null;
  const tryAt = (index: number) => {
    const src = sources[index];
    if (src === undefined) {
      onDone('');
      return;
    }
    const next = new Image();
    image = next;
    next.onload = () => {
      if (next.naturalWidth > PLACEHOLDER_WIDTH) {
        onDone(src);
      } else {
        tryAt(index + 1);
      }
    };
    next.onerror = () => tryAt(index + 1);
    next.src = src;
  };
  tryAt(0);
  return () => {
    if (image) {
      image.onload = null;
      image.onerror = null;
    }
  };
}

const SEPARATOR = '\n';

/**
 * The first of `sources` that actually loads, or empty while they load and when none does — so
 * an avatar never shows a broken image, only a picture that is known to work or the initials.
 */
export function useFirstLoadedImage(sources: readonly string[]): string {
  const key = sources.join(SEPARATOR);
  const [loaded, setLoaded] = useState({ key: '', src: '' });
  useEffect(() => {
    if (!key) {
      return undefined;
    }
    return loadFirstImage(key.split(SEPARATOR), (src) => setLoaded({ key, src }));
  }, [key]);
  return loaded.key === key ? loaded.src : '';
}
