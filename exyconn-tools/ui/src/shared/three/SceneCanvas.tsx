import React, { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { detectQuality } from './quality';
import type { SceneVariant } from './scene';

interface SceneCanvasProps {
  variant: SceneVariant;
}

/**
 * Masks that keep the scene out from behind the copy: on wide screens it fades in from the
 * right, on phones (where copy spans the width) it is dimmed throughout.
 */
const MASKS: Readonly<Record<SceneVariant, { xs: string; md: string }>> = {
  hub: {
    xs: 'linear-gradient(180deg, rgba(0,0,0,0.5), rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.6))',
    md: 'linear-gradient(90deg, transparent 22%, rgba(0,0,0,0.35) 45%, #000 70%)',
  },
  band: {
    xs: 'linear-gradient(90deg, rgba(0,0,0,0.25), rgba(0,0,0,0.6))',
    md: 'linear-gradient(90deg, transparent 25%, rgba(0,0,0,0.5) 50%, #000 80%)',
  },
};

/** True when this browser can create a WebGL context at all. */
function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Defers work until the browser is idle after first paint. */
function whenIdle(callback: () => void): () => void {
  if ('requestIdleCallback' in globalThis) {
    const id = globalThis.requestIdleCallback(callback, { timeout: 1500 });
    return () => globalThis.cancelIdleCallback(id);
  }
  const id = globalThis.setTimeout(callback, 300);
  return () => globalThis.clearTimeout(id);
}

/**
 * Decorative WebGL layer. Three.js is code-split and only fetched once the page has
 * painted and the browser is idle; without WebGL the band's CSS gradient is all that shows,
 * and with reduced motion the scene draws a single still frame.
 */
const SceneCanvas: React.FC<Readonly<SceneCanvasProps>> = ({ variant }) => {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = container.current;
    if (!element || !supportsWebGL()) {
      return undefined;
    }
    let dispose: (() => void) | undefined;
    let cancelled = false;
    const cancelIdle = whenIdle(() => {
      import('./scene')
        .then(({ mountScene }) => {
          if (cancelled) return;
          const still = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
          dispose = mountScene(element, { variant, quality: detectQuality(), still });
          setReady(true);
        })
        .catch((error: unknown) => console.error('Decorative scene failed to load', error));
    });
    return () => {
      cancelled = true;
      cancelIdle();
      dispose?.();
    };
  }, [variant]);

  return (
    <Box
      ref={container}
      sx={{
        position: 'absolute',
        inset: 0,
        maskImage: { xs: MASKS[variant].xs, md: MASKS[variant].md },
        WebkitMaskImage: { xs: MASKS[variant].xs, md: MASKS[variant].md },
        '& canvas': {
          display: 'block',
          width: '100%',
          height: '100%',
          opacity: ready ? 1 : 0,
          transition: 'opacity 1.2s ease',
        },
        '@media (prefers-reduced-motion: reduce)': { '& canvas': { transition: 'none' } },
      }}
    />
  );
};

export default SceneCanvas;
