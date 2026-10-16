import { useMemo, useContext, type ReactNode } from 'react';
import { useT, type Interpolations } from '@exyconn/i18n';
import { Box, useMediaQuery, type SxProps, type Theme } from '@/components/ui';
import { SkeletonContext, type BoneAnimation } from './skeletonContext';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/** Hidden from sight, still read aloud — the words a screen reader hears instead of the bones. */
const VISUALLY_HIDDEN = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: '-1px',
  p: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const;

interface SkeletonStatusProps {
  children: ReactNode;
  /** What is loading, as an English source string; translated here. */
  label?: string;
  /** Values for a {placeholder} in the label. */
  labelValues?: Interpolations;
  sx?: SxProps<Theme>;
}

/**
 * The live region every skeleton sits in: `role="status"`, busy, and a translated label, so a
 * screen reader hears "Loading" where a sighted person sees the shape of the page arriving.
 *
 * Nested inside another one (a detail skeleton holds a header skeleton) it is a plain box —
 * one page loading is one announcement. It also decides, once, whether the bones pulse.
 */
export function SkeletonStatus({
  children,
  label = 'Loading',
  labelValues,
  sx,
}: Readonly<SkeletonStatusProps>) {
  const t = useT();
  const parent = useContext(SkeletonContext);
  const reducedMotion = useMediaQuery(REDUCED_MOTION);
  const animation: BoneAnimation = reducedMotion ? false : 'pulse';
  const scope = useMemo(() => ({ animation, inStatus: true }), [animation]);

  if (parent.inStatus) {
    return <Box sx={sx}>{children}</Box>;
  }
  return (
    <SkeletonContext.Provider value={scope}>
      <Box role="status" aria-busy="true" aria-live="polite" sx={sx}>
        <Box component="span" sx={VISUALLY_HIDDEN}>
          {t(label, labelValues)}
        </Box>
        {children}
      </Box>
    </SkeletonContext.Provider>
  );
}
