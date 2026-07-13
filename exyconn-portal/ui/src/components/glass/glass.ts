import type { Theme } from '@/components/ui';
import type { SystemStyleObject } from '@mui/system';

/**
 * Frosted-glass surface style, adapted to the active color mode. Use inside an sx
 * array, e.g. `sx={[glass, { p: 2 }]}`, so panels stay legible in light & dark.
 */
export const glass = (theme: Theme): SystemStyleObject<Theme> => {
  const isLight = theme.palette.mode === 'light';
  return {
    background: isLight ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: `1px solid ${isLight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 1.5,
    boxShadow: isLight ? '0 8px 28px rgba(16,20,38,0.08)' : '0 8px 28px rgba(0,0,0,0.32)',
  };
};
