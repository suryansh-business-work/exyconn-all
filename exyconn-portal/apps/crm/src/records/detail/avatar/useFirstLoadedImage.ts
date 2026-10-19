import { useEffect, useState } from 'react';

/**
 * Loads each source in turn until one arrives, then reports it; reports an empty string when
 * none loads. Returns a cancel function that drops any answer still on its way.
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
    image = new Image();
    image.onload = () => onDone(src);
    image.onerror = () => tryAt(index + 1);
    image.src = src;
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
