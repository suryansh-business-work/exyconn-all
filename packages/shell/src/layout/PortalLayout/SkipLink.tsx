import { useT } from '@exyconn/i18n';
import { Link } from '@/components/ui';

/** The id the page's main region carries, so the skip link has somewhere to go. */
export const MAIN_CONTENT_ID = 'main-content';

/**
 * "Skip to main content" — the first thing a keyboard reaches on every portal page (WCAG 2.2
 * SC 2.4.1). Without it somebody on a keyboard or a switch tabs through the whole sidebar,
 * every page, before they reach what they came for.
 *
 * Off-screen until it is focused, then shown at the top-left over the topbar, so a mouse user
 * never sees it and a keyboard user cannot miss it.
 */
export function SkipLink() {
  const t = useT();
  return (
    <Link
      href={`#${MAIN_CONTENT_ID}`}
      sx={(theme) => ({
        position: 'absolute',
        left: theme.spacing(1),
        top: theme.spacing(-10),
        // Above the fixed topbar and its menus, or a focused link would be drawn behind them.
        zIndex: theme.zIndex.tooltip + 1,
        px: 2,
        py: 1,
        borderRadius: 1,
        bgcolor: 'background.paper',
        color: 'primary.main',
        boxShadow: 3,
        '&:focus': { top: theme.spacing(1) },
      })}
    >
      {t('Skip to main content')}
    </Link>
  );
}
